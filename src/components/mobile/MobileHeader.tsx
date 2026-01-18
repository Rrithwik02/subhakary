import { useNavigate } from "react-router-dom";
import { ChevronLeft, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ReactNode, useEffect, useState } from "react";
import logo from "@/assets/logo.png";

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showNotifications?: boolean;
  rightAction?: ReactNode;
}

export const MobileHeader = ({
  title,
  showBackButton = false,
  showNotifications = true,
  rightAction,
}: MobileHeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch user profile
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile-mobile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, id")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch unread notifications
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!userProfile?.id) {
        setUnreadCount(0);
        return;
      }

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userProfile.id)
        .eq("read", false);

      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    if (userProfile?.id) {
      const channel = supabase
        .channel("mobile-notifications-count")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
          },
          () => fetchUnreadCount()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userProfile?.id]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-area-inset-top">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left section */}
        <div className="flex items-center gap-3">
          {showBackButton ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 -ml-2"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : user ? (
            <div className="flex items-center gap-3" onClick={() => navigate("/profile")}>
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={userProfile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {userProfile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">{getGreeting()},</span>
                <span className="text-sm font-semibold text-foreground line-clamp-1">
                  {userProfile?.full_name?.split(" ")[0] || "User"}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <img src={logo} alt="Subhakary" className="h-8 w-auto" />
            </div>
          )}
        </div>

        {/* Center section - Title */}
        {title && (
          <h1 className="font-display text-lg font-semibold text-foreground absolute left-1/2 -translate-x-1/2">
            {title}
          </h1>
        )}

        {/* Right section */}
        <div className="flex items-center gap-2">
          {rightAction}
          {showNotifications && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 relative"
              onClick={() => navigate("/notifications")}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                  variant="destructive"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
