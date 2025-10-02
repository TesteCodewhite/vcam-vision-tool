import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrackedObject {
  objectType: string;
  color: string;
  firstSeen: Date;
  lastSeen: Date;
  totalTimeSeconds: number;
  detectionCount: number;
  isActive: boolean;
}

export const useObjectTracking = () => {
  const [trackedObjects, setTrackedObjects] = useState<Map<string, TrackedObject>>(new Map());
  const sessionId = useRef<string>(`session-${Date.now()}`);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Atualizar tempo de objetos ativos a cada segundo
  useEffect(() => {
    trackingIntervalRef.current = setInterval(() => {
      setTrackedObjects(prev => {
        const updated = new Map(prev);
        const now = Date.now();
        
        updated.forEach((obj, key) => {
          if (obj.isActive) {
            const timeElapsed = Math.floor((now - obj.lastSeen.getTime()) / 1000);
            if (timeElapsed > 3) {
              // Marcar como inativo se não visto há mais de 3 segundos
              updated.set(key, { ...obj, isActive: false });
            } else {
              // Incrementar tempo total
              updated.set(key, { 
                ...obj, 
                totalTimeSeconds: obj.totalTimeSeconds + 1 
              });
            }
          }
        });
        
        return updated;
      });
    }, 1000);
    
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);
  
  const updateTracking = useCallback(async (
    objectType: string,
    color: string,
    confidence: number
  ) => {
    const key = `${objectType}-${color}`;
    const now = new Date();
    
    setTrackedObjects(prev => {
      const updated = new Map(prev);
      const existing = updated.get(key);
      
      if (existing) {
        updated.set(key, {
          ...existing,
          lastSeen: now,
          detectionCount: existing.detectionCount + 1,
          isActive: true,
        });
      } else {
        updated.set(key, {
          objectType,
          color,
          firstSeen: now,
          lastSeen: now,
          totalTimeSeconds: 0,
          detectionCount: 1,
          isActive: true,
        });
      }
      
      return updated;
    });
  }, []);
  
  const saveToDatabase = useCallback(async () => {
    const objectsToSave = Array.from(trackedObjects.values()).filter(
      obj => obj.totalTimeSeconds >= 2 // Só salvar objetos vistos por pelo menos 2s
    );
    
    for (const obj of objectsToSave) {
      try {
        // Verificar se já existe registro similar recente
        const { data: existing } = await supabase
          .from('object_tracking')
          .select('*')
          .eq('object_type', obj.objectType)
          .eq('color', obj.color)
          .eq('session_id', sessionId.current)
          .maybeSingle();
        
        if (existing) {
          // Atualizar registro existente
          await supabase
            .from('object_tracking')
            .update({
              last_seen: obj.lastSeen.toISOString(),
              total_time_seconds: obj.totalTimeSeconds,
              detection_count: obj.detectionCount,
            })
            .eq('id', existing.id);
        } else {
          // Criar novo registro
          await supabase
            .from('object_tracking')
            .insert({
              object_type: obj.objectType,
              color: obj.color,
              first_seen: obj.firstSeen.toISOString(),
              last_seen: obj.lastSeen.toISOString(),
              total_time_seconds: obj.totalTimeSeconds,
              detection_count: obj.detectionCount,
              avg_confidence: 0.8, // placeholder
              session_id: sessionId.current,
            });
        }
      } catch (error) {
        console.error('Erro ao salvar tracking:', error);
      }
    }
  }, [trackedObjects]);
  
  // Salvar no banco a cada 10 segundos
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveToDatabase();
    }, 10000);
    
    return () => clearInterval(saveInterval);
  }, [saveToDatabase]);
  
  const clearTracking = useCallback(() => {
    setTrackedObjects(new Map());
  }, []);
  
  return {
    trackedObjects,
    updateTracking,
    clearTracking,
    saveToDatabase,
  };
};
