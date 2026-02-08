import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Star,
  MessageCircle,
  Bell,
  CreditCard,
  IndianRupee,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewForm } from "@/components/ReviewForm";
import { CustomerVerificationDialog } from "@/components/CustomerVerificationDialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMobileLayout } from "@/hooks/useMobileLayout";
import MobileMyBookings from "@/components/mobile/MobileMyBookings";

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    icon: AlertCircle,
  },
  accepted: {
    label: "Accepted",
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

const MyBookings = () => {
  const isMobile = useMobileLayout();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Return mobile version if on mobile
  if (isMobile) {
    return <MobileMyBookings />;
  }
  
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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch user's bookings
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
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Fetch reviews for these bookings
      const bookingIds = bookingsData.map(b => b.id);
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("booking_id")
        .in("booking_id", bookingIds);
      
      const reviewedBookingIds = new Set(reviewsData?.map(r => r.booking_id) || []);
      
      // Fetch inquiry conversations linked to these bookings
      const { data: conversationsData } = await supabase
        .from("inquiry_conversations")
        .select("id, booking_id, provider_id")
        .in("booking_id", bookingIds);
      
      const conversationsByBookingId = new Map(
        conversationsData?.map(c => [c.booking_id, c]) || []
      );

      // Fetch pending payments for these bookings
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("id, booking_id, amount, status, is_provider_requested")
        .in("booking_id", bookingIds)
        .eq("status", "pending")
        .eq("is_provider_requested", true);

      const pendingPaymentsByBookingId = new Map(
        paymentsData?.map(p => [p.booking_id, p]) || []
      );
      
      return bookingsData.map(booking => ({
        ...booking,
        hasReview: reviewedBookingIds.has(booking.id),
        inquiryConversation: conversationsByBookingId.get(booking.id),
        pendingPayment: pendingPaymentsByBookingId.get(booking.id),
      }));
    },
    enabled: !!user,
  });

  // Subscribe to realtime updates for bookings and payments
  useEffect(() => {
    if (!user) return;

    const bookingsChannel = supabase
      .channel("my-bookings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    const paymentsChannel = supabase
      .channel("my-bookings-payments")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, [user, refetch]);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId)
        .eq("user_id", user!.id);

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 md:pt-32 pb-12 px-3 md:px-4">
        <div className="container max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between gap-4 mb-6 md:mb-8">
              <div>
                <h1 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-1 md:mb-2">
                  My Bookings
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Track and manage your service booking requests
                </p>
              </div>
              <Link to="/payment-history">
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  <IndianRupee className="h-4 w-4" />
                  <span className="hidden sm:inline">Payment History</span>
                  <span className="sm:hidden">Payments</span>
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3 md:space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4 md:p-6">
                      <div className="h-5 md:h-6 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <Card>
                <CardContent className="p-8 md:p-12 text-center">
                  <Calendar className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-lg md:text-xl font-semibold mb-2">
                    No bookings yet
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-6">
                    Browse our providers and book your first service
                  </p>
                  <Link to="/providers">
                    <Button className="gradient-gold text-primary-foreground h-11 md:h-10 touch-manipulation">
                      Browse Providers
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {bookings.map((booking, index) => {
                  const status = statusConfig[booking.status as keyof typeof statusConfig];
                  const StatusIcon = status.icon;

                  return (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className="hover-lift cursor-pointer transition-colors hover:border-primary/50 active:scale-[0.99] touch-manipulation"
                        onClick={() => navigate(`/booking/${booking.id}`)}
                      >
                        <CardContent className="p-3 md:p-6">
                          <div className="flex flex-col gap-3 md:gap-4">
                            {/* Top section: Logo + Info */}
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl md:text-2xl flex-shrink-0 overflow-hidden">
                                {booking.provider?.logo_url ? (
                                  <img 
                                    src={booking.provider.logo_url} 
                                    alt={booking.provider?.business_name || "Provider"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  booking.provider?.category?.icon || "🙏"
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="font-display text-base md:text-lg font-semibold truncate">
                                    {booking.provider?.business_name || "Provider"}
                                  </h3>
                                  <Badge className={`${status.color} flex items-center gap-1 text-xs flex-shrink-0`}>
                                    <StatusIcon className="h-3 w-3" />
                                    <span className="hidden sm:inline">{status.label}</span>
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(booking.service_date), "MMM d, yyyy")}
                                  </span>
                                  {booking.service_time && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {booking.service_time}
                                    </span>
                                  )}
                                  {booking.provider?.city && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {booking.provider.city}
                                    </span>
                                  )}
                                </div>
                                {booking.message && (
                                  <p className="text-xs md:text-sm text-muted-foreground mt-1.5 flex items-start gap-1">
                                    <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <span className="line-clamp-1">{booking.message}</span>
                                  </p>
                                )}
                                {booking.rejection_reason && (
                                  <p className="text-xs md:text-sm text-destructive mt-1.5">
                                    Reason: {booking.rejection_reason}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Action buttons - mobile optimized */}
                            <div className="flex items-center gap-2 flex-wrap pl-0 md:pl-14">
                              {/* Pending payment request - Pay Now button */}
                              {booking.pendingPayment && (
                                <Link 
                                  to={`/checkout/${booking.pendingPayment.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex-1 sm:flex-none"
                                >
                                  <Button
                                    size="sm"
                                    className="w-full sm:w-auto h-9 gradient-gold text-primary-foreground touch-manipulation animate-pulse"
                                  >
                                    <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                                    Pay ₹{booking.pendingPayment.amount?.toLocaleString()}
                                  </Button>
                                </Link>
                              )}
                              {/* Completion confirmation alert */}
                              {booking.status === "accepted" && booking.completion_confirmed_by_provider && !booking.completion_confirmed_by_customer && (
                                <Button
                                  size="sm"
                                  className="flex-1 sm:flex-none h-9 gradient-gold text-primary-foreground touch-manipulation animate-pulse"
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
                                  Verify & Confirm
                                </Button>
                              )}
                              {booking.status === "accepted" && !booking.completion_confirmed_by_provider && (
                                <Link 
                                  to={booking.inquiryConversation 
                                    ? `/inquiry/${booking.provider?.id}?conversation=${booking.inquiryConversation.id}`
                                    : `/chat?booking=${booking.id}`
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex-1 sm:flex-none"
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full sm:w-auto h-9 text-primary border-primary hover:bg-primary/10 touch-manipulation"
                                  >
                                    <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                                    Chat
                                  </Button>
                                </Link>
                              )}
                              {booking.status === "pending" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 sm:flex-none h-9 touch-manipulation"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelBooking(booking.id);
                                  }}
                                >
                                  Cancel
                                </Button>
                              )}
                              {booking.status === "completed" && !booking.hasReview && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 sm:flex-none h-9 touch-manipulation"
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
                                  Review
                                </Button>
                              )}
                              {booking.hasReview && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-primary text-primary" />
                                  Reviewed
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </section>

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

      <Footer />
    </div>
  );
};

export default MyBookings;
