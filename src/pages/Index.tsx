import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import ImageUpload from "@/components/ImageUpload";
import DetectionResults from "@/components/DetectionResults";
import { useToast } from "@/hooks/use-toast";

// Mock detection data for demo purposes
const mockDetections = [
  {
    id: "1",
    label: "person",
    confidence: 0.92,
    width: 180,
    height: 320,
    x: 150,
    y: 100
  },
  {
    id: "2", 
    label: "car",
    confidence: 0.87,
    width: 280,
    height: 160,
    x: 350,
    y: 200
  },
  {
    id: "3",
    label: "bicycle",
    confidence: 0.74,
    width: 120,
    height: 180,
    x: 80,
    y: 180
  }
];

const Index = () => {
  const [detections, setDetections] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (file: File) => {
    setIsProcessing(true);
    setShowResults(false);
    
    toast({
      title: "Processando imagem...",
      description: "Aguarde enquanto nossa IA analisa a imagem.",
    });

    // Simulate API call delay
    setTimeout(() => {
      // Simulate random detections for demo
      const numDetections = Math.floor(Math.random() * 4) + 1;
      const randomDetections = mockDetections
        .sort(() => 0.5 - Math.random())
        .slice(0, numDetections)
        .map((detection, index) => ({
          ...detection,
          id: `${Date.now()}-${index}`,
          confidence: Math.random() * 0.4 + 0.6, // Random confidence between 0.6-1.0
          width: Math.floor(Math.random() * 200) + 100,
          height: Math.floor(Math.random() * 200) + 120,
          x: Math.floor(Math.random() * 300),
          y: Math.floor(Math.random() * 200)
        }));

      setDetections(randomDetections);
      setIsProcessing(false);
      setShowResults(true);

      toast({
        title: "Detecção concluída!",
        description: `${randomDetections.length} objeto${randomDetections.length !== 1 ? 's' : ''} detectado${randomDetections.length !== 1 ? 's' : ''} com sucesso.`,
      });
    }, 2500);
  };

  return (
    <main className="min-h-screen">
      <HeroSection />
      <ImageUpload 
        onImageUpload={handleImageUpload}
        isProcessing={isProcessing}
      />
      <DetectionResults 
        detections={detections}
        isVisible={showResults}
      />
    </main>
  );
};

export default Index;
