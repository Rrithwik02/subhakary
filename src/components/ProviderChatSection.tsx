import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Send, MessageCircle, User, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProviderChatSectionProps {
  providerId: string;
  providerProfileId: string;
}

interface Conversation {
  booking_id: string;
  customer_name: string;
  customer_id: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  service_date: string;
}

interface Message {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  read: boolean;
}

export const ProviderChatSection = ({ providerId, providerProfileId }: ProviderChatSectionProps) => {
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch active bookings with chat capability (accepted status)
  const { data: conversations = [], refetch: refetchConversations } = useQuery({
    queryKey: ["provider-conversations", providerId],
    queryFn: async () => {
      // Get all accepted bookings for this provider
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(`
          id,
          service_date,
          user_id
        `)
        .eq("provider_id", providerId)
        .eq("status", "accepted")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!bookings || bookings.length === 0) return [];

      // Get customer profiles
      const userIds = [...new Set(bookings.map(b => b.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, full_name")
        .in("user_id", userIds);

      // Get last message and unread count for each booking
      const conversationsWithDetails = await Promise.all(
        bookings.map(async (booking) => {
          const profile = profiles?.find(p => p.user_id === booking.user_id);

          // Get last message
          const { data: lastMsg } = await supabase
            .from("chat_messages")
            .select("message, created_at")
            .eq("booking_id", booking.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count (messages sent to provider that are unread)
          const { count } = await supabase
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("booking_id", booking.id)
            .eq("receiver_id", providerProfileId)
            .eq("read", false);

          return {
            booking_id: booking.id,
            customer_name: profile?.full_name || "Customer",
            customer_id: profile?.id || "",
            last_message: lastMsg?.message || "No messages yet",
            last_message_time: lastMsg?.created_at || booking.service_date,
            unread_count: count || 0,
            service_date: booking.service_date,
          };
        })
      );

      return conversationsWithDetails;
    },
    enabled: !!providerId,
  });

  // Fetch messages for selected conversation
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["provider-chat-messages", selectedConversation?.booking_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("booking_id", selectedConversation!.booking_id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Mark messages as read
      await supabase
        .from("chat_messages")
        .update({ read: true })
        .eq("booking_id", selectedConversation!.booking_id)
        .eq("receiver_id", providerProfileId)
        .eq("read", false);

      return data as Message[];
    },
    enabled: !!selectedConversation?.booking_id,
  });

  // Subscribe to real-time messages
  useEffect(() => {
    if (!selectedConversation?.booking_id) return;

    const channel = supabase
      .channel(`provider-chat-${selectedConversation.booking_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `booking_id=eq.${selectedConversation.booking_id}`,
        },
        () => {
          refetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.booking_id, refetchMessages]);

  // Subscribe to all conversations for unread updates
  useEffect(() => {
    if (!providerId) return;

    const channel = supabase
      .channel("provider-all-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        () => {
          refetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [providerId, refetchConversations]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const { error } = await supabase.from("chat_messages").insert({
        booking_id: selectedConversation.booking_id,
        sender_id: providerProfileId,
        receiver_id: selectedConversation.customer_id,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
      refetchMessages();
      refetchConversations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold mb-2">No active conversations</h3>
          <p className="text-muted-foreground">
            When you accept bookings, you can chat with customers here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-4 h-[600px]">
      {/* Conversation List */}
      <Card className={`md:col-span-1 ${selectedConversation ? "hidden md:block" : ""}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            Messages
            {totalUnread > 0 && (
              <Badge variant="destructive" className="text-xs">
                {totalUnread}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <ScrollArea className="h-[520px]">
          <div className="px-4 space-y-2">
            {conversations.map((conv) => (
              <motion.div
                key={conv.booking_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedConversation?.booking_id === conv.booking_id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted"
                }`}
                onClick={() => setSelectedConversation(conv)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{conv.customer_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.last_message}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(conv.last_message_time), "MMM d")}
                    </span>
                    {conv.unread_count > 0 && (
                      <Badge variant="destructive" className="text-xs h-5 w-5 p-0 flex items-center justify-center">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className={`md:col-span-2 flex flex-col ${!selectedConversation ? "hidden md:flex" : ""}`}>
        {selectedConversation ? (
          <>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{selectedConversation.customer_name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Service date: {format(new Date(selectedConversation.service_date), "PPP")}
                  </p>
                </div>
              </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <AnimatePresence>
                  {messages.map((msg) => {
                    const isProvider = msg.sender_id === providerProfileId;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isProvider ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            isProvider
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isProvider ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {format(new Date(msg.created_at), "h:mm a")}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  disabled={sending}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim() || sending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to start chatting</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
