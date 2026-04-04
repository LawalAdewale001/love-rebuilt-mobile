import { useEffect, useState } from "react";
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

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onTyping = (data: TypingState) => {
      if (data.userId === currentUserId) return;

      setTypingMap((prev) => {
        const next = { ...prev };
        if (data.isTyping) {
          next[data.conversationId] = data.userName;
        } else {
          delete next[data.conversationId];
        }
        return next;
      });
    };

    const handleRefresh = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats() });
    };

    socket.on("isTyping", onTyping);
    socket.on("newMessage", handleRefresh);
    socket.on("messageEdited", handleRefresh);
    socket.on("messageDeleted", handleRefresh);

    return () => {
      socket.off("isTyping", onTyping);
      socket.off("newMessage", handleRefresh);
      socket.off("messageEdited", handleRefresh);
      socket.off("messageDeleted", handleRefresh);
    };
  }, [currentUserId, queryClient]);

  return { typingMap };
}
