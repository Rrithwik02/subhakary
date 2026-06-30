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
import { useAuth } from "@/hooks/useAuth";
import { AuthenticatedHome } from "@/components/AuthenticatedHome";
import { WeddingOSPreviewSection } from "@/components/WeddingOSPreviewSection";
import { CeremonyInspiration } from "@/components/CeremonyInspiration";
import { VendorPartnershipPortal } from "@/components/VendorPartnershipPortal";

const Index = () => {
  const { user, loading } = useAuth();
  const isMobileLayout = useMobileLayout();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Show mobile-specific layout for native apps, PWAs, and mobile browsers
  if (isMobileLayout) {
    return <MobileHome />;
  }

  // If user is authenticated, render the customized dashboard landing home page
  if (user) {
    return <AuthenticatedHome />;
  }

  // Desktop layout (unauthenticated public website)
  return (
    <main className="min-h-screen bg-cream">
      <Navbar />
      <HeroSection />
      <WeddingOSPreviewSection />
      <CeremonyInspiration />
      <ServicesSection />
      <VendorPartnershipPortal />
      <AboutSection />
      <BookingFlowSection />
      <TrustSection />
      <BlogSection />
      <Footer />
      <AIChatbot />
    </main>
  );
};

export default Index;
