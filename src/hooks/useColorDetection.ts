import { useCallback } from 'react';

export interface DominantColor {
  name: string;
  hex: string;
}

export const useColorDetection = () => {
  const getDominantColor = useCallback((
    video: HTMLVideoElement,
    bbox: [number, number, number, number]
  ): DominantColor => {
    const [x, y, width, height] = bbox;
    
    // Criar canvas temporário
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return { name: 'desconhecido', hex: '#808080' };
    
    // Desenhar região do objeto
    ctx.drawImage(video, x, y, width, height, 0, 0, width, height);
    
    // Pegar dados da imagem
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Calcular cor média (simplificado)
    let r = 0, g = 0, b = 0;
    let count = 0;
    
    // Amostragem (pegar 1 a cada 10 pixels para performance)
    for (let i = 0; i < data.length; i += 40) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
    
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);
    
    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    const name = getColorName(r, g, b);
    
    return { name, hex };
  }, []);
  
  const getColorName = (r: number, g: number, b: number): string => {
    // Converter para HSL para melhor identificação de cor
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const l = (max + min) / 2;
    
    // Se muito escuro ou muito claro
    if (l < 0.15) return 'preto';
    if (l > 0.85) return 'branco';
    
    // Se é cinza (baixa saturação)
    const delta = max - min;
    if (delta < 0.1) return 'cinza';
    
    // Determinar matiz
    let h = 0;
    if (delta !== 0) {
      if (max === rNorm) {
        h = ((gNorm - bNorm) / delta) % 6;
      } else if (max === gNorm) {
        h = (bNorm - rNorm) / delta + 2;
      } else {
        h = (rNorm - gNorm) / delta + 4;
      }
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }
    
    // Mapear matiz para nome de cor
    if (h < 15 || h >= 345) return 'vermelho';
    if (h >= 15 && h < 45) return 'laranja';
    if (h >= 45 && h < 70) return 'amarelo';
    if (h >= 70 && h < 150) return 'verde';
    if (h >= 150 && h < 200) return 'ciano';
    if (h >= 200 && h < 260) return 'azul';
    if (h >= 260 && h < 300) return 'roxo';
    if (h >= 300 && h < 345) return 'rosa';
    
    return 'indefinido';
  };
  
  return { getDominantColor };
};
