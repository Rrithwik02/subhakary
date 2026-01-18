import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Settings,
  Circle,
  Loader2,
  ChevronRight,
  TrendingUp,
  Star,
  MessageCircle,
} from "lucide-react";
import { MobileLayout } from "./MobileLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { supabase } from "@/integrations/supabase/client";

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-600", icon: AlertCircle },
  accepted: { label: "Accepted", color: "bg-green-500/10 text-green-600", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-600", icon: XCircle },
  completed: { label: "Completed", color: "bg-blue-500/10 text-blue-600", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground", icon: XCircle },
};

type TabType = "pending" | "active" | "history";

const MobileProviderDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [rejectingBooking, setRejectingBooking] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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

      return bookingsData.map((booking) => ({
        ...booking,
        customer: profileMap.get(booking.user_id) || null,
      }));
    },
    enabled: !!provider?.id,
  });

  const { isPulling, isRefreshing, pullDistance, pullProgress, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh({
    onRefresh: async () => {
      await refetch();
    },
  });

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const activeBookings = bookings.filter((b) => b.status === "accepted");
  const pastBookings = bookings.filter((b) =>
    ["completed", "rejected", "cancelled"].includes(b.status)
  );

  const displayedBookings = activeTab === "pending" 
    ? pendingBookings 
    : activeTab === "active" 
      ? activeBookings 
      : pastBookings;

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
          {provider.rating && (
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

          {/* Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto -mx-4 px-4 pb-2">
            {[
              { key: "pending", label: "Pending", count: pendingBookings.length },
              { key: "active", label: "Active", count: activeBookings.length },
              { key: "history", label: "History", count: pastBookings.length },
            ].map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "outline"}
                size="sm"
                className="flex-shrink-0"
                onClick={() => setActiveTab(tab.key as TabType)}
              >
                {tab.label}
                {tab.count > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                    {tab.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Bookings List */}
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
              {displayedBookings.map((booking, index) => {
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
                        <div className="flex gap-2 mt-3">
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
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Settings Link */}
          <Button
            variant="outline"
            className="w-full mt-6 h-12"
            onClick={() => navigate("/provider-dashboard")}
          >
            <Settings className="h-4 w-4 mr-2" />
            Full Dashboard & Settings
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileProviderDashboard;
