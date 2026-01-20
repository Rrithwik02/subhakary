import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Heart, Plus, MessageSquare, User, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHaptics } from "@/hooks/useHaptics";

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
  const { lightImpact } = useHaptics();

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
    { icon: Heart, label: "Favorites", path: "/favorites", requiresAuth: true },
    { icon: Plus, label: "New Booking", path: "/providers", requiresAuth: false },
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

  const handleNavClick = () => {
    lightImpact();
  };

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden safe-area-inset-bottom">
      <div className="bg-brown/95 backdrop-blur-xl rounded-full shadow-lg mx-auto max-w-sm">
        <div className="flex items-center justify-around h-14 px-3">
          {navItems.map((item, index) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            const isCenter = index === 2; // Center item (New Booking)

            // Skip auth-required items for non-logged users
            if (item.requiresAuth && !user && item.path !== "/auth") {
              return (
                <Link
                  key={item.path}
                  to="/auth"
                  onClick={handleNavClick}
                  className="flex flex-col items-center justify-center flex-1 h-full touch-active"
                >
                  <div className="relative flex flex-col items-center">
                    <Icon className="w-5 h-5 text-white/60" />
                    <span className="text-[9px] mt-0.5 text-white/60 font-medium">
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            }

            // Center button with golden highlight
            if (isCenter) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className="flex flex-col items-center justify-center flex-1 h-full touch-active -mt-4"
                >
                  <motion.div
                    className="relative flex items-center justify-center"
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center shadow-lg border-4 border-brown">
                      <Icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                  </motion.div>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className="flex flex-col items-center justify-center flex-1 h-full touch-active"
              >
                <div className="relative flex flex-col items-center">
                  {active && (
                    <motion.div
                      layoutId="activeTabMobile"
                      className="absolute -inset-1.5 bg-white/10 rounded-lg"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon 
                    className={`w-5 h-5 relative z-10 transition-colors ${
                      active ? "text-primary" : "text-white/70"
                    }`} 
                  />
                  <span 
                    className={`text-[9px] mt-0.5 relative z-10 font-medium transition-colors ${
                      active ? "text-primary" : "text-white/60"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
