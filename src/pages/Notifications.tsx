import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { Bell, Calendar, MessageSquare, Star, CreditCard, User, CheckCheck, ArrowLeft, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const notificationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  booking: Calendar,
  message: MessageSquare,
  review: Star,
  payment: CreditCard,
  system: Bell,
  dispute: AlertTriangle,
};

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get user's profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Fetch all notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["all-notifications"],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile,
  });

  // Real-time subscription
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel("notifications-page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["all-notifications"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, queryClient]);

  // Mark single notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", profile.id)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Please sign in</h1>
          <p className="text-muted-foreground mb-6">You need to be signed in to view notifications.</p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-display font-bold">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="bg-card rounded-xl border shadow-sm">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2">No notifications</h3>
                <p className="text-muted-foreground text-sm">
                  You're all caught up! New notifications will appear here.
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[70vh]">
                <AnimatePresence>
                  {notifications.map((notification: any, index: number) => {
                    const IconComponent = notificationIcons[notification.type] || Bell;
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "flex gap-4 p-4 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-muted/50",
                          !notification.read && "bg-primary/5"
                        )}
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead.mutate(notification.id);
                          }
                        }}
                      >
                        <div
                          className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                            notification.read
                              ? "bg-muted text-muted-foreground"
                              : "bg-primary/10 text-primary"
                          )}
                        >
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className={cn(
                                "font-medium text-sm",
                                !notification.read && "font-semibold"
                              )}
                            >
                              {notification.title}
                            </h4>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-2">
                            {format(new Date(notification.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </ScrollArea>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Notifications;
