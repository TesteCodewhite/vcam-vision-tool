-- Criar tabelas para machine learning e reconhecimento de objetos
CREATE TABLE public.object_detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  object_type TEXT NOT NULL,
  confidence REAL NOT NULL,
  actual_width_cm REAL,
  actual_height_cm REAL,
  pixel_width INTEGER NOT NULL,
  pixel_height INTEGER NOT NULL,
  distance_cm REAL,
  camera_distance REAL,
  learned_size BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para armazenar reconhecimento de texto/OCR
CREATE TABLE public.text_detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  detected_text TEXT NOT NULL,
  confidence REAL NOT NULL,
  object_type TEXT, -- 'license_plate', 'sign', 'document', etc
  x_position INTEGER NOT NULL,
  y_position INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  is_license_plate BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para learning de objetos específicos
CREATE TABLE public.learned_objects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  object_type TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  color TEXT,
  avg_width_cm REAL NOT NULL,
  avg_height_cm REAL NOT NULL,
  detection_count INTEGER DEFAULT 1,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confidence_threshold REAL DEFAULT 0.7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para versioning do projeto
CREATE TABLE public.project_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version_name TEXT NOT NULL,
  description TEXT,
  features_enabled JSONB NOT NULL DEFAULT '{}',
  algorithm_version TEXT NOT NULL DEFAULT 'v1.0',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.object_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.text_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learned_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;

-- Policies (público para demonstração, ajuste conforme necessário)
CREATE POLICY "Allow all access to object_detections" 
ON public.object_detections 
FOR ALL 
USING (true);

CREATE POLICY "Allow all access to text_detections" 
ON public.text_detections 
FOR ALL 
USING (true);

CREATE POLICY "Allow all access to learned_objects" 
ON public.learned_objects 
FOR ALL 
USING (true);

CREATE POLICY "Allow all access to project_versions" 
ON public.project_versions 
FOR ALL 
USING (true);

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para timestamps
CREATE TRIGGER update_object_detections_updated_at
BEFORE UPDATE ON public.object_detections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learned_objects_updated_at
BEFORE UPDATE ON public.learned_objects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir versão inicial do projeto
INSERT INTO public.project_versions (version_name, description, features_enabled, is_active)
VALUES ('v1.0', 'Versão inicial com detecção básica', 
        '{"basic_detection": true, "vehicle_highlight": true, "size_calculation": "fixed"}', 
        true);