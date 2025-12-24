import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Send, ArrowLeft, User, Check, CheckCheck, Clock } from "lucide-react";
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
  isCompleted?: boolean;
}

interface PendingMessage {
  id: string;
  message: string;
  status: 'sending' | 'sent' | 'failed';
}

export const ChatWindow = ({
  bookingId,
  otherUserName,
  otherUserAvatar,
  onClose,
  isCompleted = false,
}: ChatWindowProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const MAX_MESSAGE_LENGTH = 5000;

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
          delivery_status,
          sender:profiles!chat_messages_sender_id_fkey(full_name, profile_image)
        `)
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!bookingId,
  });

  // Real-time subscription for new messages and updates
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          // Remove from pending if this is our sent message
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as any;
            setPendingMessages(prev => 
              prev.filter(p => p.message !== newMsg.message)
            );
          }
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
  }, [messages, pendingMessages]);

  // Mark messages as read and update delivery status
  useEffect(() => {
    if (!currentProfile || messages.length === 0) return;

    const unreadMessages = messages.filter(
      (m: any) => !m.read && m.sender_id !== currentProfile.id
    );

    if (unreadMessages.length > 0) {
      const ids = unreadMessages.map((m: any) => m.id);
      supabase
        .from("chat_messages")
        .update({ read: true, delivery_status: 'read' })
        .in("id", ids)
        .then();
    }
  }, [messages, currentProfile]);

  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      const trimmedMessage = text.trim();
      if (!currentProfile || !trimmedMessage) return;
      
      // Validate message length (server-side constraint is 5000 chars)
      if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
        throw new Error(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`);
      }

      const tempId = `pending-${Date.now()}`;
      
      // Add to pending messages immediately
      setPendingMessages(prev => [...prev, {
        id: tempId,
        message: trimmedMessage,
        status: 'sending'
      }]);

      // Get the booking details
      const { data: booking } = await supabase
        .from("bookings")
        .select(`
          user_id,
          provider:service_providers!bookings_provider_id_fkey(
            user_id
          )
        `)
        .eq("id", bookingId)
        .single();

      if (!booking) {
        setPendingMessages(prev => 
          prev.map(p => p.id === tempId ? { ...p, status: 'failed' } : p)
        );
        throw new Error("Booking not found");
      }

      // Determine receiver based on who is sending
      let receiverId: string | null = null;
      const providerUserId = (booking.provider as any)?.user_id;
      
      if (user?.id === booking.user_id) {
        // Current user is the customer, receiver is provider
        if (providerUserId) {
          const { data: providerProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", providerUserId)
            .maybeSingle();
          receiverId = providerProfile?.id || null;
        }
      } else if (user?.id === providerUserId) {
        // Current user is the provider, get customer profile
        if (booking.user_id) {
          const { data: customerProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", booking.user_id)
            .maybeSingle();
          receiverId = customerProfile?.id || null;
        }
      }

      if (!receiverId) {
        setPendingMessages(prev => 
          prev.map(p => p.id === tempId ? { ...p, status: 'failed' } : p)
        );
        throw new Error("Could not find receiver");
      }

      const { error } = await supabase.from("chat_messages").insert({
        booking_id: bookingId,
        sender_id: currentProfile.id,
        receiver_id: receiverId,
        message: text.trim(),
        delivery_status: 'sent',
      });

      if (error) {
        setPendingMessages(prev => 
          prev.map(p => p.id === tempId ? { ...p, status: 'failed' } : p)
        );
        throw error;
      }

      // Update to sent status (will be removed when real message arrives via subscription)
      setPendingMessages(prev => 
        prev.map(p => p.id === tempId ? { ...p, status: 'sent' } : p)
      );
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

  // Get delivery status icon for own messages
  const getDeliveryStatusIcon = (msg: any) => {
    if (msg.read) {
      return <CheckCheck className="h-3 w-3 text-blue-400" />;
    }
    if (msg.delivery_status === 'delivered') {
      return <CheckCheck className="h-3 w-3 text-primary-foreground/70" />;
    }
    return <Check className="h-3 w-3 text-primary-foreground/70" />;
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
        ) : messages.length === 0 && pendingMessages.length === 0 ? (
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
                      <div
                        className={cn(
                          "flex items-center gap-1 mt-1",
                          isOwn ? "justify-end" : "justify-start"
                        )}
                      >
                        <span
                          className={cn(
                            "text-xs",
                            isOwn
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          )}
                        >
                          {format(new Date(msg.created_at), "h:mm a")}
                        </span>
                        {isOwn && getDeliveryStatusIcon(msg)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Pending messages (optimistic UI) */}
              {pendingMessages.map((pending) => (
                <motion.div
                  key={pending.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 flex-row-reverse"
                >
                  <div
                    className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-2 rounded-br-sm",
                      pending.status === 'failed' 
                        ? "bg-destructive/80 text-destructive-foreground" 
                        : "bg-primary/80 text-primary-foreground"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{pending.message}</p>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <span className="text-xs text-primary-foreground/70">
                        {pending.status === 'sending' ? 'Sending...' : 
                         pending.status === 'failed' ? 'Failed' : 'Sent'}
                      </span>
                      {pending.status === 'sending' && (
                        <Clock className="h-3 w-3 text-primary-foreground/70 animate-pulse" />
                      )}
                      {pending.status === 'sent' && (
                        <Check className="h-3 w-3 text-primary-foreground/70" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-card">
        {isCompleted ? (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              This booking has been completed. Messaging is disabled.
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
              maxLength={MAX_MESSAGE_LENGTH}
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
        )}
      </div>
    </div>
  );
};
