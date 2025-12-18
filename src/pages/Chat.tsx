import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MessageSquare, ArrowLeft, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChatWindow } from "@/components/ChatWindow";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const Chat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingIdFromUrl = searchParams.get("booking");
  const { user, loading } = useAuth();
  const [selectedBooking, setSelectedBooking] = useState<string | null>(
    bookingIdFromUrl
  );

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

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

  // Get accepted bookings for chat
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["chat-bookings", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get bookings where user is either customer or provider
      const { data: userBookings, error: userError } = await supabase
        .from("bookings")
        .select(`
          id,
          service_date,
          status,
          provider:service_providers!bookings_provider_id_fkey(
            id,
            business_name,
            user_id,
            profile:profiles!service_providers_user_id_fkey(full_name, profile_image)
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "accepted")
        .order("created_at", { ascending: false });

      if (userError) throw userError;

      // Get bookings where user is the provider
      const { data: providerProfile } = await supabase
        .from("service_providers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let providerBookings: any[] = [];
      if (providerProfile) {
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id,
            service_date,
            status,
            user_id,
            customer:profiles!bookings_user_id_fkey(full_name, profile_image)
          `)
          .eq("provider_id", providerProfile.id)
          .eq("status", "accepted")
          .order("created_at", { ascending: false });

        if (!error && data) {
          providerBookings = data.map((b) => ({
            ...b,
            isProvider: true,
            otherUser: b.customer,
          }));
        }
      }

      // Combine and format
      const formattedUserBookings = (userBookings || []).map((b: any) => ({
        ...b,
        isProvider: false,
        otherUser: {
          full_name: b.provider?.business_name,
          profile_image: (b.provider?.profile as any)?.profile_image,
        },
      }));

      return [...formattedUserBookings, ...providerBookings];
    },
    enabled: !!user,
  });

  const selectedBookingData = bookings.find((b: any) => b.id === selectedBooking);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-12 px-4">
          <div className="container max-w-6xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/4" />
              <div className="grid md:grid-cols-3 gap-6 h-[500px]">
                <div className="bg-muted rounded-xl" />
                <div className="md:col-span-2 bg-muted rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-full bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">Messages</h1>
                <p className="text-muted-foreground">
                  Chat with your service providers and customers
                </p>
              </div>
            </div>

            {bookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-xl font-semibold mb-2">
                    No active chats
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Chat is enabled after a booking is accepted
                  </p>
                  <Button onClick={() => navigate("/providers")}>
                    Browse Providers
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-3 gap-6 h-[600px]">
                {/* Conversations list */}
                <Card className="overflow-hidden">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">Conversations</h3>
                  </div>
                  <div className="divide-y overflow-auto h-[calc(100%-60px)]">
                    {bookings.map((booking: any) => (
                      <div
                        key={booking.id}
                        onClick={() => setSelectedBooking(booking.id)}
                        className={cn(
                          "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                          selectedBooking === booking.id && "bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={booking.otherUser?.profile_image} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {booking.otherUser?.full_name || "User"}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(booking.service_date), "MMM d, yyyy")}
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {booking.isProvider ? "Customer" : "Provider"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Chat window */}
                <div className="md:col-span-2">
                  {selectedBooking && selectedBookingData ? (
                    <ChatWindow
                      bookingId={selectedBooking}
                      otherUserName={
                        selectedBookingData.otherUser?.full_name || "User"
                      }
                      otherUserAvatar={
                        selectedBookingData.otherUser?.profile_image
                      }
                    />
                  ) : (
                    <Card className="h-full flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select a conversation to start chatting</p>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Chat;
