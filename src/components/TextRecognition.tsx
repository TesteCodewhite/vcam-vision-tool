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

      // Configurar canvas com resolução otimizada
      const scale = 2; // Aumenta resolução para melhor OCR
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;
      ctx.scale(scale, scale);
      ctx.drawImage(video, 0, 0);

      // Pré-processamento avançado da imagem
      const imageDataUrl = preprocessImageForOCR(ctx, canvas);

      // Executar OCR com configurações otimizadas para placas
      const { data } = await Tesseract.recognize(imageDataUrl, 'eng', {
        logger: m => console.log(m),
      });

      // Processar resultados com correção de erros
      const detections: TextDetection[] = [];
      
      if (data.text && data.text.trim().length > 0) {
        // Dividir em linhas e processar cada uma
        const lines = data.text.split('\n').filter(line => line.trim().length >= 6);
        
        for (const line of lines) {
          const cleanedText = correctCommonOCRErrors(line);
          const isLicensePlate = detectLicensePlate(cleanedText);
          
          // Só adicionar se for placa ou tiver alta confiança
          if (isLicensePlate || data.confidence > 75) {
            const detection: TextDetection = {
              id: `${Date.now()}-${Math.random()}`,
              text: cleanedText,
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
        }
      }

      setTextDetections(detections);

    } catch (error) {
      console.error('Erro no reconhecimento de texto:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const preprocessImageForOCR = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): string => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // 1. Converter para escala de cinza
    const grayData = new Uint8ClampedArray(canvas.width * canvas.height);
    for (let i = 0; i < data.length; i += 4) {
      grayData[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }
    
    // 2. CLAHE (Contrast Limited Adaptive Histogram Equalization)
    const claheData = applyCLAHE(grayData, canvas.width, canvas.height);
    
    // 3. Binarização adaptativa (Otsu's method simplificado)
    const threshold = calculateOtsuThreshold(claheData);
    
    // 4. Aplicar threshold e redução de ruído
    for (let i = 0; i < data.length; i += 4) {
      const grayValue = claheData[i / 4];
      const binary = grayValue > threshold ? 255 : 0;
      
      // Redução de ruído: manter apenas valores extremos
      const finalValue = binary > 200 ? 255 : binary < 50 ? 0 : 128;
      
      data[i] = finalValue;
      data[i + 1] = finalValue;
      data[i + 2] = finalValue;
    }
    
    // 5. Sharpening para melhorar bordas
    const sharpened = applySharpen(data, canvas.width, canvas.height);
    
    ctx.putImageData(sharpened, 0, 0);
    return canvas.toDataURL('image/png');
  };

  const applyCLAHE = (data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray => {
    const result = new Uint8ClampedArray(data.length);
    const tileSize = 8;
    const clipLimit = 2.0;
    
    for (let y = 0; y < height; y += tileSize) {
      for (let x = 0; x < width; x += tileSize) {
        const histogram = new Array(256).fill(0);
        
        // Calcular histograma do tile
        for (let ty = 0; ty < tileSize && y + ty < height; ty++) {
          for (let tx = 0; tx < tileSize && x + tx < width; tx++) {
            const idx = (y + ty) * width + (x + tx);
            histogram[data[idx]]++;
          }
        }
        
        // Clip e redistribuir
        const excess = histogram.reduce((sum, val) => sum + Math.max(0, val - clipLimit), 0);
        const redistribute = excess / 256;
        
        for (let i = 0; i < 256; i++) {
          histogram[i] = Math.min(clipLimit, histogram[i]) + redistribute;
        }
        
        // CDF para equalização
        const cdf = new Array(256);
        cdf[0] = histogram[0];
        for (let i = 1; i < 256; i++) {
          cdf[i] = cdf[i - 1] + histogram[i];
        }
        
        const cdfMin = cdf.find(v => v > 0) || 0;
        const cdfMax = cdf[255];
        
        // Aplicar equalização
        for (let ty = 0; ty < tileSize && y + ty < height; ty++) {
          for (let tx = 0; tx < tileSize && x + tx < width; tx++) {
            const idx = (y + ty) * width + (x + tx);
            const oldValue = data[idx];
            result[idx] = Math.round(((cdf[oldValue] - cdfMin) / (cdfMax - cdfMin)) * 255);
          }
        }
      }
    }
    
    return result;
  };

  const calculateOtsuThreshold = (data: Uint8ClampedArray): number => {
    const histogram = new Array(256).fill(0);
    data.forEach(value => histogram[value]++);
    
    const total = data.length;
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }
    
    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVariance = 0;
    let threshold = 0;
    
    for (let i = 0; i < 256; i++) {
      wB += histogram[i];
      if (wB === 0) continue;
      
      wF = total - wB;
      if (wF === 0) break;
      
      sumB += i * histogram[i];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      
      const variance = wB * wF * Math.pow(mB - mF, 2);
      
      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = i;
      }
    }
    
    return threshold;
  };

  const applySharpen = (data: Uint8ClampedArray, width: number, height: number): ImageData => {
    const result = new ImageData(width, height);
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += data[idx] * kernel[kernelIdx];
          }
        }
        
        const idx = (y * width + x) * 4;
        const value = Math.max(0, Math.min(255, sum));
        result.data[idx] = value;
        result.data[idx + 1] = value;
        result.data[idx + 2] = value;
        result.data[idx + 3] = 255;
      }
    }
    
    return result;
  };

  const correctCommonOCRErrors = (text: string): string => {
    let corrected = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Correções comuns em placas
    const corrections: { [key: string]: string } = {
      'O': '0', // O pode ser zero em posições numéricas
      'I': '1', // I pode ser 1
      'Z': '2', // Z pode ser 2
      'S': '5', // S pode ser 5
      'B': '8', // B pode ser 8
      'G': '6', // G pode ser 6
    };
    
    // Aplicar correções baseadas em padrão de placa
    // Formato: ABC1D34 ou ABC1234
    if (corrected.length >= 7) {
      // Primeiras 3 posições devem ser letras
      for (let i = 0; i < 3; i++) {
        const char = corrected[i];
        if (/[0-9]/.test(char)) {
          // Converter números em letras semelhantes
          if (char === '0') corrected = corrected.substring(0, i) + 'O' + corrected.substring(i + 1);
          if (char === '1') corrected = corrected.substring(0, i) + 'I' + corrected.substring(i + 1);
          if (char === '5') corrected = corrected.substring(0, i) + 'S' + corrected.substring(i + 1);
          if (char === '8') corrected = corrected.substring(0, i) + 'B' + corrected.substring(i + 1);
        }
      }
      
      // Posição 4 deve ser número
      if (corrected.length > 3 && /[A-Z]/.test(corrected[3])) {
        const letterToNum = Object.entries(corrections).find(([k, v]) => k === corrected[3]);
        if (letterToNum) {
          corrected = corrected.substring(0, 3) + letterToNum[1] + corrected.substring(4);
        }
      }
    }
    
    return corrected;
  };

  const detectLicensePlate = (text: string): boolean => {
    const cleanText = text.replace(/[^A-Z0-9]/g, '').toUpperCase();
    
    // Verificação de comprimento primeiro
    if (cleanText.length < 6 || cleanText.length > 8) return false;
    
    // Padrões brasileiros e internacionais de placa
    const patterns = [
      /^[A-Z]{3}[0-9]{4}$/, // ABC1234 (Brasil antigo)
      /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/, // ABC1D23 (Mercosul)
      /^[A-Z]{3}[0-9]{3}$/, // ABC123 (alguns países)
      /^[A-Z]{2}[0-9]{2}[A-Z]{2}$/, // AB12CD (Europa)
      /^[A-Z]{2}[0-9]{2}[A-Z]{3}$/, // AB12CDE (Europeu)
      /^[0-9]{3}[A-Z]{3}$/, // 123ABC (Alguns países)
      /^[A-Z][0-9]{3}[A-Z]{3}$/, // A123BCD (UK style)
    ];

    // Verificar se corresponde a algum padrão
    const matchesPattern = patterns.some(pattern => pattern.test(cleanText));
    
    // Verificação adicional: deve ter mix de letras e números
    const hasLetters = /[A-Z]/.test(cleanText);
    const hasNumbers = /[0-9]/.test(cleanText);
    
    return matchesPattern && hasLetters && hasNumbers;
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