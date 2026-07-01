import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, LogOut, User, Heart, MessageSquare, Shield, LayoutDashboard, Sparkles, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo-brown.png";
export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (error) return false;
      return data === true;
    },
    enabled: !!user?.id,
    staleTime: 0,
  });

  // Check if user is an approved provider
  const { data: isApprovedProvider } = useQuery({
    queryKey: ["is-approved-provider", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from("service_providers")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .maybeSingle();
      if (error) {
        console.error("Provider check error:", error);
        return false;
      }
      return !!data;
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Dynamically build nav links based on role
  const getNavLinks = () => {
    if (!user) {
      return [
        { name: "Home", href: "/" },
        { name: "Planning OS", href: "/planning-os" },
        { name: "Services", href: "/services" },
        { name: "About Us", href: "/about" },
        { name: "Blog", href: "/blog" },
        { name: "Contact", href: "/contact" }
      ];
    }

    if (isApprovedProvider) {
      return [
        { name: "Dashboard", href: "/dashboard" },
        { name: "Notifications", href: "/notifications" },
        { name: "Profile", href: "/profile" }
      ];
    }

    // Customer
    return [
      { name: "Find Providers", href: "/providers" },
      { name: "Plan Wedding", href: "/plan-wedding" },
      { name: "My Bookings", href: "/my-bookings" },
      { name: "Wishlist", href: "/favorites" },
      { name: "Notifications", href: "/notifications" },
      { name: "Profile", href: "/profile" }
    ];
  };

  const activeLinks = getNavLinks();

  // Fetch user profile for avatar
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user?.id) {
        setUnreadCount(0);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.id) {
        setUnreadCount(0);
        return;
      }

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("read", false);

      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    if (user?.id) {
      const channel = supabase
        .channel("navbar-notifications-count")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  return <motion.nav initial={{
    y: -100,
    opacity: 0
  }} animate={{
    y: 0,
    opacity: 1
  }} transition={{
    duration: 0.6
  }} 
  className="fixed left-0 right-0 z-50 flex justify-center px-4"
  style={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
  >
      {/* Gold Pill Container */}
      <div className="glass-nav rounded-full px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4 max-w-7xl w-full">
        {/* Left Side: Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img src={logo} alt="Subhakary" className="h-10 w-auto" />
        </Link>

        {/* Center: Desktop Navigation Links (Centered) */}
        <div className="hidden xl:flex items-center justify-center gap-4 xl:gap-6 flex-grow">
          {activeLinks.map(link => (
            <Link 
              key={link.name} 
              to={link.href} 
              className="font-medium hover:text-brown transition-colors duration-200 whitespace-nowrap text-xs xl:text-sm"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right Side: Desktop User Actions inside the Gold Pill */}
        <div className="hidden xl:flex items-center gap-3 xl:gap-4 flex-shrink-0">
          {user ? <>
              <div className="flex items-center gap-1.5 xl:gap-2">
                <Link to="/notifications" className="relative">
                  <Button variant="ghost" size="icon" title="Notifications" className="h-9 w-9">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                        variant="destructive"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link to="/chat">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/favorites">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Heart className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" size="sm" className="font-medium gap-1.5 h-9">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={userProfile?.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px] bg-primary/10">
                        {userProfile?.full_name?.charAt(0)?.toUpperCase() || <User className="h-2.5 w-2.5" />}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs xl:text-sm">Profile</span>
                  </Button>
                </Link>
              </div>

              {/* Action buttons inside the gold pill */}
              <div className="flex items-center gap-2 border-l border-brown/20 pl-3 xl:pl-4">
                {isApprovedProvider ? (
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm" className="font-medium text-foreground hover:text-primary gap-1.5 h-9 text-xs xl:text-sm">
                      <LayoutDashboard className="w-4 h-4" />
                      My Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/become-provider">
                    <Button variant="ghost" size="sm" className="font-medium text-foreground hover:text-primary h-9 text-xs xl:text-sm">
                      Become a Provider
                    </Button>
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm" className="font-medium text-foreground hover:text-primary gap-1.5 h-9 text-xs xl:text-sm">
                      <Shield className="w-4 h-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" className="font-medium text-foreground hover:text-primary gap-1.5 h-9 text-xs xl:text-sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </> : <>
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="font-medium text-xs xl:text-sm h-9">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="gold" size="sm" className="font-medium rounded-full px-4 text-xs xl:text-sm h-9">
                  Join Us
                </Button>
              </Link>
            </>}
        </div>

        {/* Mobile Menu Button */}
        <button onClick={() => setIsOpen(!isOpen)} className="xl:hidden p-2 text-foreground">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: -20
      }} transition={{
        duration: 0.2
      }} className="xl:hidden absolute top-full left-0 right-0 mt-2 mx-4 glass-nav rounded-2xl p-4 shadow-lg">
            <div className="flex flex-col gap-4">
              {activeLinks.map(link => (
                <Link 
                  key={link.name} 
                  to={link.href} 
                  className="text-sm font-medium hover:text-brown transition-colors py-2" 
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col gap-3 pt-2 border-t border-border">
                {user ? <>
                    <div className="flex items-center gap-2 pb-2">
                      <Link to="/notifications" onClick={() => setIsOpen(false)} className="relative">
                        <Button variant="ghost" size="icon" title="Notifications">
                          <Bell className="h-5 w-5" />
                          {unreadCount > 0 && (
                            <Badge 
                              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                              variant="destructive"
                            >
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </Badge>
                          )}
                        </Button>
                      </Link>
                      <Link to="/chat" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" size="icon">
                          <MessageSquare className="h-5 w-5" />
                        </Button>
                      </Link>
                      <Link to="/favorites" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" size="icon">
                          <Heart className="h-5 w-5" />
                        </Button>
                      </Link>
                    </div>
                    <Link to="/profile" className="w-full" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={userProfile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10">
                            {userProfile?.full_name?.charAt(0)?.toUpperCase() || <User className="h-3 w-3" />}
                          </AvatarFallback>
                        </Avatar>
                        My Profile
                      </Button>
                    </Link>

                    {isApprovedProvider ? (
                      <Link to="/dashboard" className="w-full" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50">
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          My Dashboard
                        </Button>
                      </Link>
                    ) : (
                      <Link to="/become-provider" className="w-full" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          Become Provider
                        </Button>
                      </Link>
                    )}
                    {isAdmin && (
                      <Link to="/admin" className="w-full" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start text-primary">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </Button>
                      </Link>
                    )}
                    <Button variant="gold" size="sm" className="w-full" onClick={() => {
                handleSignOut();
                setIsOpen(false);
              }}>
                      Sign Out
                    </Button>
                  </> : <>
                    <Link to="/auth" className="flex-1" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/auth" className="flex-1" onClick={() => setIsOpen(false)}>
                      <Button variant="gold" size="sm" className="w-full">
                        Join Us
                      </Button>
                    </Link>
                  </>}
              </div>
            </div>
          </motion.div>}
      </AnimatePresence>
    </motion.nav>;
};
