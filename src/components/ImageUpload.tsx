import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  isProcessing: boolean;
}

const ImageUpload = ({ onImageUpload, isProcessing }: ImageUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleFileUpload(file);
      }
    }
  }, []);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    onImageUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
  };

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            Upload & Detectar
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Faça upload de uma imagem e nossa IA identificará objetos e pessoas automaticamente
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-card">
          {!uploadedImage ? (
            <div
              className={cn(
                "relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300",
                dragActive 
                  ? "border-primary bg-primary/5 shadow-glow-primary" 
                  : "border-border hover:border-primary/50 hover:bg-muted/20"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessing}
              />
              
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Arraste uma imagem aqui
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    ou clique para selecionar do seu dispositivo
                  </p>
                  
                  <Button 
                    variant="outline"
                    className="border-primary/30 text-primary hover:bg-primary/10"
                    disabled={isProcessing}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Selecionar Imagem
                  </Button>
                </div>
              </div>
              
              {isProcessing && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <div className="flex items-center space-x-3 text-primary">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium">Processando...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded" 
                  className="w-full max-h-96 object-contain rounded-xl bg-muted/20"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearImage}
                  className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm border-border/50 hover:bg-background"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Imagem carregada com sucesso! Os resultados da detecção aparecerão abaixo.
                </p>
                
                <Button 
                  onClick={clearImage}
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Carregar Nova Imagem
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ImageUpload;