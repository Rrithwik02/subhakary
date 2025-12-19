import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, MessageSquare, Inbox, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useChatPresence } from "@/hooks/useChatPresence";
import { cn } from "@/lib/utils";

interface ProviderInquiryChatProps {
  providerId: string;
}

interface InquiryConversation {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  booking_id: string | null;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export const ProviderInquiryChat = ({ providerId }: ProviderInquiryChatProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch inquiry conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["provider-inquiry-conversations", providerId],
    queryFn: async () => {
      const { data: convos, error } = await supabase
        .from("inquiry_conversations")
        .select("*")
        .eq("provider_id", providerId)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Fetch customer details and last messages for each conversation
      const enrichedConvos: InquiryConversation[] = await Promise.all(
        (convos || []).map(async (convo) => {
          // Get customer profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email, profile_image")
            .eq("user_id", convo.user_id)
            .maybeSingle();

          // Get last message
          const { data: lastMsg } = await supabase
            .from("inquiry_messages")
            .select("message, created_at")
            .eq("conversation_id", convo.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count
          const { count } = await supabase
            .from("inquiry_messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", convo.id)
            .eq("read", false)
            .neq("sender_id", user?.id || "");

          return {
            id: convo.id,
            user_id: convo.user_id,
            status: convo.status,
            created_at: convo.created_at,
            booking_id: convo.booking_id,
            customerName: profile?.full_name || "Customer",
            customerEmail: profile?.email || "",
            customerAvatar: profile?.profile_image,
            lastMessage: lastMsg?.message,
            lastMessageTime: lastMsg?.created_at,
            unreadCount: count || 0,
          };
        })
      );

      return enrichedConvos;
    },
    enabled: !!providerId && !!user,
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["inquiry-messages", selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];

      const { data, error } = await supabase
        .from("inquiry_messages")
        .select("*")
        .eq("conversation_id", selectedConversation)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Mark messages as read
      const unreadIds = (data || [])
        .filter((m) => !m.read && m.sender_id !== user?.id)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from("inquiry_messages")
          .update({ read: true })
          .in("id", unreadIds);
      }

      return data || [];
    },
    enabled: !!selectedConversation,
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`provider-inquiry-${selectedConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "inquiry_messages",
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["inquiry-messages", selectedConversation] });
          queryClient.invalidateQueries({ queryKey: ["provider-inquiry-conversations", providerId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, providerId, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      if (!user || !text.trim() || !selectedConversation) return;

      const { error } = await supabase.from("inquiry_messages").insert({
        conversation_id: selectedConversation,
        sender_id: user.id,
        message: text.trim(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["inquiry-messages", selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ["provider-inquiry-conversations", providerId] });
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

  const selectedConvo = conversations.find((c) => c.id === selectedConversation);

  // Presence tracking for typing indicators
  const { otherUserPresence, handleTypingStart } = useChatPresence({
    conversationId: selectedConversation || "",
    userId: user?.id,
  });

  if (conversationsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold mb-2">No inquiries yet</h3>
          <p className="text-muted-foreground">
            Customer inquiries will appear here when they message you
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-4 h-[600px]">
      {/* Conversations list */}
      <Card className="md:col-span-1 overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Inquiries
            </h3>
          </div>
          <ScrollArea className="h-[520px]">
            {conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setSelectedConversation(convo.id)}
                className={cn(
                  "w-full p-4 text-left border-b hover:bg-muted/50 transition-colors",
                  selectedConversation === convo.id && "bg-muted"
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={convo.customerAvatar} />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{convo.customerName}</span>
                      {convo.unreadCount > 0 && (
                        <Badge variant="default" className="text-xs">
                          {convo.unreadCount}
                        </Badge>
                      )}
                    </div>
                    {convo.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">
                        {convo.lastMessage}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {convo.status === "converted" && (
                        <Badge variant="secondary" className="text-xs">Booked</Badge>
                      )}
                      {convo.lastMessageTime && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(convo.lastMessageTime), "MMM d")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat area */}
      <Card className="md:col-span-2 overflow-hidden flex flex-col">
        {selectedConversation && selectedConvo ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConvo.customerAvatar} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card",
                    otherUserPresence.isOnline ? "bg-green-500" : "bg-muted-foreground"
                  )}
                />
              </div>
              <div>
                <h3 className="font-display font-semibold">{selectedConvo.customerName}</h3>
                <p className="text-xs text-muted-foreground">
                  {otherUserPresence.isTyping ? (
                    <motion.span
                      className="text-primary"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      typing...
                    </motion.span>
                  ) : otherUserPresence.isOnline ? (
                    <span className="flex items-center gap-1">
                      <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                      Online
                    </span>
                  ) : selectedConvo.status === "converted" ? (
                    "Converted to booking"
                  ) : (
                    "Inquiry"
                  )}
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              {messagesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted" />
                      <div className="h-12 bg-muted rounded-xl w-3/4" />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p className="text-sm">No messages yet</p>
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
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={selectedConvo.customerAvatar} />
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
            <div className="p-4 border-t">
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
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to view messages</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
