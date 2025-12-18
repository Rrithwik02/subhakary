import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ServicesSection } from "@/components/ServicesSection";
import { TrustSection } from "@/components/TrustSection";
import { Footer } from "@/components/Footer";
import { AIChatbot } from "@/components/AIChatbot";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <TrustSection />
      <Footer />
      <AIChatbot />
    </main>
  );
};

export default Index;
