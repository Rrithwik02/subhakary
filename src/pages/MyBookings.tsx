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
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewForm } from "@/components/ReviewForm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [reviewBooking, setReviewBooking] = useState<{
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
      
      return bookingsData.map(booking => ({
        ...booking,
        hasReview: reviewedBookingIds.has(booking.id),
        inquiryConversation: conversationsByBookingId.get(booking.id),
      }));
    },
    enabled: !!user,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel);
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

      <section className="pt-32 pb-12 px-4">
        <div className="container max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              My Bookings
            </h1>
            <p className="text-muted-foreground mb-8">
              Track and manage your service booking requests
            </p>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-xl font-semibold mb-2">
                    No bookings yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Browse our providers and book your first service
                  </p>
                  <Link to="/providers">
                    <Button className="gradient-gold text-primary-foreground">
                      Browse Providers
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
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
                        className="hover-lift cursor-pointer transition-colors hover:border-primary/50"
                        onClick={() => navigate(`/booking/${booking.id}`)}
                      >
                        <CardContent className="p-4 md:p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                                {booking.provider?.category?.icon || "🙏"}
                              </div>
                              <div>
                                <h3 className="font-display text-lg font-semibold">
                                  {booking.provider?.business_name || "Provider"}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(booking.service_date), "PPP")}
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
                                  <p className="text-sm text-muted-foreground mt-2 flex items-start gap-1">
                                    <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <span className="line-clamp-1">{booking.message}</span>
                                  </p>
                                )}
                                {booking.rejection_reason && (
                                  <p className="text-sm text-destructive mt-2">
                                    Reason: {booking.rejection_reason}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge className={`${status.color} flex items-center gap-1`}>
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </Badge>
                              {booking.status === "accepted" && (
                                <Link 
                                  to={booking.inquiryConversation 
                                    ? `/inquiry/${booking.provider?.id}?conversation=${booking.inquiryConversation.id}`
                                    : `/chat?booking=${booking.id}`
                                  }
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-primary border-primary hover:bg-primary/10"
                                  >
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    Chat
                                  </Button>
                                </Link>
                              )}
                              {booking.status === "pending" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelBooking(booking.id)}
                                >
                                  Cancel
                                </Button>
                              )}
                              {booking.status === "completed" && !booking.hasReview && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setReviewBooking({
                                    id: booking.id,
                                    providerId: booking.provider?.id || "",
                                    providerName: booking.provider?.business_name || "Provider",
                                  })}
                                >
                                  <Star className="h-3 w-3 mr-1" />
                                  Leave Review
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

      <Footer />
    </div>
  );
};

export default MyBookings;
