import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  IndianRupee,
  Clock,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMobileLayout } from "@/hooks/useMobileLayout";
import MobileCheckout from "@/components/mobile/MobileCheckout";

const Checkout = () => {
  const isMobile = useMobileLayout();
  
  if (isMobile) {
    return <MobileCheckout />;
  }
  
  return <DesktopCheckout />;
};

const DesktopCheckout = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

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
      .channel(`checkout-payment-${paymentId}`)
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-12 px-4">
          <div className="container max-w-2xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/4" />
              <div className="h-64 bg-muted rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-12 px-4">
          <div className="container max-w-2xl mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-4">Payment not found</h1>
            <p className="text-muted-foreground mb-6">
              This payment may not exist or you don't have access to it.
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

  if (payment.booking?.user_id !== user?.id) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-12 px-4">
          <div className="container max-w-2xl mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You can only pay for your own bookings.
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

  if (payment.status === "completed") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-12 px-4">
          <div className="container max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </motion.div>
            <h1 className="font-display text-2xl font-bold mb-4">Payment Successful!</h1>
            <p className="text-muted-foreground mb-6">
              Your payment of ₹{payment.amount.toLocaleString()} has been processed successfully.
            </p>
            <Button onClick={() => navigate("/my-bookings")}>
              View My Bookings
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 md:pt-32 pb-12 px-4">
        <div className="container max-w-2xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-secondary/10 rounded-lg">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                    {payment.booking?.provider?.category?.icon || "🙏"}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {payment.booking?.provider?.business_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {payment.booking?.provider?.category?.name} • {payment.booking?.provider?.city}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Service Date
                    </p>
                    <p className="font-medium">
                      {payment.booking?.service_date
                        ? format(new Date(payment.booking.service_date), "PPP")
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Type</p>
                    <Badge variant="secondary">{payment.payment_type}</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount to Pay</p>
                    <p className="text-3xl font-bold text-primary flex items-center">
                      <IndianRupee className="h-6 w-6" />
                      {payment.amount.toLocaleString()}
                    </p>
                  </div>
                  <Badge className="bg-secondary text-secondary-foreground">
                    Advance Payment
                  </Badge>
                </div>

                {payment.payment_description && (
                  <p className="text-sm text-muted-foreground">
                    {payment.payment_description}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Online Payment Coming Soon */}
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

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/my-bookings")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Bookings
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Checkout;
