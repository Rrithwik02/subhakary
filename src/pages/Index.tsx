import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { ServicesSection } from "@/components/ServicesSection";
import { BookingFlowSection } from "@/components/BookingFlowSection";
import { TrustSection } from "@/components/TrustSection";
import { BlogSection } from "@/components/BlogSection";
import { Footer } from "@/components/Footer";
import { AIChatbot } from "@/components/AIChatbot";
import { MobileHome } from "@/components/mobile/MobileHome";
import { useMobileLayout } from "@/hooks/useMobileLayout";

const Index = () => {
  const isMobileLayout = useMobileLayout();

  // Show mobile-specific layout for native apps, PWAs, and mobile browsers
  if (isMobileLayout) {
    return <MobileHome />;
  }

  // Desktop layout
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <BookingFlowSection />
      <TrustSection />
      <BlogSection />
      <Footer />
      <AIChatbot />
    </main>
  );
};

export default Index;
