import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  User,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Inbox,
  MessageCircle,
  CalendarDays,
  Settings,
  Trash2,
  AlertTriangle,
  Circle,
  IndianRupee,
  CreditCard,
  Pencil,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProviderChatSection } from "@/components/ProviderChatSection";
import { ProviderInquiryChat } from "@/components/ProviderInquiryChat";
import { ProviderLogoUpload } from "@/components/ProviderLogoUpload";
import { ProviderPortfolioUpload } from "@/components/ProviderPortfolioUpload";
import { useMobileLayout } from "@/hooks/useMobileLayout";
import MobileProviderDashboard from "@/components/mobile/MobileProviderDashboard";
import { ProviderProfileEdit } from "@/components/ProviderProfileEdit";
import { ProviderAvailabilityManager } from "@/components/ProviderAvailabilityManager";
import { ProviderBundleManager } from "@/components/ProviderBundleManager";
import BookingCalendar from "@/components/BookingCalendar";
import { CompletionDetailsForm } from "@/components/CompletionDetailsForm";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { AdditionalServicesManager } from "@/components/AdditionalServicesManager";
import { PaymentHistorySection } from "@/components/PaymentHistorySection";
import { EditPaymentDialog } from "@/components/EditPaymentDialog";

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-600" },
  accepted: { label: "Accepted", color: "bg-green-500/10 text-green-600" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-600" },
  completed: { label: "Completed", color: "bg-blue-500/10 text-blue-600" },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground" },
};

