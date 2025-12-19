import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PresenceState {
  isOnline: boolean;
  isTyping: boolean;
  lastSeen?: string;
}

interface UseChatPresenceOptions {
  conversationId: string;
  userId: string | undefined;
  otherUserId?: string;
}

export const useChatPresence = ({
  conversationId,
  userId,
  otherUserId,
}: UseChatPresenceOptions) => {
  const [otherUserPresence, setOtherUserPresence] = useState<PresenceState>({
    isOnline: false,
    isTyping: false,
  });
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Track own typing status
  const setTyping = useCallback((typing: boolean) => {
    setIsTyping(typing);
    
    if (channelRef.current && userId) {
      channelRef.current.track({
        user_id: userId,
        is_typing: typing,
        online_at: new Date().toISOString(),
      });
    }
  }, [userId]);

  // Handle input change - set typing with auto-clear
  const handleTypingStart = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    setTyping(true);
    
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 2000);
  }, [setTyping]);

  useEffect(() => {
    if (!conversationId || !userId) return;

    const channel = supabase.channel(`presence-${conversationId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        
        // Find other user's presence
        Object.entries(state).forEach(([key, presences]) => {
          if (key !== userId && presences.length > 0) {
            const presence = presences[0] as any;
            setOtherUserPresence({
              isOnline: true,
              isTyping: presence.is_typing || false,
              lastSeen: presence.online_at,
            });
          }
        });
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        if (key !== userId && newPresences.length > 0) {
          const presence = newPresences[0] as any;
          setOtherUserPresence({
            isOnline: true,
            isTyping: presence.is_typing || false,
            lastSeen: presence.online_at,
          });
        }
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (key !== userId) {
          setOtherUserPresence((prev) => ({
            ...prev,
            isOnline: false,
            isTyping: false,
            lastSeen: new Date().toISOString(),
          }));
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: userId,
            is_typing: false,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, userId]);

  return {
    otherUserPresence,
    isTyping,
    handleTypingStart,
    setTyping,
  };
};