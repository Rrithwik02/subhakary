import { MobileLayout } from "@/components/mobile/MobileLayout";
import { MobileAISearch } from "@/components/mobile/MobileAISearch";
import { MobileTrustIndicators } from "@/components/mobile/MobileTrustIndicators";
import { MobileFeaturedBanner } from "@/components/mobile/MobileFeaturedBanner";
import { MobileServiceGrid } from "@/components/mobile/MobileServiceGrid";
import { MobileBlogSection } from "@/components/mobile/MobileBlogSection";
import { AIChatbot } from "@/components/AIChatbot";

export const MobileHome = () => {
  return (
    <MobileLayout hideHeader={false}>
      <div className="space-y-1">
        {/* AI-Powered Search */}
        <MobileAISearch />

        {/* Trust Indicators */}
        <MobileTrustIndicators />

        {/* Featured Banner */}
        <MobileFeaturedBanner />

        {/* Service Categories Grid */}
        <MobileServiceGrid />

        {/* Blog/Inspiration Section */}
        <MobileBlogSection />

        {/* Extra padding for bottom nav */}
        <div className="h-4" />
      </div>

      {/* AI Chatbot */}
      <AIChatbot />
    </MobileLayout>
  );
};
