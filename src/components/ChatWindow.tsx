import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Send, ArrowLeft, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  bookingId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  onClose?: () => void;
}

export const ChatWindow = ({
  bookingId,
  otherUserName,
  otherUserAvatar,
  onClose,
}: ChatWindowProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get current user's profile id
  const { data: currentProfile } = useQuery({
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

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat-messages", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(`
          id,
          message,
          sender_id,
          created_at,
          read,
          sender:profiles!chat_messages_sender_id_fkey(full_name, profile_image)
        `)
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!bookingId,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `booking_id=eq.${bookingId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat-messages", bookingId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (!currentProfile || messages.length === 0) return;

    const unreadMessages = messages.filter(
      (m: any) => !m.read && m.sender_id !== currentProfile.id
    );

    if (unreadMessages.length > 0) {
      const ids = unreadMessages.map((m: any) => m.id);
      supabase
        .from("chat_messages")
        .update({ read: true })
        .in("id", ids)
        .then();
    }
  }, [messages, currentProfile]);

  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      if (!currentProfile || !text.trim()) return;

      // Get the other participant's profile id from the booking
      const { data: booking } = await supabase
        .from("bookings")
        .select(`
          user_id,
          provider:service_providers!bookings_provider_id_fkey(
            user_id,
            profile:profiles!service_providers_user_id_fkey(id)
          )
        `)
        .eq("id", bookingId)
        .single();

      if (!booking) throw new Error("Booking not found");

      // Determine receiver based on who is sending
      let receiverId: string;
      if (user?.id === booking.user_id) {
        // Current user is the customer, receiver is provider
        const providerProfile = (booking.provider as any)?.profile;
        receiverId = providerProfile?.id;
      } else {
        // Current user is the provider, get customer profile
        const { data: customerProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", booking.user_id)
          .single();
        receiverId = customerProfile?.id;
      }

      const { error } = await supabase.from("chat_messages").insert({
        booking_id: bookingId,
        sender_id: currentProfile.id,
        receiver_id: receiverId,
        message: text.trim(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["chat-messages", bookingId] });
    },
  });

  const handleSend = () => {
    if (message.trim()) {
      sendMessage.mutate(message);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUserAvatar} />
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-display font-semibold">{otherUserName}</h3>
          <p className="text-xs text-muted-foreground">Chat</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-12 bg-muted rounded-xl w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((msg: any) => {
                const isOwn = msg.sender_id === currentProfile?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex gap-2", isOwn && "flex-row-reverse")}
                  >
                    {!isOwn && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={msg.sender?.profile_image} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2",
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          isOwn
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {format(new Date(msg.created_at), "h:mm a")}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-card">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sendMessage.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
            className="gradient-gold"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
