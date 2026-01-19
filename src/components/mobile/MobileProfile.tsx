import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,
  LogOut,
  Calendar,
  Clock,
  ChevronRight,
  Settings,
  Shield,
  Heart,
  Bell,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LayoutDashboard,
  Briefcase,
} from "lucide-react";
import { MobileLayout } from "./MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewForm } from "@/components/ReviewForm";
import { CustomerVerificationDialog } from "@/components/CustomerVerificationDialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
});

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    icon: AlertCircle,
  },
  accepted: {
    label: "Confirmed",
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

type TabType = "profile" | "bookings" | "settings";

const MobileProfile = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const { data: profile, isLoading, refetch: refetchProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Check if user is also a provider
  const { data: providerProfile } = useQuery({
    queryKey: ["my-provider", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_providers")
        .select("id, business_name, status")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch bookings
  const { data: bookings = [], refetch: refetchBookings } = useQuery({
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
        .order("service_date", { ascending: false });
      if (error) throw error;
      
      const bookingIds = bookingsData.map(b => b.id);
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("booking_id")
        .in("booking_id", bookingIds);
      
      const reviewedBookingIds = new Set(reviewsData?.map(r => r.booking_id) || []);
      
      return bookingsData.map(booking => ({
        ...booking,
        hasReview: reviewedBookingIds.has(booking.id),
      }));
    },
    enabled: !!user,
  });

  const { isPulling, isRefreshing, pullDistance, pullProgress, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh({
    onRefresh: async () => {
      await Promise.all([refetchProfile(), refetchBookings()]);
    },
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || "",
        email: profile.email || user?.email || "",
        phone: profile.phone || "",
        city: profile.city || "",
      });
    }
  }, [profile, user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = () => {
    try {
      profileSchema.parse({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || undefined,
        city: formData.city || undefined,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm() || !user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          city: formData.city.trim() || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Booking cancelled",
        description: "Your booking has been cancelled.",
      });
      refetchBookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || isLoading) {
    return (
      <MobileLayout hideHeader>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  const upcomingBookings = bookings.filter(b => ["pending", "accepted"].includes(b.status));
  const pastBookings = bookings.filter(b => ["completed", "rejected", "cancelled"].includes(b.status));

  return (
    <MobileLayout hideHeader>
      <div
        ref={scrollRef}
        className="min-h-screen bg-background"
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
              <motion.div
                animate={{ rotate: isRefreshing ? 360 : pullProgress * 360 }}
                transition={{ duration: isRefreshing ? 1 : 0, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
              >
                <Loader2 className={`h-6 w-6 text-primary ${isRefreshing ? "animate-spin" : ""}`} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Header */}
        <div className="bg-gradient-to-b from-primary/20 to-background pt-12 pb-6 px-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-2xl">
                  {formData.fullName?.charAt(0)?.toUpperCase() || <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-md active:scale-95 transition-transform"
              >
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 text-primary-foreground animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{formData.fullName || "Your Name"}</h1>
              <p className="text-sm text-muted-foreground truncate">{formData.email}</p>
              {formData.city && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3" />
                  <span>{formData.city}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex">
            {([
              { id: "profile", label: "Profile", icon: User },
              { id: "bookings", label: "Bookings", icon: Calendar },
              { id: "settings", label: "Settings", icon: Settings },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeProfileTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 py-4 pb-24">
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                {providerProfile?.status === "approved" && (
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex-col gap-1"
                    onClick={() => navigate("/provider-dashboard")}
                  >
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                    <span className="text-xs">Provider Dashboard</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-1"
                  onClick={() => navigate("/favorites")}
                >
                  <Heart className="h-5 w-5 text-primary" />
                  <span className="text-xs">Favorites</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-1"
                  onClick={() => navigate("/notifications")}
                >
                  <Bell className="h-5 w-5 text-primary" />
                  <span className="text-xs">Notifications</span>
                </Button>
                {!providerProfile && (
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex-col gap-1"
                    onClick={() => navigate("/become-provider")}
                  >
                    <Briefcase className="h-5 w-5 text-primary" />
                    <span className="text-xs">Become Provider</span>
                  </Button>
                )}
              </div>

              {/* Edit Profile Section */}
              <div className="bg-card rounded-xl border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Personal Information</h3>
                  {!isEditing ? (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          if (profile) {
                            setFormData({
                              fullName: profile.full_name || "",
                              email: profile.email || user?.email || "",
                              phone: profile.phone || "",
                              city: profile.city || "",
                            });
                          }
                          setErrors({});
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="gradient-gold text-primary-foreground"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Full Name</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="pl-10 h-10"
                        disabled={!isEditing}
                      />
                    </div>
                    {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10 h-10"
                        disabled={!isEditing}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pl-10 h-10"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">City</Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="pl-10 h-10"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "bookings" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Upcoming Bookings */}
              {upcomingBookings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Upcoming</h3>
                  <div className="space-y-3">
                    {upcomingBookings.map((booking) => {
                      const status = statusConfig[booking.status as keyof typeof statusConfig];
                      const StatusIcon = status.icon;
                      return (
                        <motion.div
                          key={booking.id}
                          className="bg-card rounded-xl border p-4 active:scale-[0.98] transition-transform"
                          onClick={() => navigate(`/booking/${booking.id}`)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                              {booking.provider?.logo_url ? (
                                <img src={booking.provider.logo_url} alt="" className="h-full w-full object-cover rounded-xl" />
                              ) : (
                                booking.provider?.category?.icon || "🙏"
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold text-sm truncate">{booking.provider?.business_name || "Provider"}</h4>
                                <Badge className={`${status.color} text-xs flex-shrink-0`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {status.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(booking.service_date), "MMM d, yyyy")}</span>
                                {booking.service_time && (
                                  <>
                                    <Clock className="h-3 w-3 ml-1" />
                                    <span>{booking.service_time}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          </div>
                          {booking.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-3 h-8 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelBooking(booking.id);
                              }}
                            >
                              Cancel Booking
                            </Button>
                          )}
                          {booking.status === "accepted" && booking.completion_confirmed_by_provider && !booking.completion_confirmed_by_customer && (
                            <Button
                              size="sm"
                              className="w-full mt-3 gradient-gold text-primary-foreground h-8 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmBooking({
                                  id: booking.id,
                                  providerId: booking.provider?.id || "",
                                  providerName: booking.provider?.business_name || "Provider",
                                });
                              }}
                            >
                              <Bell className="h-3 w-3 mr-1" />
                              Verify Completion
                            </Button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Past Bookings */}
              {pastBookings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Past</h3>
                  <div className="space-y-3">
                    {pastBookings.slice(0, 5).map((booking) => {
                      const status = statusConfig[booking.status as keyof typeof statusConfig];
                      const StatusIcon = status.icon;
                      return (
                        <motion.div
                          key={booking.id}
                          className="bg-card rounded-xl border p-4 active:scale-[0.98] transition-transform"
                          onClick={() => navigate(`/booking/${booking.id}`)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                              {booking.provider?.logo_url ? (
                                <img src={booking.provider.logo_url} alt="" className="h-full w-full object-cover rounded-xl" />
                              ) : (
                                booking.provider?.category?.icon || "🙏"
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold text-sm truncate">{booking.provider?.business_name || "Provider"}</h4>
                                <Badge className={`${status.color} text-xs flex-shrink-0`}>
                                  {status.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(booking.service_date), "MMM d, yyyy")}</span>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          </div>
                          {booking.status === "completed" && !booking.hasReview && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-3 h-8 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReviewBooking({
                                  id: booking.id,
                                  providerId: booking.provider?.id || "",
                                  providerName: booking.provider?.business_name || "Provider",
                                });
                              }}
                            >
                              <Star className="h-3 w-3 mr-1" />
                              Leave a Review
                            </Button>
                          )}
                          {booking.hasReview && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                              <Star className="h-3 w-3 fill-primary text-primary" />
                              <span>Reviewed</span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {bookings.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">No bookings yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Find and book amazing service providers</p>
                  <Button onClick={() => navigate("/providers")} className="gradient-gold text-primary-foreground">
                    Browse Providers
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <button
                onClick={() => navigate("/notifications")}
                className="w-full flex items-center justify-between p-4 bg-card rounded-xl border active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">Notifications</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              <button
                onClick={() => navigate("/favorites")}
                className="w-full flex items-center justify-between p-4 bg-card rounded-xl border active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">Saved Providers</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              <button
                onClick={() => {}}
                className="w-full flex items-center justify-between p-4 bg-card rounded-xl border active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">Security</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Review Form Dialog */}
        {reviewBooking && (
          <ReviewForm
            bookingId={reviewBooking.id}
            providerId={reviewBooking.providerId}
            providerName={reviewBooking.providerName}
            open={!!reviewBooking}
            onOpenChange={(open) => !open && setReviewBooking(null)}
            onReviewSubmitted={() => refetchBookings()}
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
            onVerified={() => refetchBookings()}
          />
        )}
      </div>
    </MobileLayout>
  );
};

export default MobileProfile;