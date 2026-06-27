import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  MessageSquare,
  ArrowLeft,
  User,
  Calendar,
  Send,
  Loader2,
  Check,
  CheckCheck,
} from "lucide-react";
import { MobileLayout } from "./MobileLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MobileChat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingIdFromUrl = searchParams.get("booking");
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = useState<string | null>(bookingIdFromUrl);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!userProfile) return [];

      const { data: userBookings } = await supabase
        .from("bookings")
        .select(`
          id,
          service_date,
          status,
          provider:service_providers!bookings_provider_id_fkey(
            id,
            business_name,
            user_id,
            logo_url
          )
        `)
        .eq("user_id", user.id)
        .in("status", ["accepted", "completed"])
        .order("created_at", { ascending: false });

      const { data: providerProfile } = await supabase
        .from("service_providers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let providerBookings: any[] = [];
      if (providerProfile) {
        const { data } = await supabase
          .from("bookings")
          .select(`id, service_date, status, user_id`)
          .eq("provider_id", providerProfile.id)
          .in("status", ["accepted", "completed"])
          .order("created_at", { ascending: false });

        if (data) {
          // Use SECURITY DEFINER function to get customer info
          const bookingIds = data.map(b => b.id);
          const { data: customerInfo } = await supabase
            .rpc('get_booking_customer_chat_info', { booking_ids: bookingIds });

          const profileMap = new Map(customerInfo?.map((p: any) => [p.customer_user_id, {
            user_id: p.customer_user_id,
            full_name: p.customer_name,
            profile_image: p.customer_profile_image
          }]) || []);

          providerBookings = data.map((b) => ({
            ...b,
            isProvider: true,
            otherUser: {
              full_name: profileMap.get(b.user_id)?.full_name || "Customer",
              profile_image: profileMap.get(b.user_id)?.profile_image,
            },
          }));
        }
      }

      const formattedUserBookings = (userBookings || []).map((b: any) => ({
        ...b,
        isProvider: false,
        otherUser: {
          full_name: b.provider?.business_name,
          profile_image: b.provider?.logo_url,
        },
      }));

      return [...formattedUserBookings, ...providerBookings];
    },
    enabled: !!user,
  });

  // Get messages for selected booking
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["chat-messages", selectedBooking],
    queryFn: async () => {
      if (!selectedBooking) return [];
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("booking_id", selectedBooking)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedBooking,
    refetchInterval: 3000,
  });

  // Subscribe to new messages
  useEffect(() => {
    if (!selectedBooking) return;

    const channel = supabase
      .channel(`chat-${selectedBooking}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `booking_id=eq.${selectedBooking}`,
        },
        () => {
          refetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedBooking, refetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedBookingData = bookings.find((b: any) => b.id === selectedBooking);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedBooking || !profile) return;

    setIsSending(true);
    try {
      // Use the secure RPC function to get participant profile IDs
      const { data: participantData, error: rpcError } = await supabase
        .rpc('get_booking_participant_profile_ids', { p_booking_id: selectedBooking });

      if (rpcError || !participantData || participantData.length === 0) {
        console.error("Failed to get participant IDs:", rpcError);
        toast({
          title: "Cannot send message",
          description: "Could not verify booking participants. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const participantIds = participantData[0];
      
      // Determine sender and receiver based on current user's profile
      const senderId = profile.id;
      const receiverId = senderId === participantIds.customer_profile_id
        ? participantIds.provider_profile_id
        : participantIds.customer_profile_id;

      if (!receiverId) {
        toast({
          title: "Cannot send message",
          description: "Recipient not found for this booking.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("chat_messages").insert({
        booking_id: selectedBooking,
        sender_id: senderId,
        receiver_id: receiverId,
        message: newMessage.trim(),
        delivery_status: 'sent',
      });

      if (error) {
        console.error("Failed to insert message:", error);
        toast({
          title: "Failed to send message",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
        return;
      }

      setNewMessage("");
      refetchMessages();
    } catch (error: any) {
      console.error("Failed to send message:", error);
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (loading || isLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  // If no booking selected, show conversation list
  if (!selectedBooking) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-background pb-20">
          <div className="px-4 pt-4">
            <h1 className="text-2xl font-bold mb-1">Messages</h1>
            <p className="text-sm text-muted-foreground mb-4">
              Chat with service providers
            </p>

            {bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No conversations</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Chat is enabled after a booking is accepted
                </p>
                <Button onClick={() => navigate("/providers")}>
                  Browse Providers
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {bookings.map((booking: any) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-xl border p-4 active:scale-[0.98] transition-transform"
                    onClick={() => setSelectedBooking(booking.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={booking.otherUser?.profile_image} />
                        <AvatarFallback className="bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
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
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {booking.isProvider ? "Customer" : "Provider"}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </MobileLayout>
    );
  }

  // Chat view
  return (
    <MobileLayout hideNav>
      <div className="flex flex-col h-screen bg-background">
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setSelectedBooking(null)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={selectedBookingData?.otherUser?.profile_image} />
            <AvatarFallback className="bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">
              {selectedBookingData?.otherUser?.full_name || "User"}
            </p>
            <p className="text-xs text-muted-foreground">
              {selectedBookingData?.status === "completed" ? "Completed" : "Active booking"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">
                Start the conversation
              </p>
            </div>
          ) : (
            messages.map((msg: any) => {
              const isOwn = msg.sender_id === profile?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5",
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    )}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <div className={cn(
                      "flex items-center gap-1 mt-1",
                      isOwn ? "justify-end" : "justify-start"
                    )}>
                      <span className={cn(
                        "text-xs",
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {format(new Date(msg.created_at), "h:mm a")}
                      </span>
                      {isOwn && (
                        msg.read ? (
                          <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                        ) : (
                          <Check className="h-3 w-3 text-primary-foreground/70" />
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t p-4 bg-background safe-area-bottom">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-11 rounded-full"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              size="icon"
              className="h-11 w-11 rounded-full gradient-gold"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileChat;
