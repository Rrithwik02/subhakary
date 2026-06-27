import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { MobileLayout } from "./MobileLayout";
import { Button } from "@/components/ui/button";
import { PaymentHistorySection } from "@/components/PaymentHistorySection";
import { useAuth } from "@/hooks/useAuth";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useQueryClient } from "@tanstack/react-query";

const MobilePaymentHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { isPulling, isRefreshing, pullDistance, pullProgress, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh({
    onRefresh: async () => {
      await queryClient.invalidateQueries({ queryKey: ["payment-history"] });
    },
  });

  if (authLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <MobileLayout>
      <div
        ref={scrollRef}
        className="min-h-screen bg-background"
        onTouchStart={(e) => handleTouchStart(e, scrollRef.current?.scrollTop || 0)}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull to Refresh Indicator */}
        <AnimatePresence>
          {(isPulling || isRefreshing) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: pullDistance, opacity: pullProgress }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center justify-center overflow-hidden"
            >
              <motion.div
                animate={{ rotate: isRefreshing ? 360 : pullProgress * 360 }}
                transition={{ duration: isRefreshing ? 1 : 0, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
              >
                <Loader2 className={`h-6 w-6 text-primary ${isRefreshing ? "animate-spin" : ""}`} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-4 pt-4 pb-24">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Payment History</h1>
              <p className="text-sm text-muted-foreground">All your payments</p>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">All Payments</h2>
            </div>
            <PaymentHistorySection userId={user?.id} />
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobilePaymentHistory;
