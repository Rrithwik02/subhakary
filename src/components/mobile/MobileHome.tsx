import { MobileLayout } from "@/components/mobile/MobileLayout";
import { MobileAISearch } from "@/components/mobile/MobileAISearch";
import { MobileTrustIndicators } from "@/components/mobile/MobileTrustIndicators";
import { MobileFeaturedBanner } from "@/components/mobile/MobileFeaturedBanner";
import { MobileServiceGrid } from "@/components/mobile/MobileServiceGrid";
import { MobileBlogSection } from "@/components/mobile/MobileBlogSection";

import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Briefcase, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const MobileHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if user has a provider profile
  const { data: providerProfile } = useQuery({
    queryKey: ['provider-profile-check', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('service_providers')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Show CTA only if logged in and no provider profile exists
  const showBecomeProviderCTA = user && !providerProfile;

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

        {/* Become a Provider CTA - Only for logged-in non-providers */}
        {showBecomeProviderCTA && (
          <div className="px-4 py-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl bg-background p-4 border-2 border-primary"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-sm">
                    Want to offer your services?
                  </h4>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Join 500+ verified providers on our platform
                  </p>
                </div>
              </div>

              <Button
                variant="gold"
                size="sm"
                className="w-full mt-3 text-xs"
                onClick={() => navigate('/become-provider')}
              >
                Become a Provider
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </motion.div>
          </div>
        )}

        {/* Blog/Inspiration Section */}
        <MobileBlogSection />

        {/* Extra padding for bottom nav */}
        <div className="h-4" />
      </div>

    </MobileLayout>
  );
};
