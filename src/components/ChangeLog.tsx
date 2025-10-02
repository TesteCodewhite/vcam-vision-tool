import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ChangeEntry {
  id: string;
  version: string;
  version_number: string;
  type: 'feature' | 'improvement' | 'fix' | 'update' | 'refactor';
  title: string;
  description: string;
  user_facing_changes: string[];
  technical_changes: string[];
  release_date: string;
}

const ChangeLog = () => {
  const [changes, setChanges] = useState<ChangeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChangelogs();
  }, []);

  const loadChangelogs = async () => {
    try {
      const { data, error } = await supabase
        .from('changelogs')
        .select('*')
        .eq('is_published', true)
        .order('release_date', { ascending: false });

      if (error) throw error;
      setChanges((data || []) as ChangeEntry[]);
    } catch (error) {
      console.error('Erro ao carregar changelogs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature': return 'bg-primary text-primary-foreground';
      case 'improvement': return 'bg-secondary text-secondary-foreground';
      case 'fix': return 'bg-destructive text-destructive-foreground';
      case 'update': return 'bg-accent text-accent-foreground';
      case 'refactor': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature': return '✨';
      case 'improvement': return '🚀';
      case 'fix': return '🐛';
      case 'update': return '📦';
      case 'refactor': return '🔧';
      default: return '📝';
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent mb-4">
            Registro de Mudanças
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Histórico completo das evoluções e melhorias do sistema Vcam
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {changes.map((change, index) => (
            <Card key={change.id} className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getTypeColor(change.type)}>
                      {getTypeIcon(change.type)} {change.type}
                    </Badge>
                    <Badge variant="outline">v{change.version_number}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(change.release_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <CardTitle className="text-lg sm:text-xl text-foreground mt-2">{change.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">{change.description}</p>
                
                <Accordion type="single" collapsible className="w-full">
                  {/* Mudanças para o Usuário */}
                  <AccordionItem value="user-changes">
                    <AccordionTrigger className="text-sm sm:text-base hover:no-underline">
                      <span className="flex items-center gap-2">
                        👤 Mudanças Visíveis ({change.user_facing_changes.length})
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {change.user_facing_changes.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex items-start gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0 mt-1.5"></div>
                            <span className="text-foreground">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Mudanças Técnicas */}
                  <AccordionItem value="technical-changes">
                    <AccordionTrigger className="text-sm sm:text-base hover:no-underline">
                      <span className="flex items-center gap-2">
                        ⚙️ Mudanças Técnicas ({change.technical_changes.length})
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {change.technical_changes.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex items-start gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-accent rounded-full flex-shrink-0 mt-1.5"></div>
                            <span className="text-muted-foreground font-mono text-xs sm:text-sm">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
              {index < changes.length - 1 && <Separator className="mt-4" />}
            </Card>
          ))}
        </div>

        <div className="mt-8 sm:mt-12 text-center">
          <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-xl p-4 sm:p-6">
            <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Sistema de Versionamento</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Seguimos o padrão Semantic Versioning (SemVer) para controle de versões:
              <br />
              <strong>MAJOR.MINOR.PATCH</strong> - Ex: 4.0.0
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChangeLog;
