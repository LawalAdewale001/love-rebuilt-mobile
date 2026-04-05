import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { getAuthUser } from "@/lib/auth-store";
import { queryKeys } from "@/lib/queries";

type TypingState = {
  userId: string;
  userName: string;
  isTyping: boolean;
  conversationId: string;
};

/**
 * Hook to listen for events across ALL conversations.
 * Useful for the chat list screen.
 */
export function useAllChatsSocket() {
  const queryClient = useQueryClient();
  const [typingMap, setTypingMap] = useState<Record<string, string>>({}); // chatId -> userName
  const currentUserId = getAuthUser()?.id;
  const timeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    let socket = getSocket();
    let interval: ReturnType<typeof setInterval>;

    const setupListeners = (s: any) => {
      const onTyping = (data: TypingState) => {
        if (data.userId === currentUserId) return;

        setTypingMap((prev) => {
          const next = { ...prev };
          if (data.isTyping) {
            next[data.conversationId] = data.userName;
            
            // Clear existing timeout for this chat
            if (timeouts.current[data.conversationId]) {
              clearTimeout(timeouts.current[data.conversationId]);
            }
            
            // Auto-clear after 4s
            timeouts.current[data.conversationId] = setTimeout(() => {
              setTypingMap((prev) => {
                const next = { ...prev };
                delete next[data.conversationId];
                return next;
              });
            }, 4000);
          } else {
            delete next[data.conversationId];
            if (timeouts.current[data.conversationId]) {
              clearTimeout(timeouts.current[data.conversationId]);
            }
          }
          return next;
        });
      };

      const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.chats() });
      };

      s.on("isTyping", onTyping);
      s.on("newMessage", handleRefresh);
      s.on("messageEdited", handleRefresh);
      s.on("messageDeleted", handleRefresh);

      return () => {
        s.off("isTyping", onTyping);
        s.off("newMessage", handleRefresh);
        s.off("messageEdited", handleRefresh);
        s.off("messageDeleted", handleRefresh);
      };
    };

    let cleanupListeners: (() => void) | undefined;

    if (socket) {
      cleanupListeners = setupListeners(socket);
    } else {
      // If socket isn't ready yet, poll for it
      interval = setInterval(() => {
        socket = getSocket();
        if (socket) {
          cleanupListeners = setupListeners(socket);
          clearInterval(interval);
        }
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (cleanupListeners) cleanupListeners();
      // Clear all timeouts on unmount
      Object.values(timeouts.current).forEach((t) => clearTimeout(t));
    };
  }, [currentUserId, queryClient]);

  return { typingMap };
}
