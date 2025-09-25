import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ChangeEntry {
  id: string;
  date: string;
  version: string;
  type: 'feature' | 'improvement' | 'fix' | 'update';
  title: string;
  description: string;
  details: string[];
}

const changeHistory: ChangeEntry[] = [
  {
    id: "v3.0",
    date: "2024-12-25",
    version: "3.0.0",
    type: "feature",
    title: "Sistema de Medição em CM/Metros",
    description: "Implementado cálculo de dimensões reais dos objetos em centímetros e metros",
    details: [
      "Conversão automática de pixels para centímetros",
      "Calibração por distância da câmera",
      "Medições mais precisas para objetos comuns",
      "Suporte a múltiplas unidades de medida"
    ]
  },
  {
    id: "v2.5",
    date: "2024-12-25",
    version: "2.5.0",
    type: "feature",
    title: "Detecção Especial de Veículos",
    description: "Sistema aprimorado para carros e motos com destaque visual",
    details: [
      "Identificação prioritária de carros e motos",
      "Ícones especiais para veículos",
      "Cores diferenciadas na interface",
      "Alertas sonoros para detecção de veículos"
    ]
  },
  {
    id: "v2.0",
    date: "2024-12-25",
    version: "2.0.0",
    type: "feature",
    title: "Webcam em Tempo Real",
    description: "Implementação completa de detecção via webcam usando TensorFlow.js",
    details: [
      "Acesso direto à webcam do usuário",
      "Detecção em tempo real com COCO-SSD",
      "Interface moderna com React + TypeScript",
      "Filtros para remover detecção de pessoas",
      "Canvas overlay para bounding boxes"
    ]
  },
  {
    id: "v1.5",
    date: "2024-12-24",
    version: "1.5.0",
    type: "improvement",
    title: "Design System Aprimorado",
    description: "Sistema de design moderno com gradientes e animações",
    details: [
      "Tema escuro com cores neon",
      "Gradientes personalizados",
      "Animações suaves",
      "Componentes shadcn/ui"
    ]
  },
  {
    id: "v1.0",
    date: "2024-12-24",
    version: "1.0.0",
    type: "feature",
    title: "Versão Inicial",
    description: "Criação da aplicação base Vcam",
    details: [
      "Interface React + Vite",
      "Upload de imagens",
      "Detecção mock de objetos",
      "Layout responsivo"
    ]
  }
];

const ChangeLog = () => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature': return 'bg-primary text-primary-foreground';
      case 'improvement': return 'bg-secondary text-secondary-foreground';
      case 'fix': return 'bg-destructive text-destructive-foreground';
      case 'update': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature': return '✨';
      case 'improvement': return '🚀';
      case 'fix': return '🐛';
      case 'update': return '📦';
      default: return '📝';
    }
  };

  return (
    <section className="py-16 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent mb-4">
            Registro de Mudanças
          </h2>
          <p className="text-lg text-muted-foreground">
            Histórico completo das evoluções e melhorias do sistema Vcam
          </p>
        </div>

        <div className="space-y-6">
          {changeHistory.map((change, index) => (
            <Card key={change.id} className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getTypeColor(change.type)}>
                      {getTypeIcon(change.type)} {change.type}
                    </Badge>
                    <Badge variant="outline">v{change.version}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{change.date}</span>
                </div>
                <CardTitle className="text-xl text-foreground">{change.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{change.description}</p>
                <div className="space-y-2">
                  {change.details.map((detail, detailIndex) => (
                    <div key={detailIndex} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                      <span className="text-foreground">{detail}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              {index < changeHistory.length - 1 && <Separator className="mt-4" />}
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-2">Sistema de Versionamento</h3>
            <p className="text-sm text-muted-foreground">
              Seguimos o padrão Semantic Versioning (SemVer) para controle de versões:
              <br />
              <strong>MAJOR.MINOR.PATCH</strong> - Ex: 3.0.0
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChangeLog;