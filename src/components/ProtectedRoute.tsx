import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole?: "customer" | "provider";
}

export const ProtectedRoute = ({ children, allowedRole }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [isProvider, setIsProvider] = useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setIsProvider(false);
        setCheckingRole(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("service_providers")
          .select("id, status")
          .eq("user_id", user.id)
          .eq("status", "approved")
          .maybeSingle();
        setIsProvider(!!data);
      } catch (e) {
        setIsProvider(false);
      } finally {
        setCheckingRole(false);
      }
    };
    checkRole();
  }, [user]);

  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    const searchParams = new URLSearchParams();
    searchParams.set("redirect", location.pathname + location.search);
    return <Navigate to={`/auth?${searchParams.toString()}`} replace />;
  }

  if (allowedRole === "provider" && !isProvider) {
    return <Navigate to="/providers" replace />;
  }

  if (allowedRole === "customer" && isProvider) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
