import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Search, Calendar, MessageSquare, User, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  requiresAuth?: boolean;
  providerOnly?: boolean;
}

export const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Check if user is an approved provider
  const { data: isApprovedProvider } = useQuery({
    queryKey: ["is-approved-provider-mobile", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from("service_providers")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id,
  });

  const navItems: NavItem[] = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Discover", path: "/providers" },
    { icon: Calendar, label: "Bookings", path: "/my-bookings", requiresAuth: true },
    { icon: MessageSquare, label: "Messages", path: "/chat", requiresAuth: true },
    ...(isApprovedProvider 
      ? [{ icon: LayoutDashboard, label: "Dashboard", path: "/provider-dashboard", requiresAuth: true, providerOnly: true }]
      : [{ icon: User, label: "Profile", path: user ? "/profile" : "/auth", requiresAuth: false }]
    ),
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-area-inset-bottom md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          // Skip auth-required items for non-logged users
          if (item.requiresAuth && !user && item.path !== "/auth") {
            return (
              <Link
                key={item.path}
                to="/auth"
                className="flex flex-col items-center justify-center flex-1 h-full touch-active"
              >
                <div className="relative flex flex-col items-center">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[10px] mt-1 text-muted-foreground font-medium">
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full touch-active"
            >
              <div className="relative flex flex-col items-center">
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-primary/10 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon 
                  className={`w-5 h-5 relative z-10 transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`} 
                />
                <span 
                  className={`text-[10px] mt-1 relative z-10 font-medium transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
