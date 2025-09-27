import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { History, ArrowLeft } from 'lucide-react';

interface ProjectVersion {
  id: string;
  version_name: string;
  description: string;
  features_enabled: any;
  algorithm_version: string;
  is_active: boolean;
  created_at: string;
}

interface VersionControlProps {
  onVersionChange: (features: Record<string, any>) => void;
  currentFeatures: Record<string, any>;
}

export const VersionControl = ({ onVersionChange, currentFeatures }: VersionControlProps) => {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('project_versions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setVersions(data || []);
      
      // Encontrar versão ativa
      const activeVersion = data?.find(v => v.is_active);
      if (activeVersion) {
        setSelectedVersion(activeVersion.id);
      }
    } catch (error) {
      console.error('Erro ao carregar versões:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar versões do projeto',
        variant: 'destructive'
      });
    }
  };

  const createNewVersion = async (versionName: string, description: string) => {
    try {
      setIsLoading(true);
      
      // Desativar versão atual
      await supabase
        .from('project_versions')
        .update({ is_active: false })
        .eq('is_active', true);

      // Criar nova versão
      const { data, error } = await supabase
        .from('project_versions')
        .insert({
          version_name: versionName,
          description,
          features_enabled: currentFeatures,
          algorithm_version: 'v2.0',
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      await loadVersions();
      setSelectedVersion(data.id);

      toast({
        title: 'Versão criada!',
        description: `Versão ${versionName} foi criada e ativada`
      });
    } catch (error) {
      console.error('Erro ao criar versão:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar nova versão',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const switchToVersion = async (versionId: string) => {
    try {
      setIsLoading(true);
      
      const version = versions.find(v => v.id === versionId);
      if (!version) return;

      // Desativar todas as versões
      await supabase
        .from('project_versions')
        .update({ is_active: false })
        .eq('is_active', true);

      // Ativar versão selecionada
      await supabase
        .from('project_versions')
        .update({ is_active: true })
        .eq('id', versionId);

      // Aplicar features da versão
      onVersionChange(version.features_enabled);
      setSelectedVersion(versionId);

      await loadVersions();

      toast({
        title: 'Versão alterada!',
        description: `Mudou para ${version.version_name}`
      });
    } catch (error) {
      console.error('Erro ao trocar versão:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao alterar versão',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const predefinedVersions = [
    {
      name: 'v1.0 - Básico',
      description: 'Detecção básica de objetos',
      features: {
        basic_detection: true,
        size_calculation: 'fixed',
        vehicle_highlight: false,
        text_recognition: false,
        machine_learning: false
      }
    },
    {
      name: 'v2.0 - Avançado',
      description: 'Detecção com destaque de veículos',
      features: {
        basic_detection: true,
        size_calculation: 'fixed',
        vehicle_highlight: true,
        text_recognition: false,
        machine_learning: false
      }
    },
    {
      name: 'v3.0 - Inteligente',
      description: 'Machine learning e cálculo dinâmico',
      features: {
        basic_detection: true,
        size_calculation: 'dynamic',
        vehicle_highlight: true,
        text_recognition: true,
        machine_learning: true
      }
    }
  ];

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Controle de Versão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Seletor de versão */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Versão Ativa
          </label>
          <Select value={selectedVersion} onValueChange={switchToVersion}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma versão" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((version) => (
                <SelectItem key={version.id} value={version.id}>
                  <div className="flex items-center gap-2">
                    {version.version_name}
                    {version.is_active && (
                      <Badge variant="default" className="text-xs">ATIVA</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Versões predefinidas */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Versões Rápidas
          </label>
          <div className="space-y-2">
            {predefinedVersions.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => createNewVersion(preset.name, preset.description)}
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {preset.name}
                <span className="text-xs text-muted-foreground ml-auto">
                  {preset.description}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Features da versão atual */}
        {selectedVersion && (
          <div>
            <label className="text-sm font-medium mb-2 block">
              Features Ativas
            </label>
            <div className="flex flex-wrap gap-1">
              {Object.entries(currentFeatures).map(([key, value]) => (
                <Badge 
                  key={key}
                  variant={value ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {key.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Histórico */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Histórico ({versions.length} versões)
          </label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {versions.slice(0, 5).map((version) => (
              <div key={version.id} className="text-xs p-2 bg-background/30 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{version.version_name}</span>
                  <span className="text-muted-foreground">
                    {new Date(version.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-muted-foreground">{version.description}</p>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
};