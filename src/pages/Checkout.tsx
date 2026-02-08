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
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Razorpay type declaration
declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY_ID = "rzp_live_SDbr4C1LPJDdcY";

const Checkout = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Get refetch from query
  const queryResult = useQuery({
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

  const { data: payment, isLoading, refetch } = queryResult;

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


  const handlePayment = async () => {
    if (!payment || !user) return;

    setIsProcessing(true);

    try {
      // Get the session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Session expired",
          description: "Please log in again.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Create Razorpay order via edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-razorpay-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            paymentId: payment.id,
            amount: payment.amount,
            currency: "INR",
            notes: {
              booking_id: payment.booking?.id,
              provider_name: payment.booking?.provider?.business_name,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const orderData = await response.json();

      // Configure Razorpay options
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Subhakary",
        description: `Payment for ${payment.booking?.provider?.business_name}`,
        order_id: orderData.orderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // Verify payment via edge function
          try {
            const verifyResponse = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-razorpay-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  paymentId: payment.id,
                }),
              }
            );

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              setPaymentSuccess(true);
              toast({
                title: "Payment successful!",
                description: "Your payment has been processed successfully.",
              });
            } else {
              toast({
                title: "Payment verification failed",
                description: verifyData.error || "Please contact support.",
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast({
              title: "Verification error",
              description: "Payment may have succeeded. Please check your bookings.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#C4A962",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (response: any) => {
        console.error("Payment failed:", response.error);
        toast({
          title: "Payment failed",
          description: response.error.description || "Please try again.",
          variant: "destructive",
        });
        setIsProcessing(false);
      });

      razorpay.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

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

  // Check if user owns this payment
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

  // Payment already completed
  if (payment.status === "completed" || paymentSuccess) {
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
                {/* Provider Info */}
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

                {/* Booking Details */}
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

                {/* Amount */}
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

            {/* Security Notice */}
            <Card className="border-primary/20">
              <CardContent className="p-4 flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Secure Payment</p>
                  <p className="text-xs text-muted-foreground">
                    Your payment is processed securely via Razorpay. We don't store your card details.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Pay Button */}
            <Button
              className="w-full h-14 text-lg gradient-gold"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Pay ₹{payment.amount.toLocaleString()}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By proceeding, you agree to our Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Checkout;
