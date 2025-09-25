import { Camera, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(235_85%_65%_/_0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(195_100%_55%_/_0.08),transparent_50%)]" />
      
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow animate-pulse">
              <Camera className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
              <Zap className="w-3 h-3 text-background" />
            </div>
          </div>
        </div>
        
        <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6 leading-tight">
          Vcam
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
          Detecção de Objetos & Pessoas em Tempo Real
        </p>
        
        <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
          Tecnologia YOLOv8n + OpenCV para identificar objetos e pessoas em suas imagens, 
          exibindo dimensões precisas com alta performance.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Button 
            size="lg" 
            className="bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 text-white border-0 px-8 py-6 text-lg font-semibold"
          >
            <Target className="w-5 h-5 mr-2" />
            Começar Detecção
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 px-8 py-6 text-lg font-semibold transition-all duration-300"
          >
            Ver Demo
          </Button>
        </div>
        
        {/* Tech specs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:bg-card/70 transition-all duration-300 hover:shadow-card">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">YOLOv8n</h3>
            <p className="text-muted-foreground text-sm">Modelo ultra-rápido e preciso para detecção em tempo real</p>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:bg-card/70 transition-all duration-300 hover:shadow-card">
            <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Target className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">OpenCV</h3>
            <p className="text-muted-foreground text-sm">Processamento avançado de imagens com alta precisão</p>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:bg-card/70 transition-all duration-300 hover:shadow-card">
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Camera className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">React + Vite</h3>
            <p className="text-muted-foreground text-sm">Interface moderna e responsiva para melhor experiência</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;