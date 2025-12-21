import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  FileText,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConversationHistory } from "@/components/ConversationHistory";
import { useAuth } from "@/hooks/useAuth";
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

const BookingDetails = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch booking details
  const { data: booking, isLoading } = useQuery({
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-12 px-4">
          <div className="container max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/4" />
              <div className="h-64 bg-muted rounded-xl" />
              <div className="h-48 bg-muted rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-12 px-4">
          <div className="container max-w-4xl mx-auto text-center">
            <h1 className="font-display text-2xl font-bold mb-4">Booking not found</h1>
            <p className="text-muted-foreground mb-6">
              This booking may not exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate("/my-bookings")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Bookings
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const status = statusConfig[booking.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 md:pt-32 pb-12 px-4">
        <div className="container max-w-4xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate("/my-bookings")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Bookings
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 rounded-xl">
                      <AvatarImage src={booking.provider?.logo_url} />
                      <AvatarFallback className="rounded-xl text-2xl">
                        {booking.provider?.category?.icon || "🙏"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h1 className="font-display text-xl md:text-2xl font-bold">
                        {booking.provider?.business_name}
                      </h1>
                      <p className="text-muted-foreground text-sm">
                        {booking.provider?.category?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${status.color} flex items-center gap-1`}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                    {booking.status === "accepted" && (
                      <Link
                        to={
                          inquiryConversation
                            ? `/inquiry/${booking.provider?.id}?conversation=${inquiryConversation.id}`
                            : `/chat?booking=${booking.id}`
                        }
                      >
                        <Button size="sm" variant="outline">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Chat
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Details */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Service Date</p>
                      <p className="font-medium">
                        {format(new Date(booking.service_date), "PPP")}
                      </p>
                    </div>
                  </div>

                  {booking.service_time && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium">{booking.service_time}</p>
                      </div>
                    </div>
                  )}

                  {booking.provider?.city && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">
                          {["accepted", "completed"].includes(booking.status) && booking.provider.address
                            ? `${booking.provider.address}, ${booking.provider.city}`
                            : booking.provider.city}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {booking.message && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Message</p>
                    <p className="text-foreground">{booking.message}</p>
                  </div>
                )}

                {booking.special_requirements && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">
                      Special Requirements
                    </p>
                    <p className="text-foreground">{booking.special_requirements}</p>
                  </div>
                )}

                {booking.rejection_reason && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-destructive mb-1">Rejection Reason</p>
                    <p className="text-destructive">{booking.rejection_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conversation History */}
            {inquiryConversation && (
              <ConversationHistory
                conversationId={inquiryConversation.id}
                providerName={booking.provider?.business_name || "Provider"}
                providerAvatar={booking.provider?.logo_url}
              />
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BookingDetails;