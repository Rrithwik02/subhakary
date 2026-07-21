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
import { SEOHead } from "@/components/SEOHead";

const Index = () => {
  const { user, loading } = useAuth();
  const isMobileLayout = useMobileLayout();
  const homeTitle = "Subhakary – Wedding Planning & Verified Event Services";
  const homeDescription = "Book verified photographers, poojaris, caterers, decorators, makeup artists, function halls, and other traditional event services with Subhakary.";
  const homeOgImage = `${window.location.origin}/subhakary-og-image.png`;

  if (loading) {
    return (
      <>
        <SEOHead
          title={homeTitle}
          description={homeDescription}
          canonicalUrl={window.location.origin}
          ogImage={homeOgImage}
          ogType="website"
        />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </>
    );
  }

  // Show mobile-specific layout for native apps, PWAs, and mobile browsers
  if (isMobileLayout) {
    return (
      <>
        <SEOHead
          title={homeTitle}
          description={homeDescription}
          canonicalUrl={window.location.origin}
          ogImage={homeOgImage}
          ogType="website"
        />
        <MobileHome />
      </>
    );
  }

  // If user is authenticated, render the customized dashboard landing home page
  if (user) {
    return (
      <>
        <SEOHead
          title={homeTitle}
          description={homeDescription}
          canonicalUrl={window.location.origin}
          ogImage={homeOgImage}
          ogType="website"
        />
        <AuthenticatedHome />
      </>
    );
  }

  // Desktop layout (unauthenticated public website)
  return (
    <>
      <SEOHead
        title={homeTitle}
        description={homeDescription}
        canonicalUrl={window.location.origin}
        ogImage={homeOgImage}
        ogType="website"
      />
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
    </>
  );
};

export default Index;
