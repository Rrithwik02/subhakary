import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, AlertCircle, Heart } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InvitationRecord {
  id: string;
  wedding_id: string;
  invite_code: string;
  role: string;
  permission_level: string;
  expires_at: string | null;
  is_used: boolean;
  wedding: {
    title: string;
  };
}

const WeddingJoin = () => {
  const { inviteCode } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user && inviteCode) {
      // Save invite code for redirection after login
      localStorage.setItem("pending_invite_code", inviteCode);
      toast({
        title: "Login Required",
        description: "Please log in or sign up first to accept this planning invitation.",
      });
      navigate("/auth");
    }
  }, [authLoading, user, inviteCode, navigate, toast]);

  const { data: invitation, isLoading: inviteLoading, error } = useQuery({
    queryKey: ["wedding-invitation", inviteCode],
    queryFn: async () => {
      if (!inviteCode) throw new Error("No invite code provided");
      
      const { data, error } = await supabase
        .from("wedding_invitations")
        .select(`
          id,
          wedding_id,
          invite_code,
          role,
          permission_level,
          expires_at,
          is_used,
          wedding:weddings(title)
        `)
        .eq("invite_code", inviteCode)
        .single();

      if (error) throw error;
      
      const record = data as unknown as InvitationRecord;
      
      if (record.is_used) {
        throw new Error("This invitation link has already been used.");
      }
      
      if (record.expires_at && new Date(record.expires_at) < new Date()) {
        throw new Error("This invitation link has expired.");
      }
      
      return record;
    },
    enabled: !!inviteCode && !!user,
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!user || !invitation) return;

      // 1. Add to wedding_members
      const { error: memberError } = await supabase
        .from("wedding_members" as any)
        .insert({
          wedding_id: invitation.wedding_id,
          user_id: user.id,
          display_name: user.email?.split("@")[0] || "Collaborator",
          email: user.email,
          role: invitation.role,
          permission_level: invitation.permission_level,
          status: "active",
        } as any);

      if (memberError) {
        // If unique constraint fails, they might already be a member
        if (memberError.code === "23505") {
          throw new Error("You are already a member of this planning workspace.");
        }
        throw memberError;
      }

      // 2. Mark invite as used
      const { error: inviteError } = await supabase
        .from("wedding_invitations")
        .update({ is_used: true })
        .eq("id", invitation.id);

      if (inviteError) throw inviteError;
    },
    onSuccess: () => {
      toast({
        title: "Successfully joined!",
        description: `Welcome to ${invitation?.wedding?.title}!`,
      });
      navigate(`/event/${invitation?.wedding_id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to join",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (authLoading || inviteLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <Navbar />

      <section className="pt-32 pb-16 px-4 flex items-center justify-center flex-grow">
        <div className="container max-w-md mx-auto">
          {error || !invitation ? (
            <Card className="border-destructive/20 shadow-lg">
              <CardHeader className="text-center">
                <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <CardTitle className="font-display text-2xl font-semibold text-destructive">
                  Invalid Invitation
                </CardTitle>
                <CardDescription className="mt-2 text-base">
                  {error instanceof Error ? error.message : "This invitation is invalid or does not exist."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button variant="outline" className="rounded-full" onClick={() => navigate("/")}>
                  Back to Homepage
                </Button>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-border shadow-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-1.5 gradient-gold" />
                
                <CardHeader className="text-center pt-8">
                  <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-8 w-8 fill-primary/10" />
                  </div>
                  <CardTitle className="font-display text-2xl md:text-3xl font-semibold">
                  Planning Invitation
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    You have been invited to join and collaborate!
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 px-6 pb-8">
                  <div className="rounded-2xl border bg-muted/40 p-5 text-center space-y-3">
                    <h3 className="font-display text-xl font-medium text-foreground">
                      {invitation.wedding.title}
                    </h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Badge variant="gold" className="capitalize">
                        Role: {invitation.role}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        Perms: {invitation.permission_level}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    variant="gold"
                    className="w-full rounded-full h-11 text-base font-medium shadow-md hover:shadow-lg transition-all"
                    onClick={() => acceptMutation.mutate()}
                    disabled={acceptMutation.isPending}
                  >
                    {acceptMutation.isPending ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-b-2 border-brown-dark" />
                    ) : (
                      <>
                        Accept & Join Workspace
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WeddingJoin;