const ProviderDashboard = () => {
  const isMobile = useMobileLayout();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Return mobile version if on mobile
  if (isMobile) {
    return <MobileProviderDashboard />;
  }

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [completionFormBooking, setCompletionFormBooking] = useState<{
    id: string;
    customerName: string;
  } | null>(null);
  const [deleteProviderDialogOpen, setDeleteProviderDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [paymentRequestDialog, setPaymentRequestDialog] = useState<{
    bookingId: string;
    customerName: string;
  } | null>(null);
  const [editPaymentDialog, setEditPaymentDialog] = useState<{
    id: string;
    amount: number;
    payment_description: string | null;
    booking_id: string;
  } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");

  // Fetch provider profile
  const { data: provider } = useQuery({
    queryKey: ["my-provider-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch provider profile id (used for booking chat)
  const { data: providerProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch bookings for this provider
  const {
    data: bookings = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["provider-bookings", provider?.id],
    queryFn: async () => {
      const { data: bookingsData, error } = await supabase
        .from("bookings")
        .select(`*`)
        .eq("provider_id", provider!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch customer profiles for bookings
      if (!bookingsData || bookingsData.length === 0) return [];

      const userIds = [...new Set(bookingsData.map((b) => b.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      // Fetch customer verification timestamps (so UI reflects confirmation)
      const bookingIds = bookingsData.map((b) => b.id);
      const { data: completionRows } = await supabase
        .from("booking_completion_details")
        .select("booking_id, customer_verified_at")
        .in("booking_id", bookingIds);

      const completionMap = new Map(
        completionRows?.map((r) => [r.booking_id, r]) || []
      );

      // Fetch pending payments for these bookings
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("id, booking_id, amount, status, is_provider_requested, payment_description")
        .in("booking_id", bookingIds)
        .eq("status", "pending")
        .eq("is_provider_requested", true);

      const pendingPaymentsByBookingId = new Map(
        paymentsData?.map(p => [p.booking_id, p]) || []
      );

      return bookingsData.map((booking) => {
        const completion = completionMap.get(booking.id) || null;
        const customerVerified = !!completion?.customer_verified_at;

        // UI-only status: treat as completed once customer has verified
        const ui_status =
          booking.status === "accepted" &&
          booking.completion_confirmed_by_provider &&
          customerVerified
            ? "completed"
            : booking.status;

        return {
          ...booking,
          customer: profileMap.get(booking.user_id) || null,
          completion,
          ui_status,
          pendingPayment: pendingPaymentsByBookingId.get(booking.id),
        };
      });
    },
    enabled: !!provider?.id,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!provider?.id) return;

    const channel = supabase
      .channel("provider-bookings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `provider_id=eq.${provider.id}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [provider?.id, refetch]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleAccept = async (bookingId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "accepted" })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Booking accepted",
        description: "The customer has been notified.",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedBooking) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason || null,
        })
        .eq("id", selectedBooking);

      if (error) throw error;

      toast({
        title: "Booking rejected",
        description: "The customer has been notified.",
      });
      setRejectDialogOpen(false);
      setSelectedBooking(null);
      setRejectionReason("");
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenCompletionForm = (bookingId: string, customerName: string) => {
    setCompletionFormBooking({ id: bookingId, customerName });
  };

  const handleDeleteAsProvider = async (reason: string) => {
    if (!provider) return;

    try {
      // Mark the provider as deleted by updating status
      const { error } = await supabase
        .from("service_providers")
        .update({ 
          status: "rejected" as const,
          rejection_reason: "User deleted their provider account" + (reason ? `: ${reason}` : "")
        })
        .eq("id", provider.id);

      if (error) throw error;

      toast({
        title: "Provider account deleted",
        description: "You have been reverted to a customer account.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete provider account",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!provider) return;
    
    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from("service_providers")
        .update({ availability_status: newStatus })
        .eq("id", provider.id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `You are now ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRequestPayment = async () => {
    if (!paymentRequestDialog || !paymentAmount) return;

    setIsProcessing(true);
    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount.",
          variant: "destructive",
        });
        return;
      }

      // Create a payment request
      const { error } = await supabase
        .from("payments")
        .insert({
          booking_id: paymentRequestDialog.bookingId,
          amount,
          payment_type: "advance",
          is_provider_requested: true,
          provider_requested_amount: amount,
          payment_description: paymentDescription || "Advance payment requested by provider",
          status: "pending",
        });

      if (error) throw error;

      // Update booking to mark payment as requested
      await supabase
        .from("bookings")
        .update({ provider_payment_requested: true })
        .eq("id", paymentRequestDialog.bookingId);

      toast({
        title: "Payment requested",
        description: `Payment request of ₹${amount.toLocaleString()} sent to ${paymentRequestDialog.customerName}.`,
      });
      
      setPaymentRequestDialog(null);
      setPaymentAmount("");
      setPaymentDescription("");
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment request",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-500";
      case "busy":
        return "text-yellow-500";
      default:
        return "text-muted-foreground";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="pt-32 pb-12 px-4">
          <div className="container max-w-4xl mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">
              No Approved Provider Profile
            </h1>
            <p className="text-muted-foreground mb-6">
              You need an approved provider profile to access this dashboard.
            </p>
            <Button onClick={() => navigate("/become-provider")}>
              Apply to Become a Provider
            </Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const activeBookings = bookings.filter((b) => b.status === "accepted");
  const pastBookings = bookings.filter((b) =>
    ["completed", "rejected", "cancelled"].includes(b.status)
  );

  const BookingCard = ({
    booking,
    showActions = false,
  }: {
    booking: any;
    showActions?: boolean;
  }) => {
    const status = statusConfig[(booking.ui_status || booking.status) as keyof typeof statusConfig];

    return (
      <Card className="hover-lift">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {booking.customer?.full_name || "Customer"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {booking.customer?.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-3">
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
              </div>

              {booking.message && (
                <p className="text-sm text-muted-foreground mt-3 flex items-start gap-1">
                  <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{booking.message}</span>
                </p>
              )}

              {booking.rejection_reason && (
                <p className="text-sm text-destructive mt-2">
                  Rejection reason: {booking.rejection_reason}
                </p>
              )}

              {/* Completion Details Summary */}
              {booking.ui_status === "completed" && booking.completion_details && (
                <div className="mt-4 p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                  <h4 className="text-sm font-semibold text-secondary flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Completion Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Amount Charged:</span>
                      <span className="ml-2 font-medium">₹{booking.completion_details.amount_charged?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="ml-2 font-medium">{booking.completion_details.completion_days} day(s)</span>
                    </div>
                  </div>
                  {booking.completion_details.service_description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <span className="font-medium">Service:</span> {booking.completion_details.service_description}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-3">
              <Badge className={status.color}>{status.label}</Badge>

              {showActions && booking.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedBooking(booking.id);
                      setRejectDialogOpen(true);
                    }}
                    disabled={isProcessing}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="gradient-gold text-primary-foreground"
                    onClick={() => handleAccept(booking.id)}
                    disabled={isProcessing}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                </div>
              )}

              {showActions && booking.status === "accepted" && booking.ui_status !== "completed" && (
                <div className="flex flex-col gap-2">
                  {/* Request Payment Button - only show if no pending payment */}
                  {!booking.pendingPayment && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPaymentRequestDialog({
                        bookingId: booking.id,
                        customerName: booking.customer?.full_name || "Customer",
                      })}
                      disabled={isProcessing}
                    >
                      <IndianRupee className="h-4 w-4 mr-1" />
                      Request Payment
                    </Button>
                  )}
                  {/* Edit/Cancel Payment buttons if payment is pending */}
                  {booking.pendingPayment && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditPaymentDialog({
                          id: booking.pendingPayment.id,
                          amount: booking.pendingPayment.amount,
                          payment_description: booking.pendingPayment.payment_description,
                          booking_id: booking.id,
                        })}
                        disabled={isProcessing}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit ₹{booking.pendingPayment.amount?.toLocaleString()}
                      </Button>
                    </div>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleOpenCompletionForm(
                      booking.id, 
                      booking.customer?.full_name || "Customer"
                    )}
                    disabled={isProcessing || booking.completion_confirmed_by_provider}
                  >
                    {booking.completion_confirmed_by_provider 
                      ? "Awaiting Customer Confirmation" 
                      : "Mark Completed"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-12 px-4">
        <div className="container max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  Provider Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage your bookings for {provider.business_name}
                </p>
              </div>
              
              {/* Availability Status Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Select
                  value={provider.availability_status || "offline"}
                  onValueChange={handleStatusChange}
                  disabled={isUpdatingStatus}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <Circle className={`h-2 w-2 fill-current ${getStatusColor(provider.availability_status || "offline")}`} />
                        <span className="capitalize">{provider.availability_status || "offline"}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">
                      <div className="flex items-center gap-2">
                        <Circle className="h-2 w-2 fill-current text-green-500" />
                        <span>Online</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="busy">
                      <div className="flex items-center gap-2">
                        <Circle className="h-2 w-2 fill-current text-yellow-500" />
                        <span>Busy</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="offline">
                      <div className="flex items-center gap-2">
                        <Circle className="h-2 w-2 fill-current text-muted-foreground" />
                        <span>Offline</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-yellow-600">
                    {pendingBookings.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {activeBookings.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {bookings.filter((b) => b.status === "completed").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="pending" className="flex-1 min-w-[80px] text-xs sm:text-sm">
                  Pending ({pendingBookings.length})
                </TabsTrigger>
                <TabsTrigger value="active" className="flex-1 min-w-[80px] text-xs sm:text-sm">
                  Active ({activeBookings.length})
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex-1 min-w-[80px] text-xs sm:text-sm flex items-center justify-center gap-1">
                  <CalendarDays className="h-3 w-3 hidden sm:block" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger value="inquiries" className="flex-1 min-w-[80px] text-xs sm:text-sm flex items-center justify-center gap-1">
                  <MessageSquare className="h-3 w-3 hidden sm:block" />
                  Inquiries
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex-1 min-w-[80px] text-xs sm:text-sm flex items-center justify-center gap-1">
                  <MessageCircle className="h-3 w-3 hidden sm:block" />
                  Messages
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex-1 min-w-[80px] text-xs sm:text-sm flex items-center justify-center gap-1">
                  <CreditCard className="h-3 w-3 hidden sm:block" />
                  Payments
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1 min-w-[80px] text-xs sm:text-sm">
                  History ({pastBookings.length})
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex-1 min-w-[80px] text-xs sm:text-sm flex items-center justify-center gap-1">
                  <Settings className="h-3 w-3 hidden sm:block" />
                  Profile
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                          <div className="h-4 bg-muted rounded w-1/2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : pendingBookings.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-display text-xl font-semibold mb-2">
                        No pending bookings
                      </h3>
                      <p className="text-muted-foreground">
                        New booking requests will appear here
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pendingBookings.map((booking, i) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <BookingCard booking={booking} showActions />
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="active" className="mt-6">
                {activeBookings.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-display text-xl font-semibold mb-2">
                        No active bookings
                      </h3>
                      <p className="text-muted-foreground">
                        Accepted bookings will appear here
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {activeBookings.map((booking, i) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <BookingCard booking={booking} showActions />
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="calendar" className="mt-6">
                <BookingCalendar providerId={provider.id} />
              </TabsContent>

              <TabsContent value="inquiries" className="mt-6">
                <ProviderInquiryChat providerId={provider.id} />
              </TabsContent>

              <TabsContent value="messages" className="mt-6">
                <ProviderChatSection 
                  providerId={provider.id} 
                  providerProfileId={providerProfile?.id || ""} 
                />
              </TabsContent>

              <TabsContent value="payments" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PaymentHistorySection providerId={provider.id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                {pastBookings.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-display text-xl font-semibold mb-2">
                        No booking history
                      </h3>
                      <p className="text-muted-foreground">
                        Completed and past bookings will appear here
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pastBookings.map((booking, i) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <BookingCard booking={booking} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="profile" className="mt-6 space-y-6">
                <ProviderLogoUpload
                  providerId={provider.id}
                  currentLogoUrl={provider.logo_url}
                  businessName={provider.business_name}
                  onLogoUpdated={() => refetch()}
                />
                
                <ProviderPortfolioUpload
                  providerId={provider.id}
                  currentImages={provider.portfolio_images || []}
                  onImagesUpdated={() => refetch()}
                />
                
                <ProviderProfileEdit
                  providerId={provider.id}
                  initialData={{
                    business_name: provider.business_name,
                    description: provider.description,
                    city: provider.city,
                    address: provider.address,
                    whatsapp_number: provider.whatsapp_number,
                    website_url: provider.website_url,
                    instagram_url: provider.instagram_url,
                    facebook_url: provider.facebook_url,
                    youtube_url: provider.youtube_url,
                    base_price: provider.base_price,
                    subcategory: provider.subcategory,
                    specializations: provider.specializations,
                  }}
                  onProfileUpdated={() => refetch()}
                />

                <ProviderAvailabilityManager providerId={provider.id} />

                <ProviderBundleManager providerId={provider.id} />

                <AdditionalServicesManager 
                  providerId={provider.id} 
                  primaryCategoryId={provider.category_id || undefined}
                />

                {/* Danger Zone */}
                <Card className="border-destructive/50">
                  <CardHeader>
                    <CardTitle className="font-display flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Danger Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Deleting your service provider account will revert you to a customer account. 
                      Your bookings and reviews will be preserved but you won't be able to accept new bookings.
                    </p>
                    <Button 
                      variant="destructive" 
                      onClick={() => setDeleteProviderDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete as Service Provider
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </section>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Booking</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this booking (optional)
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g., Already booked for this date, Not available in this area..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? "Rejecting..." : "Reject Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completion Details Form */}
      {completionFormBooking && (
        <CompletionDetailsForm
          bookingId={completionFormBooking.id}
          customerName={completionFormBooking.customerName}
          open={!!completionFormBooking}
          onOpenChange={(open) => !open && setCompletionFormBooking(null)}
          onSubmitted={() => refetch()}
        />
      )}

      {/* Delete as Provider Dialog */}
      <DeleteAccountDialog
        open={deleteProviderDialogOpen}
        onOpenChange={setDeleteProviderDialogOpen}
        onConfirm={handleDeleteAsProvider}
        title="Delete Service Provider Account"
        description="You will be reverted to a customer account. Your provider profile will be removed but your customer account will remain."
        isProvider={true}
        willDeleteProvider={false}
      />

      {/* Payment Request Dialog */}
      <Dialog open={!!paymentRequestDialog} onOpenChange={(open) => !open && setPaymentRequestDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Request Payment
            </DialogTitle>
            <DialogDescription>
              Request an advance payment from {paymentRequestDialog?.customerName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Amount (₹)</Label>
              <Input
                id="payment-amount"
                type="number"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-description">Description (optional)</Label>
              <Textarea
                id="payment-description"
                placeholder="e.g., Advance booking fee, Material costs..."
                value={paymentDescription}
                onChange={(e) => setPaymentDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentRequestDialog(null)}>
              Cancel
            </Button>
            <Button
              className="gradient-gold text-primary-foreground"
              onClick={handleRequestPayment}
              disabled={isProcessing || !paymentAmount}
            >
              {isProcessing ? "Sending..." : `Request ₹${paymentAmount || "0"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <EditPaymentDialog
        payment={editPaymentDialog}
        open={!!editPaymentDialog}
        onOpenChange={(open) => !open && setEditPaymentDialog(null)}
        onSuccess={() => refetch()}
      />

      <Footer />
    </div>
  );
};

export default ProviderDashboard;
