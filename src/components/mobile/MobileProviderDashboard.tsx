import { useState, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, isSameDay } from "date-fns";
import {
  Calendar,
  Clock,
  User,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Inbox,
  Settings,
  Circle,
  Loader2,
  ChevronRight,
  Star,
  MessageCircle,
  LogOut,
  CalendarDays,
  Plus,
  Trash2,
  CalendarX,
  Package,
  Briefcase,
  UserCircle,
  CreditCard,
  IndianRupee,
  Pencil,
} from "lucide-react";
import { MobileLayout } from "./MobileLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { PaymentHistorySection } from "@/components/PaymentHistorySection";
import { EditPaymentDialog } from "@/components/EditPaymentDialog";

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-600", icon: AlertCircle },
  accepted: { label: "Accepted", color: "bg-green-500/10 text-green-600", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-600", icon: XCircle },
  completed: { label: "Completed", color: "bg-blue-500/10 text-blue-600", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground", icon: XCircle },
};

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

type TabType = "pending" | "active" | "calendar" | "inquiries" | "messages" | "payments" | "history" | "profile";

const MobileProviderDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [rejectingBooking, setRejectingBooking] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Availability state
  const [blockDateDialogOpen, setBlockDateDialogOpen] = useState(false);
  const [selectedDatesToBlock, setSelectedDatesToBlock] = useState<Date[]>([]);
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [selectedRecurringDays, setSelectedRecurringDays] = useState<number[]>([]);
  
  // Delete provider dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  
  // Edit payment dialog
  const [editPaymentDialog, setEditPaymentDialog] = useState<{
    id: string;
    amount: number;
    payment_description: string | null;
    booking_id: string;
  } | null>(null);

  // Fetch provider profile
  const { data: provider, refetch: refetchProvider } = useQuery({
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

  // Fetch bookings
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

      if (!bookingsData || bookingsData.length === 0) return [];

      const userIds = [...new Set(bookingsData.map((b) => b.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      // Fetch pending payments for these bookings
      const bookingIds = bookingsData.map(b => b.id);
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("id, booking_id, amount, status, is_provider_requested, payment_description")
        .in("booking_id", bookingIds)
        .eq("status", "pending")
        .eq("is_provider_requested", true);

      const pendingPaymentsByBookingId = new Map(
        paymentsData?.map(p => [p.booking_id, p]) || []
      );

      return bookingsData.map((booking) => ({
        ...booking,
        customer: profileMap.get(booking.user_id) || null,
        pendingPayment: pendingPaymentsByBookingId.get(booking.id),
      }));
    },
    enabled: !!provider?.id,
  });

  // Fetch availability data
  const { data: availability = [], refetch: refetchAvailability } = useQuery({
    queryKey: ["provider-availability", provider?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_provider_availability")
        .select("*")
        .eq("provider_id", provider!.id)
        .order("specific_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!provider?.id,
  });

  // Fetch service bundles
  const { data: bundles = [] } = useQuery({
    queryKey: ["provider-bundles", provider?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_bundles")
        .select("*, bundle_items(*)")
        .eq("provider_id", provider!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!provider?.id,
  });

  // Fetch additional services
  const { data: additionalServices = [] } = useQuery({
    queryKey: ["additional-services", provider?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("additional_services")
        .select("*")
        .eq("provider_id", provider!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!provider?.id,
  });

  // Fetch inquiry conversations
  const { data: inquiries = [] } = useQuery({
    queryKey: ["provider-inquiries", provider?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiry_conversations")
        .select(`
          *,
          inquiry_messages(id, message, created_at, read, sender_id)
        `)
        .eq("provider_id", provider!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!provider?.id,
  });

  const { isPulling, isRefreshing, pullDistance, pullProgress, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh({
    onRefresh: async () => {
      await Promise.all([refetch(), refetchAvailability(), refetchProvider()]);
    },
  });

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const activeBookings = bookings.filter((b) => b.status === "accepted");
  const pastBookings = bookings.filter((b) =>
    ["completed", "rejected", "cancelled"].includes(b.status)
  );

  // Availability helpers
  const blockedDates = availability
    .filter((a) => a.specific_date && a.is_blocked)
    .map((a) => new Date(a.specific_date!));
  
  const recurringBlockedDays = availability
    .filter((a) => a.day_of_week !== null && a.is_blocked)
    .map((a) => a.day_of_week!);

  const isDateBlocked = (date: Date) => {
    if (blockedDates.some((d) => isSameDay(d, date))) return true;
    if (recurringBlockedDays.includes(date.getDay())) return true;
    return false;
  };

  // Add blocked dates mutation
  const addBlockedDatesMutation = useMutation({
    mutationFn: async (dates: Date[]) => {
      const records = dates.map((date) => ({
        provider_id: provider!.id,
        specific_date: format(date, "yyyy-MM-dd"),
        is_blocked: true,
        is_available: false,
        start_time: "00:00",
        end_time: "23:59",
      }));

      const { error } = await supabase
        .from("service_provider_availability")
        .insert(records);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-availability", provider?.id] });
      toast({ title: "Dates blocked", description: "Selected dates have been blocked" });
      setBlockDateDialogOpen(false);
      setSelectedDatesToBlock([]);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Remove blocked date mutation
  const removeBlockedDateMutation = useMutation({
    mutationFn: async (date: Date) => {
      const { error } = await supabase
        .from("service_provider_availability")
        .delete()
        .eq("provider_id", provider!.id)
        .eq("specific_date", format(date, "yyyy-MM-dd"));

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-availability", provider?.id] });
      toast({ title: "Date unblocked", description: "Date is now available" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update recurring days mutation
  const updateRecurringDaysMutation = useMutation({
    mutationFn: async (days: number[]) => {
      await supabase
        .from("service_provider_availability")
        .delete()
        .eq("provider_id", provider!.id)
        .not("day_of_week", "is", null);

      if (days.length > 0) {
        const records = days.map((day) => ({
          provider_id: provider!.id,
          day_of_week: day,
          is_blocked: true,
          is_available: false,
          start_time: "00:00",
          end_time: "23:59",
        }));

        const { error } = await supabase
          .from("service_provider_availability")
          .insert(records);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-availability", provider?.id] });
      toast({ title: "Schedule updated", description: "Weekly schedule has been updated" });
      setRecurringDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDatesToBlock((prev) => {
      const exists = prev.some((d) => isSameDay(d, date));
      if (exists) {
        return prev.filter((d) => !isSameDay(d, date));
      }
      return [...prev, date];
    });
  };

  const toggleRecurringDay = (day: number) => {
    setSelectedRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

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

  const handleReject = async (bookingId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason || null,
        })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Booking rejected",
        description: "The customer has been notified.",
      });
      setRejectingBooking(null);
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

  const handleStatusChange = async (newStatus: string) => {
    if (!provider) return;
    
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
      queryClient.invalidateQueries({ queryKey: ["my-provider-profile"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteProvider = async () => {
    if (!provider) return;
    
    try {
      const { error } = await supabase
        .from("service_providers")
        .update({ 
          status: "rejected",
          rejection_reason: deleteReason || "Provider requested account deletion"
        })
        .eq("id", provider.id);

      if (error) throw error;

      toast({
        title: "Account deleted",
        description: "Your provider account has been deactivated.",
      });
      setDeleteDialogOpen(false);
      navigate("/");
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

  if (!provider) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No Provider Profile</h2>
          <p className="text-sm text-muted-foreground mb-4">
            You need an approved provider profile to access this dashboard.
          </p>
          <Button onClick={() => navigate("/become-provider")}>
            Become a Provider
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "text-green-500";
      case "busy": return "text-yellow-500";
      default: return "text-muted-foreground";
    }
  };

  const tabs = [
    { key: "pending" as TabType, label: `Pending(${pendingBookings.length})` },
    { key: "active" as TabType, label: `Active(${activeBookings.length})` },
    { key: "calendar" as TabType, label: "Calendar", icon: CalendarDays },
    { key: "inquiries" as TabType, label: "Inquiries", icon: MessageSquare },
    { key: "messages" as TabType, label: "Messages", icon: MessageCircle },
    { key: "payments" as TabType, label: "Payments", icon: CreditCard },
    { key: "history" as TabType, label: `History(${pastBookings.length})` },
    { key: "profile" as TabType, label: "Profile", icon: Settings },
  ];

  const getDisplayedBookings = () => {
    switch (activeTab) {
      case "pending": return pendingBookings;
      case "active": return activeBookings;
      case "history": return pastBookings;
      default: return [];
    }
  };

  const displayedBookings = getDisplayedBookings();

  const renderBookingCard = (booking: any, index: number) => {
    const status = statusConfig[booking.status as keyof typeof statusConfig];
    const StatusIcon = status.icon;

    return (
      <motion.div
        key={booking.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-card rounded-xl border overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">
                    {booking.customer?.full_name || "Customer"}
                  </h3>
                  {booking.customer?.phone && (
                    <p className="text-xs text-muted-foreground">
                      {booking.customer.phone}
                    </p>
                  )}
                </div>
                <Badge className={`${status.color} text-xs`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(booking.service_date), "MMM d, yyyy")}</span>
                {booking.service_time && (
                  <>
                    <Clock className="h-3 w-3 ml-1" />
                    <span>{booking.service_time}</span>
                  </>
                )}
              </div>

              {booking.message && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 flex items-start gap-1">
                  <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {booking.message}
                </p>
              )}
            </div>
          </div>

          {/* Pending Actions */}
          {booking.status === "pending" && rejectingBooking !== booking.id && (
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9"
                onClick={() => setRejectingBooking(booking.id)}
                disabled={isProcessing}
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                className="flex-1 h-9 gradient-gold text-primary-foreground"
                onClick={() => handleAccept(booking.id)}
                disabled={isProcessing}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Accept
              </Button>
            </div>
          )}

          {/* Rejection Form */}
          {rejectingBooking === booking.id && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Reason for rejection (optional)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setRejectingBooking(null);
                    setRejectionReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleReject(booking.id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Reject"}
                </Button>
              </div>
            </div>
          )}

          {/* Active Booking Actions */}
          {booking.status === "accepted" && (
            <div className="flex flex-col gap-2 mt-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9"
                  onClick={() => navigate(`/chat?booking=${booking.id}`)}
                >
                  <MessageCircle className="h-3.5 w-3.5 mr-1" />
                  Chat
                </Button>
                {!booking.completion_confirmed_by_provider && (
                  <Button
                    size="sm"
                    className="flex-1 h-9"
                    onClick={() => navigate(`/provider-dashboard?complete=${booking.id}`)}
                  >
                    Mark Complete
                  </Button>
                )}
              </div>
              {/* Payment request/edit buttons */}
              {booking.pendingPayment ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-9"
                  onClick={() => setEditPaymentDialog({
                    id: booking.pendingPayment.id,
                    amount: booking.pendingPayment.amount,
                    payment_description: booking.pendingPayment.payment_description,
                    booking_id: booking.id,
                  })}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit ₹{booking.pendingPayment.amount?.toLocaleString()} Request
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <MobileLayout>
      <div
        ref={scrollRef}
        className="min-h-screen bg-background pb-24"
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
              <Loader2 className={`h-6 w-6 text-primary ${isRefreshing ? "animate-spin" : ""}`} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-4 pt-4">
          {/* Header with Status */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">{provider.business_name}</p>
            </div>
            <Select
              value={provider.availability_status || "offline"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-28 h-9">
                <Circle className={`h-2 w-2 mr-2 fill-current ${getStatusColor(provider.availability_status || "offline")}`} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card className="p-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{pendingBookings.length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{activeBookings.length}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <p className="text-2xl font-bold">{provider.total_reviews || 0}</p>
                <p className="text-xs text-muted-foreground">Reviews</p>
              </div>
            </Card>
          </div>

          {/* Rating Card */}
          {provider.rating && provider.rating > 0 && (
            <Card className="mb-4 bg-gradient-to-r from-primary/10 to-primary/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Star className="h-6 w-6 text-primary fill-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{provider.rating.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Average Rating</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs - Scrollable */}
          <div className="flex gap-2 mb-4 overflow-x-auto -mx-4 px-4 pb-2 no-scrollbar">
            {tabs.map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "outline"}
                size="sm"
                className="flex-shrink-0 text-xs"
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon && <tab.icon className="h-3.5 w-3.5 mr-1" />}
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "calendar" ? (
            <div className="space-y-4">
              {/* Weekly Off Days */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sm">Weekly Off Days</h3>
                      <p className="text-xs text-muted-foreground">Days you're unavailable every week</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRecurringDays(recurringBlockedDays);
                        setRecurringDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recurringBlockedDays.length === 0 ? (
                      <span className="text-sm text-muted-foreground">
                        Available all days
                      </span>
                    ) : (
                      DAYS_OF_WEEK.filter((d) => recurringBlockedDays.includes(d.value)).map(
                        (day) => (
                          <Badge key={day.value} variant="secondary">
                            {day.label}
                          </Badge>
                        )
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Blocked Dates */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sm">Blocked Dates</h3>
                      <p className="text-xs text-muted-foreground">Specific dates when you're unavailable</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setBlockDateDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Block
                    </Button>
                  </div>
                  
                  {blockedDates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No specific dates blocked
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {blockedDates
                        .filter((d) => d >= new Date())
                        .sort((a, b) => a.getTime() - b.getTime())
                        .slice(0, 8)
                        .map((date) => (
                          <Badge
                            key={date.toISOString()}
                            variant="outline"
                            className="flex items-center gap-1 pr-1"
                          >
                            <CalendarX className="h-3 w-3" />
                            {format(date, "MMM d")}
                            <button
                              onClick={() => removeBlockedDateMutation.mutate(date)}
                              className="ml-1 p-0.5 hover:bg-destructive/20 rounded"
                              disabled={removeBlockedDateMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </button>
                          </Badge>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : activeTab === "inquiries" ? (
            <div className="space-y-3">
              {inquiries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-1">No Inquiries</h3>
                  <p className="text-sm text-muted-foreground">
                    Customer inquiries will appear here
                  </p>
                </div>
              ) : (
                inquiries.map((inquiry: any) => (
                  <Card 
                    key={inquiry.id} 
                    className="cursor-pointer"
                    onClick={() => navigate(`/inquiry-chat/${inquiry.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Inquiry #{inquiry.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">
                            {inquiry.inquiry_messages?.length || 0} messages
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : activeTab === "messages" ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">Booking Messages</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Chat with customers who have active bookings
              </p>
              <Button onClick={() => navigate("/chat")}>
                Open Messages
              </Button>
            </div>
          ) : activeTab === "payments" ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-sm">Payment History</h3>
                  </div>
                  <PaymentHistorySection providerId={provider.id} />
                </CardContent>
              </Card>
            </div>
          ) : activeTab === "profile" ? (
            <div className="space-y-4">
              {/* Business Profile */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {provider.logo_url ? (
                        <img src={provider.logo_url} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{provider.business_name}</h3>
                      <p className="text-sm text-muted-foreground">{provider.city}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate("/provider-settings")}>
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {provider.description || "No description set"}
                  </p>
                </CardContent>
              </Card>

              {/* Service Bundles */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-sm">Service Packages</h3>
                    </div>
                    <Badge variant="secondary">{bundles.length}</Badge>
                  </div>
                  {bundles.length === 0 ? (
                    <p className="text-sm text-muted-foreground mb-3">
                      Create service packages to offer bundled services
                    </p>
                  ) : (
                    <div className="space-y-2 mb-3">
                      {bundles.slice(0, 3).map((bundle: any) => (
                        <div key={bundle.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-sm font-medium">{bundle.bundle_name}</span>
                          <span className="text-sm text-primary font-semibold">₹{bundle.discounted_price?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => navigate("/provider-dashboard?tab=bundles")}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Manage Packages
                  </Button>
                </CardContent>
              </Card>

              {/* Additional Services */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-sm">Additional Services</h3>
                    </div>
                    <Badge variant="secondary">{additionalServices.length}</Badge>
                  </div>
                  {additionalServices.length === 0 ? (
                    <p className="text-sm text-muted-foreground mb-3">
                      Add more services you offer
                    </p>
                  ) : (
                    <div className="space-y-2 mb-3">
                      {additionalServices.slice(0, 3).map((service: any) => (
                        <div key={service.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-sm font-medium">{service.service_type}</span>
                          <Badge variant={service.verification_status === "approved" || service.verification_status === "verified" ? "default" : "secondary"} className="text-xs">
                            {service.verification_status === "approved" || service.verification_status === "verified" ? "Verified" : "Pending"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => navigate("/provider-dashboard?tab=services")}
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Manage Services
                  </Button>
                </CardContent>
              </Card>

              {/* Settings Link */}
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={() => navigate("/provider-settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>

              {/* Sign Out */}
              <Button
                variant="ghost"
                className="w-full h-12"
                onClick={async () => {
                  await signOut();
                  navigate("/");
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>

              {/* Delete Account */}
              <Button
                variant="ghost"
                className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Provider Account
              </Button>
            </div>
          ) : (
            /* Bookings List for pending, active, history */
            <>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-card rounded-xl p-4 border">
                      <div className="flex gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayedBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Inbox className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">No {activeTab} bookings</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === "pending" 
                      ? "New booking requests will appear here" 
                      : activeTab === "active"
                        ? "Accepted bookings will appear here"
                        : "Completed bookings will appear here"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedBookings.map((booking, index) => renderBookingCard(booking, index))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Block Dates Dialog */}
        <Dialog open={blockDateDialogOpen} onOpenChange={setBlockDateDialogOpen}>
          <DialogContent className="max-w-sm mx-4">
            <DialogHeader>
              <DialogTitle>Block Dates</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <CalendarComponent
                mode="multiple"
                selected={selectedDatesToBlock}
                onSelect={(dates) => setSelectedDatesToBlock(dates || [])}
                disabled={(date) => date < new Date() || isDateBlocked(date)}
                className={cn("rounded-md border pointer-events-auto")}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {selectedDatesToBlock.length} date(s) selected
            </p>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBlockDateDialogOpen(false);
                  setSelectedDatesToBlock([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => addBlockedDatesMutation.mutate(selectedDatesToBlock)}
                disabled={
                  selectedDatesToBlock.length === 0 ||
                  addBlockedDatesMutation.isPending
                }
              >
                {addBlockedDatesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Block Selected
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Recurring Days Dialog */}
        <Dialog open={recurringDialogOpen} onOpenChange={setRecurringDialogOpen}>
          <DialogContent className="max-w-sm mx-4">
            <DialogHeader>
              <DialogTitle>Set Weekly Off Days</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day.value}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <Label htmlFor={`day-${day.value}`} className="cursor-pointer">
                    {day.label}
                  </Label>
                  <Switch
                    id={`day-${day.value}`}
                    checked={selectedRecurringDays.includes(day.value)}
                    onCheckedChange={() => toggleRecurringDay(day.value)}
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Toggle on days when you're unavailable
            </p>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setRecurringDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  updateRecurringDaysMutation.mutate(selectedRecurringDays)
                }
                disabled={updateRecurringDaysMutation.isPending}
              >
                {updateRecurringDaysMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Provider Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-sm mx-4">
            <DialogHeader>
              <DialogTitle className="text-destructive">Delete Provider Account</DialogTitle>
              <DialogDescription>
                This will deactivate your provider profile. You won't be able to receive new bookings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Label>Reason for leaving (optional)</Label>
              <Textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Tell us why you're leaving..."
                className="min-h-[80px]"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProvider}
              >
                Delete Account
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
      </div>
    </MobileLayout>
  );
};

export default MobileProviderDashboard;
