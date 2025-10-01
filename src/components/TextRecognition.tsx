import { useEffect, useRef, useState } from 'react';
import Tesseract from 'tesseract.js';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface TextDetection {
  id: string;
  text: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isLicensePlate: boolean;
}

interface TextRecognitionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
}

export const TextRecognition = ({ videoRef, isActive }: TextRecognitionProps) => {
  const [textDetections, setTextDetections] = useState<TextDetection[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && videoRef.current) {
      startTextRecognition();
    } else {
      stopTextRecognition();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const startTextRecognition = () => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(async () => {
      if (videoRef.current && canvasRef.current && !isProcessing) {
        await processVideoFrame();
      }
    }, 3000); // Processa a cada 3 segundos para não sobrecarregar
  };

  const stopTextRecognition = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTextDetections([]);
  };

  const processVideoFrame = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    setIsProcessing(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Configurar canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Pré-processamento da imagem para melhorar OCR
      const imageDataUrl = preprocessImageForOCR(ctx, canvas);

      // Executar OCR com configurações otimizadas para placas
      const { data } = await Tesseract.recognize(imageDataUrl, 'eng+por', {
        logger: m => console.log(m),
      });

      // Processar resultados
      const detections: TextDetection[] = [];
      
      if (data.text && data.text.trim().length > 0) {
        const isLicensePlate = detectLicensePlate(data.text);
        
        const detection: TextDetection = {
          id: `${Date.now()}-${Math.random()}`,
          text: data.text.trim(),
          confidence: data.confidence,
          x: 0,
          y: 0,
          width: canvas.width,
          height: canvas.height,
          isLicensePlate
        };

        detections.push(detection);
        await saveTextDetection(detection);
      }

      setTextDetections(detections);

    } catch (error) {
      console.error('Erro no reconhecimento de texto:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const preprocessImageForOCR = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): string => {
    // Pegar dados da imagem
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Converter para escala de cinza e aplicar contrast enhancement
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      // Aumentar contraste
      const enhanced = avg < 128 ? Math.max(0, avg - 30) : Math.min(255, avg + 30);
      data[i] = enhanced;
      data[i + 1] = enhanced;
      data[i + 2] = enhanced;
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  };

  const detectLicensePlate = (text: string): boolean => {
    // Padrões brasileiros e internacionais de placa
    const patterns = [
      /^[A-Z]{3}[0-9]{4}$/, // ABC1234 (Brasil antigo)
      /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/, // ABC1D23 (Mercosul)
      /^[A-Z]{3}-?[0-9]{4}$/, // ABC-1234
      /^[A-Z]{3}-?[0-9][A-Z][0-9]{2}$/, // ABC-1D23
      /^[A-Z]{2}[0-9]{2}[A-Z]{3}$/, // Europeu
      /^[A-Z]{3}[0-9]{3}$/, // Internacional
    ];

    const cleanText = text.replace(/[^A-Z0-9]/g, '').toUpperCase();
    return patterns.some(pattern => pattern.test(cleanText));
  };

  const saveTextDetection = async (detection: TextDetection) => {
    try {
      await supabase.from('text_detections').insert({
        detected_text: detection.text,
        confidence: detection.confidence,
        object_type: detection.isLicensePlate ? 'license_plate' : 'text',
        x_position: detection.x,
        y_position: detection.y,
        width: detection.width,
        height: detection.height,
        is_license_plate: detection.isLicensePlate
      });
    } catch (error) {
      console.error('Erro ao salvar detecção de texto:', error);
    }
  };

  if (!isActive) return null;

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />
      
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">
              Reconhecimento de Texto {isProcessing && '(Processando...)'}
            </h4>
            <Badge variant={textDetections.length > 0 ? 'default' : 'secondary'}>
              {textDetections.length} textos
            </Badge>
          </div>

          {textDetections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum texto detectado
            </p>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {textDetections.map((detection) => (
                <div 
                  key={detection.id}
                  className={`p-2 rounded text-sm border ${
                    detection.isLicensePlate 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border/30 bg-background/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {detection.isLicensePlate && '🚗 '}
                      {detection.text}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(detection.confidence)}%
                    </span>
                  </div>
                  {detection.isLicensePlate && (
                    <Badge variant="outline" className="text-xs mt-1">
                      PLACA DETECTADA
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};