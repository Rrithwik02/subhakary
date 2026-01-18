import { useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  MessageCircle,
  Bell,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { MobileLayout } from "./MobileLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewForm } from "@/components/ReviewForm";
import { CustomerVerificationDialog } from "@/components/CustomerVerificationDialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { supabase } from "@/integrations/supabase/client";

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    icon: AlertCircle,
  },
  accepted: {
    label: "Confirmed",
    color: "bg-green-500/10 text-green-600 border-green-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-500/10 text-red-600 border-red-200",
    icon: XCircle,
  },
  completed: {
    label: "Completed",
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-muted text-muted-foreground border-border",
    icon: XCircle,
  },
};

type FilterType = "all" | "upcoming" | "completed";

const MobileMyBookings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [filter, setFilter] = useState<FilterType>("all");
  const [reviewBooking, setReviewBooking] = useState<{
    id: string;
    providerId: string;
    providerName: string;
  } | null>(null);
  const [confirmBooking, setConfirmBooking] = useState<{
    id: string;
    providerId: string;
    providerName: string;
  } | null>(null);

  const {
    data: bookings = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["my-bookings", user?.id],
    queryFn: async () => {
      const { data: bookingsData, error } = await supabase
        .from("bookings")
        .select(`
          *,
          provider:service_providers(
            id,
            business_name,
            city,
            logo_url,
            category:service_categories(name, icon)
          )
        `)
        .eq("user_id", user!.id)
        .order("service_date", { ascending: false });
      if (error) throw error;
      
      const bookingIds = bookingsData.map(b => b.id);
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("booking_id")
        .in("booking_id", bookingIds);
      
      const reviewedBookingIds = new Set(reviewsData?.map(r => r.booking_id) || []);
      
      return bookingsData.map(booking => ({
        ...booking,
        hasReview: reviewedBookingIds.has(booking.id),
      }));
    },
    enabled: !!user,
  });

  const { isPulling, isRefreshing, pullDistance, pullProgress, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh({
    onRefresh: async () => {
      await refetch();
    },
  });

  const filteredBookings = bookings.filter(booking => {
    if (filter === "upcoming") {
      return ["pending", "accepted"].includes(booking.status);
    }
    if (filter === "completed") {
      return ["completed", "rejected", "cancelled"].includes(booking.status);
    }
    return true;
  });

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Booking cancelled",
        description: "Your booking has been cancelled.",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
          <div className="mb-4">
            <h1 className="text-2xl font-bold">My Bookings</h1>
            <p className="text-sm text-muted-foreground">Track your service requests</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-4 px-4">
            {(["all", "upcoming", "completed"] as FilterType[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                className="capitalize flex-shrink-0"
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>

          {/* Bookings List */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl p-4 border">
                  <div className="flex gap-3">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">No bookings yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Find and book amazing service providers
              </p>
              <Button onClick={() => navigate("/providers")} className="gradient-gold text-primary-foreground">
                Browse Providers
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((booking, index) => {
                const status = statusConfig[booking.status as keyof typeof statusConfig];
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-xl border overflow-hidden active:scale-[0.98] transition-transform"
                    onClick={() => navigate(`/booking/${booking.id}`)}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Provider Logo */}
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                          {booking.provider?.logo_url ? (
                            <img
                              src={booking.provider.logo_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            booking.provider?.category?.icon || "🙏"
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold truncate">
                              {booking.provider?.business_name || "Provider"}
                            </h3>
                            <Badge className={`${status.color} text-xs flex-shrink-0`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(booking.service_date), "MMM d, yyyy")}</span>
                            {booking.service_time && (
                              <>
                                <Clock className="h-3 w-3 ml-1" />
                                <span>{booking.service_time}</span>
                              </>
                            )}
                          </div>

                          {booking.provider?.city && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              <span>{booking.provider.city}</span>
                            </div>
                          )}
                        </div>

                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>

                      {/* Action Buttons */}
                      {(booking.status === "accepted" && booking.completion_confirmed_by_provider && !booking.completion_confirmed_by_customer) && (
                        <Button
                          size="sm"
                          className="w-full mt-3 gradient-gold text-primary-foreground h-9"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmBooking({
                              id: booking.id,
                              providerId: booking.provider?.id || "",
                              providerName: booking.provider?.business_name || "Provider",
                            });
                          }}
                        >
                          <Bell className="h-3.5 w-3.5 mr-1.5" />
                          Verify & Confirm Completion
                        </Button>
                      )}

                      {booking.status === "pending" && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelBooking(booking.id);
                            }}
                          >
                            Cancel Booking
                          </Button>
                        </div>
                      )}

                      {booking.status === "completed" && !booking.hasReview && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3 h-9"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewBooking({
                              id: booking.id,
                              providerId: booking.provider?.id || "",
                              providerName: booking.provider?.business_name || "Provider",
                            });
                          }}
                        >
                          <Star className="h-3.5 w-3.5 mr-1.5" />
                          Leave a Review
                        </Button>
                      )}

                      {booking.hasReview && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          <span>You reviewed this booking</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Review Form Dialog */}
        {reviewBooking && (
          <ReviewForm
            bookingId={reviewBooking.id}
            providerId={reviewBooking.providerId}
            providerName={reviewBooking.providerName}
            open={!!reviewBooking}
            onOpenChange={(open) => !open && setReviewBooking(null)}
            onReviewSubmitted={() => refetch()}
          />
        )}

        {/* Customer Verification Dialog */}
        {confirmBooking && (
          <CustomerVerificationDialog
            bookingId={confirmBooking.id}
            providerId={confirmBooking.providerId}
            providerName={confirmBooking.providerName}
            open={!!confirmBooking}
            onOpenChange={(open) => !open && setConfirmBooking(null)}
            onVerified={() => refetch()}
          />
        )}
      </div>
    </MobileLayout>
  );
};

export default MobileMyBookings;
