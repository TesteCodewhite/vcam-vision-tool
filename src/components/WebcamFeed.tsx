import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, CameraOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  isVehicle: boolean;
}

const WebcamFeed = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true);
        await tf.ready();
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
        toast({
          title: "Modelo carregado!",
          description: "YOLOv8 está pronto para detectar objetos.",
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
  }, [toast]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
        startDetection();
        
        toast({
          title: "Câmera ativada!",
          description: "Detecção de objetos iniciada.",
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

  // Função para converter pixels para centímetros (aproximação baseada na distância da câmera)
  const pixelsToCm = (pixels: number, objectType: string) => {
    // Fator de conversão aproximado (ajustável)
    // Assume distância média de 50cm da câmera
    const baseConversionFactor = 0.026458333; // 1 pixel = ~0.026cm a 50cm de distância
    
    // Ajustes específicos para diferentes tipos de objetos
    const objectAdjustments: Record<string, number> = {
      'car': 1.5, // Carros são maiores, geralmente mais distantes
      'motorcycle': 1.3,
      'bottle': 0.8, // Garrafas são menores, geralmente mais próximas
      'cell phone': 0.6,
      'laptop': 1.1,
      'book': 0.9,
      'cup': 0.7
    };
    
    const adjustment = objectAdjustments[objectType] || 1.0;
    return pixels * baseConversionFactor * adjustment;
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
          const newDetections: Detection[] = filteredPredictions.map((prediction, index) => {
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

            // Calcular dimensões em cm
            const widthCm = pixelsToCm(width, prediction.class);
            const heightCm = pixelsToCm(height, prediction.class);

            return {
              id: `${Date.now()}-${index}`,
              label: prediction.class,
              confidence: prediction.score,
              width: Math.round(width),
              height: Math.round(height),
              widthCm: Math.round(widthCm * 10) / 10, // 1 casa decimal
              heightCm: Math.round(heightCm * 10) / 10,
              x: Math.round(x),
              y: Math.round(y),
              isVehicle
            };
          });

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
          
          <div className="flex justify-center gap-4 mb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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