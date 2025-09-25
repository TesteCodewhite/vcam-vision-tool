import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Ruler, Percent } from "lucide-react";

interface Detection {
  id: string;
  label: string;
  confidence: number;
  width: number;
  height: number;
  x: number;
  y: number;
}

interface DetectionResultsProps {
  detections: Detection[];
  isVisible: boolean;
}

const DetectionResults = ({ detections, isVisible }: DetectionResultsProps) => {
  if (!isVisible || detections.length === 0) return null;

  return (
    <section className="py-16 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent mb-4">
            Resultados da Detecção
          </h2>
          <p className="text-lg text-muted-foreground">
            {detections.length} objeto{detections.length !== 1 ? 's' : ''} detectado{detections.length !== 1 ? 's' : ''} com precisão
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {detections.map((detection, index) => (
            <Card 
              key={detection.id}
              className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300 hover:shadow-glow group animate-fadeInUp"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center group-hover:shadow-glow-primary transition-all duration-300">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground capitalize text-lg">
                        {detection.label}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Percent className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Confiança
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Badge 
                    variant="secondary"
                    className={`font-medium ${
                      detection.confidence >= 0.8 
                        ? 'bg-primary/20 text-primary border-primary/30' 
                        : detection.confidence >= 0.6
                        ? 'bg-secondary/20 text-secondary border-secondary/30'
                        : 'bg-accent/20 text-accent border-accent/30'
                    }`}
                  >
                    {Math.round(detection.confidence * 100)}%
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Ruler className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Largura</span>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        {detection.width}px
                      </span>
                    </div>
                    
                    <div className="bg-muted/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Ruler className="w-4 h-4 text-secondary rotate-90" />
                        <span className="text-sm font-medium text-foreground">Altura</span>
                      </div>
                      <span className="text-lg font-bold text-secondary">
                        {detection.height}px
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/30">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Posição X: {detection.x}px</div>
                      <div>Posição Y: {detection.y}px</div>
                      <div>Área: {(detection.width * detection.height).toLocaleString()}px²</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="font-semibold text-foreground mb-2">Tecnologia Utilizada</h3>
            <p className="text-sm text-muted-foreground">
              Powered by YOLOv8n (You Only Look Once) - Uma das arquiteturas mais avançadas 
              para detecção de objetos em tempo real, processando imagens com alta precisão e velocidade.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DetectionResults;