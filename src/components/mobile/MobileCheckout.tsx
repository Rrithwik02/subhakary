import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { MobileLayout } from "./MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const MobileCheckout = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const { data: payment, isLoading, refetch } = useQuery({
    queryKey: ["checkout-payment", paymentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          booking:bookings(
            id,
            user_id,
            service_date,
            service_time,
            message,
            provider:service_providers(
              id,
              business_name,
              logo_url,
              city,
              category:service_categories(name, icon)
            )
          )
        `)
        .eq("id", paymentId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!paymentId && !!user,
  });

  // Subscribe to realtime payment updates
  useEffect(() => {
    if (!paymentId) return;

    const channel = supabase
      .channel(`mobile-checkout-${paymentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "payments",
          filter: `id=eq.${paymentId}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [paymentId, refetch]);

  if (authLoading || isLoading) {
    return (
      <MobileLayout title="Checkout" showBackButton>
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      </MobileLayout>
    );
  }

  if (!payment) {
    return (
      <MobileLayout title="Checkout" showBackButton>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="font-semibold text-lg mb-2">Payment not found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This payment may not exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate("/my-bookings")}>
            Back to My Bookings
          </Button>
        </div>
      </MobileLayout>
    );
  }

  if (payment.booking?.user_id !== user?.id) {
    return (
      <MobileLayout title="Checkout" showBackButton>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="font-semibold text-lg mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground mb-4">
            You can only pay for your own bookings.
          </p>
          <Button onClick={() => navigate("/my-bookings")}>
            Back to My Bookings
          </Button>
        </div>
      </MobileLayout>
    );
  }

  if (payment.status === "completed") {
    return (
      <MobileLayout title="Payment Complete" showBackButton={false}>
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </motion.div>
          <h2 className="font-semibold text-xl mb-2">Payment Successful!</h2>
          <p className="text-muted-foreground mb-6">
            Your payment of ₹{payment.amount.toLocaleString()} has been processed.
          </p>
          <Button className="gradient-gold" onClick={() => navigate("/my-bookings")}>
            View My Bookings
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Checkout" showBackButton>
      <div className="p-4 pb-32 space-y-4">
        {/* Provider Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 rounded-xl">
                  <AvatarImage src={payment.booking?.provider?.logo_url} />
                  <AvatarFallback className="rounded-xl text-2xl bg-primary/10">
                    {payment.booking?.provider?.category?.icon || "🙏"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {payment.booking?.provider?.business_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {payment.booking?.provider?.category?.name} • {payment.booking?.provider?.city}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Payment Details</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-y">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Service Date
                  </p>
                  <p className="text-sm font-medium">
                    {payment.booking?.service_date
                      ? format(new Date(payment.booking.service_date), "PPP")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment Type</p>
                  <Badge variant="secondary" className="mt-1">
                    {payment.payment_type}
                  </Badge>
                </div>
              </div>

              {/* Amount */}
              <div className="p-4 bg-primary/5 rounded-xl text-center">
                <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
                <p className="text-3xl font-bold text-primary flex items-center justify-center">
                  <IndianRupee className="h-6 w-6" />
                  {payment.amount.toLocaleString()}
                </p>
              </div>

              {payment.payment_description && (
                <p className="text-sm text-muted-foreground text-center">
                  {payment.payment_description}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Online Payment Coming Soon */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-primary/20">
            <CardContent className="p-6 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Online Payment Coming Soon</h3>
              <p className="text-sm text-muted-foreground">
                Online payment gateway is being set up. Please coordinate with your provider for payment details.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate("/my-bookings")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Bookings
        </Button>
      </div>
    </MobileLayout>
  );
};

export default MobileCheckout;
