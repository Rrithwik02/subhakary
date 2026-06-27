import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Eye,
  BadgeCheck,
  BadgeX,
  Crown,
  Check,
  X,
  LogOut,
  Loader2,
  ChevronRight,
  FileText,
  Layers,
  MessageSquare,
} from "lucide-react";
import { MobileLayout } from "./MobileLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { supabase } from "@/integrations/supabase/client";

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  approved: "bg-green-500/10 text-green-600 border-green-200",
  rejected: "bg-red-500/10 text-red-600 border-red-200",
};

type TabType = "pending" | "approved" | "rejected" | "users";

const MobileAdminDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if user is admin
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "admin",
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch all provider applications
  const {
    data: providers = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["all-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_providers")
        .select(`
          *,
          category:service_categories(name, icon),
          documents:provider_documents(*)
        `)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  // Fetch all users/profiles
  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  // Fetch user roles
  const { data: userRoles = [] } = useQuery({
    queryKey: ["all-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  const { isPulling, isRefreshing, pullDistance, pullProgress, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh({
    onRefresh: async () => {
      await refetch();
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleApprove = async (providerId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("service_providers")
        .update({
          status: "approved",
          is_verified: true,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", providerId);

      if (error) throw error;

      const provider = providers.find((p) => p.id === providerId);
      if (provider) {
        await supabase.from("user_roles").upsert(
          {
            user_id: provider.user_id,
            role: "provider",
          },
          { onConflict: "user_id,role" }
        );
      }

      toast({
        title: "Provider approved",
        description: "The provider has been approved.",
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
    if (!selectedProvider) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("service_providers")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedProvider);

      if (error) throw error;

      toast({
        title: "Provider rejected",
        description: "The provider has been rejected.",
      });
      setRejectDialogOpen(false);
      setSelectedProvider(null);
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

  const getUserRole = (userId: string) => {
    const roles = userRoles.filter((r) => r.user_id === userId);
    if (roles.some((r) => r.role === "admin")) return "admin";
    if (roles.some((r) => r.role === "provider")) return "provider";
    return "user";
  };

  const roleColors = {
    admin: "bg-purple-500/10 text-purple-600 border-purple-200",
    provider: "bg-blue-500/10 text-blue-600 border-blue-200",
    user: "bg-gray-500/10 text-gray-600 border-gray-200",
  };

  if (authLoading || checkingAdmin) {
    return (
      <MobileLayout hideHeader>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MobileLayout hideHeader>
        <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center">
          <Shield className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the admin dashboard.
          </p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </MobileLayout>
    );
  }

  const pendingProviders = providers.filter((p) => p.status === "pending");
  const approvedProviders = providers.filter((p) => p.status === "approved");
  const rejectedProviders = providers.filter((p) => p.status === "rejected");

  const displayedProviders = activeTab === "pending" 
    ? pendingProviders 
    : activeTab === "approved" 
    ? approvedProviders 
    : rejectedProviders;

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

        {/* Header */}
        <div className="bg-gradient-to-b from-primary/20 to-background pt-12 pb-6 px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage providers & users</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-card rounded-xl p-3 border">
              <div className="flex items-center gap-2 text-yellow-600 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">Pending</span>
              </div>
              <p className="text-2xl font-bold">{pendingProviders.length}</p>
            </div>
            <div className="bg-card rounded-xl p-3 border">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium">Approved</span>
              </div>
              <p className="text-2xl font-bold">{approvedProviders.length}</p>
            </div>
            <div className="bg-card rounded-xl p-3 border">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Users</span>
              </div>
              <p className="text-2xl font-bold">{allUsers.length}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="sticky top-0 z-10 bg-background border-b overflow-x-auto">
          <div className="flex min-w-max">
            {([
              { id: "pending", label: `Pending (${pendingProviders.length})` },
              { id: "approved", label: `Approved (${approvedProviders.length})` },
              { id: "rejected", label: `Rejected (${rejectedProviders.length})` },
              { id: "users", label: `Users (${allUsers.length})` },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeAdminTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4 pb-24">
          {activeTab !== "users" ? (
            <div className="space-y-3">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="bg-card rounded-xl p-4 border">
                    <div className="flex gap-3">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </div>
                ))
              ) : displayedProviders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Layers className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">No {activeTab} providers</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === "pending" 
                      ? "No applications waiting for review" 
                      : `No ${activeTab} providers found`}
                  </p>
                </div>
              ) : (
                displayedProviders.map((provider, index) => (
                  <motion.div
                    key={provider.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-xl border overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                          {provider.category?.icon || "🙏"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-sm truncate">{provider.business_name}</h3>
                              {provider.is_premium && (
                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-white text-[10px] font-bold rounded">
                                  <Crown className="h-2.5 w-2.5" />
                                </span>
                              )}
                            </div>
                            <Badge className={`${statusColors[provider.status as keyof typeof statusColors]} text-xs flex-shrink-0`}>
                              {provider.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {provider.category?.name || "No category"} • {provider.city || "No location"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Applied {format(new Date(provider.submitted_at), "MMM d, yyyy")}
                          </p>
                          {provider.is_verified ? (
                            <div className="flex items-center gap-1 text-green-600 text-xs mt-1">
                              <BadgeCheck className="h-3 w-3" />
                              Verified
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-yellow-600 text-xs mt-1">
                              <BadgeX className="h-3 w-3" />
                              Not Verified
                            </div>
                          )}
                        </div>
                      </div>

                      {provider.description && (
                        <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                          {provider.description}
                        </p>
                      )}

                      {provider.status === "rejected" && provider.rejection_reason && (
                        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-xs text-red-600 dark:text-red-400">
                            <strong>Reason:</strong> {provider.rejection_reason}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {provider.status === "pending" && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            className="flex-1 h-9 gradient-gold text-primary-foreground"
                            onClick={() => handleApprove(provider.id)}
                            disabled={isProcessing}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-9 border-destructive/50 text-destructive"
                            onClick={() => {
                              setSelectedProvider(provider.id);
                              setRejectDialogOpen(true);
                            }}
                            disabled={isProcessing}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {loadingUsers ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="bg-card rounded-xl p-4 border">
                    <div className="flex gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                allUsers.map((userProfile, index) => {
                  const role = getUserRole(userProfile.user_id);
                  return (
                    <motion.div
                      key={userProfile.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-card rounded-xl border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                          {userProfile.full_name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm truncate">
                              {userProfile.full_name || "Unknown"}
                            </h3>
                            <Badge className={`${roleColors[role as keyof typeof roleColors]} text-[10px]`}>
                              {role}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {userProfile.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined {format(new Date(userProfile.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="max-w-[90vw] rounded-xl">
            <DialogHeader>
              <DialogTitle>Reject Provider</DialogTitle>
            </DialogHeader>
            <Textarea
              placeholder="Enter rejection reason (optional)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
            <DialogFooter className="flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setSelectedProvider(null);
                  setRejectionReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleReject}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
};

export default MobileAdminDashboard;