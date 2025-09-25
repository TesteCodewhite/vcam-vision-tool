import HeroSection from "@/components/HeroSection";
import WebcamFeed from "@/components/WebcamFeed";
import ObjectsList from "@/components/ObjectsList";
import ChangeLog from "@/components/ChangeLog";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <WebcamFeed />
      <ObjectsList />
      <ChangeLog />
      <Toaster />
    </main>
  );
};

export default Index;
