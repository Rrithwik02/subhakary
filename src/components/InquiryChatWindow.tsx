import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Send, ArrowLeft, User, Calendar, MessageSquare, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useChatPresence } from "@/hooks/useChatPresence";
import { cn } from "@/lib/utils";

interface InquiryChatWindowProps {
  conversationId: string;
  providerId: string;
  providerName: string;
  providerAvatar?: string;
  onClose?: () => void;
  onBookingCreated?: () => void;
}

export const InquiryChatWindow = ({
  conversationId,
  providerId,
  providerName,
  providerAvatar,
  onClose,
  onBookingCreated,
}: InquiryChatWindowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Presence tracking for typing indicators and online status
  const { otherUserPresence, handleTypingStart } = useChatPresence({
    conversationId,
    userId: user?.id,
  });

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["inquiry-messages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiry_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!conversationId,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`inquiry-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "inquiry_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["inquiry-messages", conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (!user || messages.length === 0) return;

    const unreadMessages = messages.filter(
      (m) => !m.read && m.sender_id !== user.id
    );

    if (unreadMessages.length > 0) {
      const ids = unreadMessages.map((m) => m.id);
      supabase
        .from("inquiry_messages")
        .update({ read: true })
        .in("id", ids)
        .then();
    }
  }, [messages, user]);

  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      if (!user || !text.trim()) return;

      const { error } = await supabase.from("inquiry_messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        message: text.trim(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["inquiry-messages", conversationId] });
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

  const handleBookingSubmit = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to book this provider",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate) {
      toast({
        title: "Select a date",
        description: "Please select a date for your booking",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          provider_id: providerId,
          service_date: format(selectedDate, "yyyy-MM-dd"),
          service_time: selectedTime || null,
          message: bookingMessage || null,
          special_requirements: specialRequirements || null,
          status: "pending",
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Link the booking to the conversation
      await supabase
        .from("inquiry_conversations")
        .update({ booking_id: booking.id, status: "converted" })
        .eq("id", conversationId);

      toast({
        title: "Booking request sent!",
        description: "The provider will review your request and respond soon.",
      });
      
      setBookingDialogOpen(false);
      setSelectedDate(undefined);
      setSelectedTime("");
      setBookingMessage("");
      setSpecialRequirements("");
      onBookingCreated?.();
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-background rounded-xl border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-3">
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={providerAvatar} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <span
                className={cn(
                  "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card",
                  otherUserPresence.isOnline ? "bg-green-500" : "bg-muted-foreground"
                )}
              />
            </div>
            <div>
              <h3 className="font-display font-semibold">{providerName}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {otherUserPresence.isTyping ? (
                  <span className="text-primary flex items-center gap-1">
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      typing...
                    </motion.span>
                  </span>
                ) : otherUserPresence.isOnline ? (
                  <>
                    <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                    Online
                  </>
                ) : (
                  "Offline"
                )}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setBookingDialogOpen(true)}
            className="gradient-gold text-primary-foreground"
            size="sm"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Book Now
          </Button>
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
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
              <MessageSquare className="h-12 w-12 opacity-50" />
              <div className="text-center">
                <p className="text-sm font-medium">Start the conversation!</p>
                <p className="text-xs">Ask about services, pricing, availability, etc.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex gap-2", isOwn && "flex-row-reverse")}
                    >
                      {!isOwn && (
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={providerAvatar} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        </div>
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
              onChange={(e) => {
                setMessage(e.target.value);
                handleTypingStart();
              }}
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

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Book {providerName}
            </DialogTitle>
            <DialogDescription>
              Fill in all the details for your booking request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Select Date *</Label>
              <div className="flex justify-center mt-2">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className={cn("rounded-md border pointer-events-auto")}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="time">Preferred Time</Label>
              <Input
                id="time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="bookingMessage">Message</Label>
              <Textarea
                id="bookingMessage"
                placeholder="Describe your event, requirements, etc."
                value={bookingMessage}
                onChange={(e) => setBookingMessage(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="specialRequirements">Special Requirements</Label>
              <Textarea
                id="specialRequirements"
                placeholder="Any special requirements or preferences..."
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-gold text-primary-foreground"
              onClick={handleBookingSubmit}
              disabled={isSubmitting || !selectedDate}
            >
              {isSubmitting ? "Sending..." : "Send Booking Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
