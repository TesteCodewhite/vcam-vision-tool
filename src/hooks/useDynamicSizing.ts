import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SizeCalculation {
  widthCm: number;
  heightCm: number;
  distance: number;
  confidence: number;
}

interface LearnedObject {
  id: string;
  object_type: string;
  avg_width_cm: number;
  avg_height_cm: number;
  detection_count: number;
}

export const useDynamicSizing = () => {
  const [learnedObjects, setLearnedObjects] = useState<LearnedObject[]>([]);

  // Carregar objetos aprendidos do banco
  const loadLearnedObjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('learned_objects')
        .select('*');
      
      if (error) throw error;
      setLearnedObjects(data || []);
    } catch (error) {
      console.error('Erro ao carregar objetos aprendidos:', error);
    }
  }, []);

  // Calcular tamanho dinâmico baseado em dados aprendidos
  const calculateDynamicSize = useCallback(async (
    pixelWidth: number, 
    pixelHeight: number, 
    objectType: string,
    confidence: number
  ): Promise<SizeCalculation> => {
    
    // Procurar por objeto aprendido
    const learned = learnedObjects.find(obj => obj.object_type === objectType);
    
    let widthCm, heightCm, distance;
    
    if (learned && learned.detection_count > 3) {
      // Usar dados aprendidos
      widthCm = learned.avg_width_cm;
      heightCm = learned.avg_height_cm;
      
      // Calcular distância baseada no tamanho conhecido
      const focalLength = 600;
      const distanceFromWidth = (widthCm * focalLength) / pixelWidth;
      const distanceFromHeight = (heightCm * focalLength) / pixelHeight;
      distance = Math.round((distanceFromWidth + distanceFromHeight) / 2);
    } else {
      // Usar estimativa inicial e ajustar baseado na perspectiva
      const baseSize = getBaseSizeEstimate(objectType);
      
      // Fator de ajuste baseado na posição na tela (perspectiva)
      const perspectiveFactor = calculatePerspectiveFactor(pixelWidth, pixelHeight);
      
      widthCm = Math.round(baseSize.width * perspectiveFactor * 10) / 10;
      heightCm = Math.round(baseSize.height * perspectiveFactor * 10) / 10;
      
      const focalLength = 600;
      const distanceFromWidth = (widthCm * focalLength) / pixelWidth;
      distance = Math.max(20, Math.min(300, Math.round(distanceFromWidth)));
    }

    // Salvar detecção no banco para aprendizado
    await saveDetection(objectType, confidence, widthCm, heightCm, pixelWidth, pixelHeight, distance);
    
    // Atualizar objeto aprendido
    await updateLearnedObject(objectType, widthCm, heightCm, confidence);

    return {
      widthCm,
      heightCm, 
      distance,
      confidence
    };
  }, [learnedObjects]);

  // Salvar detecção no banco
  const saveDetection = async (
    objectType: string, 
    confidence: number, 
    widthCm: number, 
    heightCm: number,
    pixelWidth: number,
    pixelHeight: number,
    distance: number
  ) => {
    try {
      await supabase.from('object_detections').insert({
        object_type: objectType,
        confidence,
        actual_width_cm: widthCm,
        actual_height_cm: heightCm,
        pixel_width: pixelWidth,
        pixel_height: pixelHeight,
        distance_cm: distance,
        learned_size: learnedObjects.some(obj => obj.object_type === objectType)
      });
    } catch (error) {
      console.error('Erro ao salvar detecção:', error);
    }
  };

  // Atualizar objeto aprendido
  const updateLearnedObject = async (objectType: string, widthCm: number, heightCm: number, confidence: number) => {
    try {
      const existing = learnedObjects.find(obj => obj.object_type === objectType);
      
      if (existing) {
        // Atualizar média
        const newCount = existing.detection_count + 1;
        const newAvgWidth = ((existing.avg_width_cm * existing.detection_count) + widthCm) / newCount;
        const newAvgHeight = ((existing.avg_height_cm * existing.detection_count) + heightCm) / newCount;
        
        const { error } = await supabase
          .from('learned_objects')
          .update({
            avg_width_cm: Math.round(newAvgWidth * 10) / 10,
            avg_height_cm: Math.round(newAvgHeight * 10) / 10,
            detection_count: newCount,
            last_seen: new Date().toISOString()
          })
          .eq('id', existing.id);
          
        if (error) throw error;
        
        // Atualizar estado local
        setLearnedObjects(prev => prev.map(obj => 
          obj.id === existing.id 
            ? { ...obj, avg_width_cm: newAvgWidth, avg_height_cm: newAvgHeight, detection_count: newCount }
            : obj
        ));
      } else if (confidence > 0.7) {
        // Criar novo objeto aprendido com alta confiança
        const { data, error } = await supabase
          .from('learned_objects')
          .insert({
            object_type: objectType,
            avg_width_cm: widthCm,
            avg_height_cm: heightCm,
            detection_count: 1,
            confidence_threshold: 0.7
          })
          .select()
          .single();
          
        if (error) throw error;
        
        setLearnedObjects(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Erro ao atualizar objeto aprendido:', error);
    }
  };

  return {
    calculateDynamicSize,
    loadLearnedObjects,
    learnedObjects
  };
};

// Estimativas base para objetos
const getBaseSizeEstimate = (objectType: string) => {
  const baseSizes: Record<string, { width: number; height: number }> = {
    'cell phone': { width: 7.5, height: 15.5 },
    'bottle': { width: 6.5, height: 25.0 },
    'cup': { width: 8.0, height: 9.5 },
    'laptop': { width: 30.0, height: 21.0 },
    'book': { width: 15.0, height: 23.0 },
    'car': { width: 180.0, height: 150.0 },
    'motorcycle': { width: 80.0, height: 120.0 },
    'mouse': { width: 6.0, height: 11.0 },
    'keyboard': { width: 45.0, height: 15.0 },
    'banana': { width: 3.0, height: 18.0 },
    'apple': { width: 8.0, height: 8.5 },
    'orange': { width: 7.5, height: 7.5 }
  };
  
  return baseSizes[objectType] || { width: 10.0, height: 10.0 };
};

// Calcular fator de perspectiva baseado no tamanho na tela
const calculatePerspectiveFactor = (pixelWidth: number, pixelHeight: number) => {
  // Objetos menores na tela geralmente estão mais longe
  const sizeIndex = Math.sqrt(pixelWidth * pixelHeight);
  
  // Normalizar para um fator entre 0.5 e 1.5
  const baseFactor = 1.0;
  const adjustment = (sizeIndex - 100) / 200; // Ajuste baseado no tamanho
  
  return Math.max(0.5, Math.min(1.5, baseFactor + adjustment));
};