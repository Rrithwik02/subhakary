import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { InquiryChatWindow } from "@/components/InquiryChatWindow";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const InquiryChat = () => {
  const { providerId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [conversationId, setConversationId] = useState<string | null>(
    searchParams.get("conversation")
  );

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to chat with providers",
        variant: "destructive",
      });
      navigate(`/auth?redirect=/inquiry/${providerId}`);
    }
  }, [user, authLoading, navigate, providerId, toast]);

  // Fetch provider details
  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: ["provider-for-chat", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_providers")
        .select("id, business_name, logo_url, user_id")
        .eq("id", providerId)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!providerId && !!user,
  });

  // Fetch or create conversation
  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ["inquiry-conversation", providerId, user?.id],
    queryFn: async () => {
      if (!user || !providerId) return null;

      // First try to find existing conversation
      const { data: existing } = await supabase
        .from("inquiry_conversations")
        .select("*")
        .eq("user_id", user.id)
        .eq("provider_id", providerId)
        .maybeSingle();

      if (existing) {
        setConversationId(existing.id);
        return existing;
      }

      // Create new conversation
      const { data: newConvo, error } = await supabase
        .from("inquiry_conversations")
        .insert({
          user_id: user.id,
          provider_id: providerId,
        })
        .select()
        .single();

      if (error) throw error;
      setConversationId(newConvo.id);
      return newConvo;
    },
    enabled: !!user && !!providerId,
  });

  if (authLoading || providerLoading || conversationLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-12 px-4">
          <div className="container max-w-3xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/4 mb-4" />
              <div className="h-[60vh] bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-12 px-4">
          <div className="container max-w-3xl mx-auto text-center">
            <h1 className="font-display text-2xl font-bold mb-4">Provider not found</h1>
            <p className="text-muted-foreground mb-6">
              This provider may no longer be available.
            </p>
            <Button onClick={() => navigate("/providers")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Providers
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <section className="flex-1 pt-24 pb-6 px-4">
        <div className="container max-w-3xl mx-auto h-full">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate(`/providers/${providerId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>

          <div className="h-[calc(100vh-220px)] min-h-[500px]">
            {conversationId && (
              <InquiryChatWindow
                conversationId={conversationId}
                providerId={provider.id}
                providerName={provider.business_name}
                providerAvatar={provider.logo_url || undefined}
                onBookingCreated={() => {
                  toast({
                    title: "Booking created!",
                    description: "You can track your booking in My Bookings.",
                  });
                }}
              />
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default InquiryChat;
