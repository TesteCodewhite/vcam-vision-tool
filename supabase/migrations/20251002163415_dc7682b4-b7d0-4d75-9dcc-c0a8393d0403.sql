-- Criar tabela para changelogs
CREATE TABLE IF NOT EXISTS public.changelogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL,
  version_number TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('feature', 'improvement', 'fix', 'update', 'refactor')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  user_facing_changes TEXT[] NOT NULL DEFAULT '{}',
  technical_changes TEXT[] NOT NULL DEFAULT '{}',
  release_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.changelogs ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to changelogs"
ON public.changelogs
FOR SELECT
USING (is_published = true);

-- Create policy for all access
CREATE POLICY "Allow all access to changelogs"
ON public.changelogs
FOR ALL
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_changelogs_updated_at
BEFORE UPDATE ON public.changelogs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela para tracking de objetos detectados com cor e tempo
CREATE TABLE IF NOT EXISTS public.object_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  object_type TEXT NOT NULL,
  color TEXT,
  first_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_time_seconds INTEGER NOT NULL DEFAULT 0,
  detection_count INTEGER NOT NULL DEFAULT 1,
  avg_confidence REAL NOT NULL,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.object_tracking ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Allow all access to object_tracking"
ON public.object_tracking
FOR ALL
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_object_tracking_updated_at
BEFORE UPDATE ON public.object_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir changelogs iniciais
INSERT INTO public.changelogs (version, version_number, type, title, description, user_facing_changes, technical_changes, release_date)
VALUES ('v4.0', '4.0.0', 'feature', 'Sistema de Tracking por Tempo e Cor', 
 'Implementado sistema completo de rastreamento de objetos com detecção de cor e duração de visualização',
 ARRAY['Objetos agora mostram por quanto tempo foram vistos (ex: "celular preto - 30s")', 'Detecção automática da cor dominante de cada objeto', 'Interface responsiva otimizada para mobile e desktop', 'Removida categoria "people" da lista de objetos detectáveis'],
 ARRAY['Criada tabela object_tracking para persistir histórico de detecções', 'Implementado algoritmo de detecção de cor dominante via canvas', 'Refatorado sistema de grid responsivo (mobile-first)', 'Adicionado cálculo de tempo total de visualização por objeto'],
 '2024-12-26');

INSERT INTO public.changelogs (version, version_number, type, title, description, user_facing_changes, technical_changes, release_date)
VALUES ('v3.5', '3.5.0', 'improvement', 'Reconhecimento Avançado de Placas com OCR', 
 'Sistema de OCR otimizado com pré-processamento avançado de imagens',
 ARRAY['Reconhecimento de placas brasileiras e internacionais', 'Correção automática de erros comuns de OCR', 'Pré-processamento com CLAHE e binarização adaptativa'],
 ARRAY['Implementado CLAHE (Contrast Limited Adaptive Histogram Equalization)', 'Método de Otsu para binarização automática', 'Kernel de sharpening para melhorar bordas', 'Correções contextuais baseadas em padrões de placa'],
 '2024-12-25');

INSERT INTO public.changelogs (version, version_number, type, title, description, user_facing_changes, technical_changes, release_date)
VALUES ('v3.0', '3.0.0', 'feature', 'Sistema de Medição em CM/Metros',
 'Implementado cálculo de dimensões reais dos objetos',
 ARRAY['Conversão automática de pixels para centímetros', 'Calibração por distância da câmera', 'Medições mais precisas para objetos comuns', 'Suporte a múltiplas unidades de medida'],
 ARRAY['Algoritmo de estimativa de distância baseado em tamanho focal', 'Database de tamanhos reais de objetos comuns', 'Cálculo de distância usando triangulação simples'],
 '2024-12-25');

INSERT INTO public.changelogs (version, version_number, type, title, description, user_facing_changes, technical_changes, release_date)
VALUES ('v2.5', '2.5.0', 'feature', 'Detecção Especial de Veículos',
 'Sistema aprimorado para carros e motos',
 ARRAY['Identificação prioritária de carros e motos', 'Ícones especiais para veículos', 'Cores diferenciadas na interface'],
 ARRAY['Filtro de categorias de veículos no pipeline de detecção', 'Sistema de cores customizado por tipo de objeto', 'Bounding boxes com espessura diferenciada para veículos'],
 '2024-12-25');

INSERT INTO public.changelogs (version, version_number, type, title, description, user_facing_changes, technical_changes, release_date)
VALUES ('v2.0', '2.0.0', 'feature', 'Webcam em Tempo Real',
 'Implementação completa de detecção via webcam',
 ARRAY['Acesso direto à webcam do usuário', 'Detecção em tempo real com COCO-SSD', 'Interface moderna com React + TypeScript', 'Canvas overlay para bounding boxes'],
 ARRAY['Integração TensorFlow.js com COCO-SSD model', 'Pipeline de detecção a cada 1 segundo', 'Canvas 2D context para desenho de overlays', 'MediaStream API para acesso à câmera'],
 '2024-12-25');

INSERT INTO public.changelogs (version, version_number, type, title, description, user_facing_changes, technical_changes, release_date)
VALUES ('v1.5', '1.5.0', 'improvement', 'Design System Aprimorado',
 'Sistema de design moderno com gradientes e animações',
 ARRAY['Tema escuro com cores neon', 'Gradientes personalizados', 'Animações suaves'],
 ARRAY['CSS custom properties para design tokens', 'Tailwind config com gradientes e shadows customizados', 'Keyframes CSS para animações'],
 '2024-12-24');

INSERT INTO public.changelogs (version, version_number, type, title, description, user_facing_changes, technical_changes, release_date)
VALUES ('v1.0', '1.0.0', 'feature', 'Versão Inicial',
 'Criação da aplicação base Vcam',
 ARRAY['Interface React + Vite', 'Upload de imagens', 'Layout responsivo'],
 ARRAY['Setup inicial React + TypeScript + Vite', 'Configuração Tailwind CSS', 'Estrutura de componentes base'],
 '2024-12-24');
