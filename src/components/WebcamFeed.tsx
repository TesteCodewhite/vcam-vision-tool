import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, CameraOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDynamicSizing } from "@/hooks/useDynamicSizing";
import { TextRecognition } from "@/components/TextRecognition";
import { VersionControl } from "@/components/VersionControl";

interface Detection {
  id: string;
  label: string;
  confidence: number;
  width: number;
  height: number;
  widthCm: number;
  heightCm: number;
  x: number;
  y: number;
  distance: number;
  isVehicle: boolean;
}

interface ObjectRecord {
  label: string;
  count: number;
  lastSeen: Date;
  avgConfidence: number;
}

const WebcamFeed = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [objectRecords, setObjectRecords] = useState<ObjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<'user' | 'environment'>('environment');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentFeatures, setCurrentFeatures] = useState({
    basic_detection: true,
    size_calculation: 'dynamic',
    vehicle_highlight: true,
    text_recognition: true,
    machine_learning: true
  });
  const { toast } = useToast();
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { calculateDynamicSize, loadLearnedObjects } = useDynamicSizing();

  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true);
        await tf.ready();
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
        
        // Detectar câmeras disponíveis
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        
        // Carregar objetos aprendidos
        await loadLearnedObjects();
        
        toast({
          title: "Modelo carregado!",
          description: "COCO-SSD está pronto para detectar objetos.",
        });
      } catch (error) {
        console.error("Erro ao carregar modelo:", error);
        toast({
          title: "Erro",
          description: "Falha ao carregar o modelo de detecção.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadModel();
  }, [toast, loadLearnedObjects]);

  const startWebcam = async () => {
    try {
      const constraints = {
        video: { 
          width: 640, 
          height: 480,
          facingMode: selectedCamera
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
        startDetection();
        
        toast({
          title: "Câmera ativada!",
          description: `Detecção iniciada com câmera ${selectedCamera === 'environment' ? 'traseira' : 'frontal'}.`,
        });
      }
    } catch (error) {
      console.error("Erro ao acessar webcam:", error);
      toast({
        title: "Erro de câmera",
        description: "Não foi possível acessar a webcam.",
        variant: "destructive",
      });
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    setIsStreaming(false);
    setDetections([]);
    
    toast({
      title: "Câmera desativada",
      description: "Detecção pausada.",
    });
  };

  // Função melhorada para converter pixels para centímetros e calcular distância
  const calculateObjectMeasurements = (pixelWidth: number, pixelHeight: number, objectType: string) => {
    // Tamanhos reais conhecidos de objetos comuns (em cm)
    const realObjectSizes: Record<string, { width: number; height: number }> = {
      'cell phone': { width: 7.5, height: 15.5 }, // iPhone/Android médio
      'bottle': { width: 6.5, height: 25.0 }, // Garrafa de água 500ml
      'cup': { width: 8.0, height: 9.5 }, // Xícara padrão
      'laptop': { width: 30.0, height: 21.0 }, // Laptop 14"
      'book': { width: 15.0, height: 23.0 }, // Livro padrão
      'car': { width: 180.0, height: 150.0 }, // Carro médio
      'motorcycle': { width: 80.0, height: 120.0 }, // Moto
      'mouse': { width: 6.0, height: 11.0 }, // Mouse de computador
      'keyboard': { width: 45.0, height: 15.0 }, // Teclado
      'banana': { width: 3.0, height: 18.0 }, // Banana
      'apple': { width: 8.0, height: 8.5 }, // Maçã
      'orange': { width: 7.5, height: 7.5 }, // Laranja
    };
    
    const realSize = realObjectSizes[objectType];
    if (!realSize) {
      // Fallback para objetos desconhecidos
      return {
        widthCm: Math.round(pixelWidth * 0.03 * 10) / 10,
        heightCm: Math.round(pixelHeight * 0.03 * 10) / 10,
        distance: 50 // Distância padrão
      };
    }
    
    // Calcular distância baseada no tamanho conhecido do objeto
    // Fórmula: distância = (tamanho_real * distância_focal) / tamanho_pixel
    const focalLength = 600; // Distância focal aproximada em pixels para webcam
    const distanceFromWidth = (realSize.width * focalLength) / pixelWidth;
    const distanceFromHeight = (realSize.height * focalLength) / pixelHeight;
    const estimatedDistance = Math.round((distanceFromWidth + distanceFromHeight) / 2);
    
    return {
      widthCm: realSize.width,
      heightCm: realSize.height,
      distance: Math.max(20, Math.min(300, estimatedDistance)) // Limitar entre 20cm e 3m
    };
  };
  
  // Função para atualizar registro de objetos
  const updateObjectRecord = (label: string, confidence: number) => {
    setObjectRecords(prev => {
      const existing = prev.find(record => record.label === label);
      if (existing) {
        return prev.map(record => 
          record.label === label 
            ? {
                ...record,
                count: record.count + 1,
                lastSeen: new Date(),
                avgConfidence: (record.avgConfidence + confidence) / 2
              }
            : record
        );
      } else {
        return [...prev, {
          label,
          count: 1,
          lastSeen: new Date(),
          avgConfidence: confidence
        }];
      }
    });
  };

  const startDetection = () => {
    if (!model || !videoRef.current) return;

    detectionIntervalRef.current = setInterval(async () => {
      if (videoRef.current && canvasRef.current && model) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          // Ajustar canvas para o tamanho do vídeo
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Detectar objetos
          const predictions = await model.detect(video);
          
          // Filtrar objetos (excluir "person" conforme solicitado)
          const filteredPredictions = predictions.filter(
            prediction => prediction.class !== "person"
          );

          // Limpar canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Processar detecções
          const newDetections: Detection[] = [];
          
          for (let index = 0; index < filteredPredictions.length; index++) {
            const prediction = filteredPredictions[index];
            const [x, y, width, height] = prediction.bbox;
            const isVehicle = ['car', 'motorcycle', 'bus', 'truck', 'bicycle'].includes(prediction.class);
            
            // Cores diferentes para veículos
            const strokeColor = isVehicle ? "#ff6b35" : "#00ff00";
            const fillColor = isVehicle ? "#ff6b35" : "#00ff00";
            
            // Desenhar bounding box
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = isVehicle ? 3 : 2;
            ctx.strokeRect(x, y, width, height);
            
            // Desenhar label com destaque para veículos
            ctx.fillStyle = fillColor;
            ctx.font = isVehicle ? "18px Arial Bold" : "16px Arial";
            const vehicleIcon = prediction.class === 'car' ? '🚗 ' : prediction.class === 'motorcycle' ? '🏍️ ' : '';
            const text = `${vehicleIcon}${prediction.class} (${Math.round(prediction.score * 100)}%)`;
            ctx.fillText(text, x, y - 8);

            // Calcular dimensões e distância usando sistema dinâmico
            const measurements = currentFeatures.size_calculation === 'dynamic' 
              ? await calculateDynamicSize(width, height, prediction.class, prediction.score)
              : calculateObjectMeasurements(width, height, prediction.class);
            
            // Atualizar registro do objeto
            updateObjectRecord(prediction.class, prediction.score);

            const detection: Detection = {
              id: `${Date.now()}-${index}`,
              label: prediction.class,
              confidence: prediction.score,
              width: Math.round(width),
              height: Math.round(height),
              widthCm: measurements.widthCm,
              heightCm: measurements.heightCm,
              distance: measurements.distance,
              x: Math.round(x),
              y: Math.round(y),
              isVehicle
            };
            
            newDetections.push(detection);
          }

          setDetections(newDetections);
        }
      }
    }, 1000); // 1 frame por segundo
  };

  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  return (
    <section className="py-16 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent mb-4">
            Detecção em Tempo Real
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Use sua webcam para detectar objetos e suas dimensões em tempo real
          </p>
          
          <div className="flex flex-col items-center gap-4 mb-8">
            {/* Seleção de câmera para dispositivos móveis */}
            {availableCameras.length > 1 && (
              <div className="flex gap-2">
                <Button
                  variant={selectedCamera === 'environment' ? 'default' : 'outline'}
                  onClick={() => setSelectedCamera('environment')}
                  size="sm"
                >
                  📱 Traseira
                </Button>
                <Button
                  variant={selectedCamera === 'user' ? 'default' : 'outline'}
                  onClick={() => setSelectedCamera('user')}
                  size="sm"
                >
                  🤳 Frontal
                </Button>
              </div>
            )}
            
            <div className="flex gap-4">
              {!isStreaming ? (
                <Button
                  onClick={startWebcam}
                  disabled={!model || isLoading}
                  className="bg-gradient-primary hover:shadow-glow-primary"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isLoading ? "Carregando modelo..." : "Iniciar Câmera"}
                </Button>
              ) : (
                <Button
                  onClick={stopWebcam}
                  variant="destructive"
                >
                  <CameraOff className="w-4 h-4 mr-2" />
                  Parar Câmera
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Feed da câmera */}
          <div className="relative">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-6">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-auto"
                    style={{ maxHeight: "400px" }}
                    muted
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full"
                    style={{ pointerEvents: "none" }}
                  />
                  {!isStreaming && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                      <div className="text-center">
                        <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Clique em "Iniciar Câmera" para começar
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resultados das detecções */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-foreground">
              Objetos Detectados ({detections.length})
            </h3>
            
            {detections.length === 0 ? (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    {isStreaming ? "Nenhum objeto detectado" : "Inicie a câmera para ver detecções"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {detections.map((detection) => (
                  <Card 
                    key={detection.id} 
                    className={`bg-card/50 backdrop-blur-sm ${
                      detection.isVehicle 
                        ? 'border-primary/50 bg-primary/5' 
                        : 'border-border/50'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className={`font-semibold capitalize flex items-center gap-2 ${
                            detection.isVehicle ? 'text-primary' : 'text-foreground'
                          }`}>
                            {detection.label === 'car' && '🚗'}
                            {detection.label === 'motorcycle' && '🏍️'}
                            {detection.isVehicle && <Badge variant="secondary" className="text-xs">VEÍCULO</Badge>}
                            {detection.label}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Confiança: {Math.round(detection.confidence * 100)}%
                          </p>
                        </div>
                         <div className="text-right text-sm space-y-1">
                           <div className="text-primary font-semibold">
                             {detection.widthCm >= 100 
                               ? `${(detection.widthCm / 100).toFixed(1)}m × ${(detection.heightCm / 100).toFixed(1)}m`
                               : `${detection.widthCm}cm × ${detection.heightCm}cm`
                             }
                           </div>
                           <div className="text-xs text-accent font-medium">
                             📏 Distância: {detection.distance}cm
                           </div>
                           <div className="text-xs text-muted-foreground">
                             {detection.width} × {detection.height}px
                           </div>
                           <div className="text-xs text-muted-foreground">
                             Pos: ({detection.x}, {detection.y})
                           </div>
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Registro de Objetos Detectados */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-foreground">
              Registro de Objetos ({objectRecords.length})
            </h3>
            
            {objectRecords.length === 0 ? (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    Nenhum objeto registrado ainda
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {objectRecords
                  .sort((a, b) => b.count - a.count)
                  .map((record, index) => (
                  <Card key={record.label} className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold capitalize flex items-center gap-2">
                            {record.label === 'car' && '🚗'}
                            {record.label === 'motorcycle' && '🏍️'}
                            {record.label === 'cell phone' && '📱'}
                            {record.label === 'bottle' && '🍼'}
                            {record.label === 'cup' && '☕'}
                            {record.label === 'laptop' && '💻'}
                            {record.label === 'book' && '📚'}
                            {record.label}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Última detecção: {record.lastSeen.toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="mb-1">
                            {record.count}x visto
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            Confiança média: {Math.round(record.avgConfidence * 100)}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Controle de Versão */}
          <div className="space-y-4">
            <VersionControl 
              onVersionChange={setCurrentFeatures}
              currentFeatures={currentFeatures}
            />
            
            {/* Reconhecimento de Texto */}
            {currentFeatures.text_recognition && (
              <TextRecognition 
                videoRef={videoRef}
                isActive={isStreaming}
              />
            )}
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="font-semibold text-foreground mb-2">Tecnologia Utilizada</h3>
            <p className="text-sm text-muted-foreground">
              Powered by TensorFlow.js + COCO-SSD - Detecção de objetos em tempo real 
              diretamente no navegador, sem necessidade de servidor backend.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WebcamFeed;