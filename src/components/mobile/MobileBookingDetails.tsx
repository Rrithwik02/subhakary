import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  CreditCard,
  Star,
} from "lucide-react";
import { MobileLayout } from "./MobileLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConversationHistory } from "@/components/ConversationHistory";
import { CustomerVerificationDialog } from "@/components/CustomerVerificationDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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

const MobileBookingDetails = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch booking details
  const { data: booking, isLoading, refetch } = useQuery({
    queryKey: ["booking-details", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          provider:service_providers(
            id,
            business_name,
            logo_url,
            city,
            address,
            category:service_categories(name, icon)
          )
        `)
        .eq("id", bookingId)
        .eq("user_id", user!.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!bookingId && !!user,
  });

  // Fetch linked inquiry conversation
  const { data: inquiryConversation } = useQuery({
    queryKey: ["booking-conversation", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiry_conversations")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!bookingId && !!user,
  });

  // Fetch pending payments for this booking
  const { data: pendingPayment } = useQuery({
    queryKey: ["booking-pending-payment", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("booking_id", bookingId)
        .eq("status", "pending")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!bookingId && !!user,
  });

  // Fetch completion details
  const { data: completionDetails } = useQuery({
    queryKey: ["booking-completion-details", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_completion_details")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!bookingId && !!user,
  });

  // Check if user has already reviewed
  const { data: existingReview } = useQuery({
    queryKey: ["booking-review", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!bookingId && !!user && booking?.status === "completed",
  });

  if (authLoading || isLoading) {
    return (
      <MobileLayout title="Booking Details" showBackButton>
        <div className="p-4 space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </MobileLayout>
    );
  }

  if (!booking) {
    return (
      <MobileLayout title="Booking Details" showBackButton>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="font-semibold text-lg mb-2">Booking not found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This booking may not exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate("/my-bookings")}>
            Back to My Bookings
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const status = statusConfig[booking.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;
  const showVerificationDialog = booking.completion_status === "pending_customer_verification" && completionDetails;
  const canReview = booking.status === "completed" && !existingReview;

  return (
    <MobileLayout title="Booking Details" showBackButton>
      <div className="p-4 pb-32 space-y-4">
        {/* Provider Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-14 w-14 rounded-xl">
                  <AvatarImage src={booking.provider?.logo_url} />
                  <AvatarFallback className="rounded-xl text-2xl bg-primary/10">
                    {booking.provider?.category?.icon || "🙏"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-lg truncate">
                    {booking.provider?.business_name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {booking.provider?.category?.name}
                  </p>
                  <Badge className={`${status.color} mt-2 flex items-center gap-1 w-fit`}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Booking Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Booking Details
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm font-medium">
                      {format(new Date(booking.service_date), "PPP")}
                    </p>
                  </div>
                </div>

                {booking.service_time && (
                  <div className="flex items-start gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="text-sm font-medium">{booking.service_time}</p>
                    </div>
                  </div>
                )}

                {booking.provider?.city && (
                  <div className="flex items-start gap-2 col-span-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-medium">
                        {["accepted", "completed"].includes(booking.status) && booking.provider.address
                          ? `${booking.provider.address}, ${booking.provider.city}`
                          : booking.provider.city}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {booking.message && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Message</p>
                  <p className="text-sm">{booking.message}</p>
                </div>
              )}

              {booking.special_requirements && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Special Requirements</p>
                  <p className="text-sm">{booking.special_requirements}</p>
                </div>
              )}

              {booking.rejection_reason && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-destructive mb-1">Rejection Reason</p>
                  <p className="text-sm text-destructive">{booking.rejection_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Conversation History */}
        {inquiryConversation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ConversationHistory
              conversationId={inquiryConversation.id}
              providerName={booking.provider?.business_name || "Provider"}
              providerAvatar={booking.provider?.logo_url}
            />
          </motion.div>
        )}

        {/* Verification Dialog */}
        {showVerificationDialog && booking.provider && (
          <div className="p-4">
            <Button
              className="w-full h-12 gradient-gold"
              onClick={() => setVerificationDialogOpen(true)}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Verify Service Completion
            </Button>
          </div>
        )}

        {/* Verification Dialog Modal */}
        {booking.provider && (
          <CustomerVerificationDialog
            bookingId={booking.id}
            providerId={booking.provider.id}
            providerName={booking.provider.business_name}
            open={verificationDialogOpen}
            onOpenChange={setVerificationDialogOpen}
            onVerified={() => refetch()}
          />
        )}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t safe-area-bottom">
        <div className="flex gap-3">
          {/* Payment Button */}
          {pendingPayment && (
            <Button
              className="flex-1 h-12 gradient-gold"
              onClick={() => navigate(`/checkout/${pendingPayment.id}`)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Pay ₹{pendingPayment.amount.toLocaleString()}
            </Button>
          )}

          {/* Chat Button */}
          {booking.status === "accepted" && !pendingPayment && (
            <Button
              className="flex-1 h-12"
              variant="outline"
              onClick={() => {
                if (inquiryConversation) {
                  navigate(`/inquiry/${booking.provider?.id}?conversation=${inquiryConversation.id}`);
                } else {
                  navigate(`/chat?booking=${booking.id}`);
                }
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat with Provider
            </Button>
          )}

          {/* Review Button */}
          {canReview && (
            <Button
              className="flex-1 h-12 gradient-gold"
              onClick={() => navigate(`/provider/${booking.provider?.id}?review=${booking.id}`)}
            >
              <Star className="h-4 w-4 mr-2" />
              Write a Review
            </Button>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileBookingDetails;
