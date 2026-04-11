import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket, emitMarkAsRead } from "@/lib/socket";
import { queryKeys, type ChatMessage } from "@/lib/queries";
import { getAuthUser } from "@/lib/auth-store";

type TypingState = {
  userId: string;
  userName: string;
  isTyping: boolean;
};

/**
 * Hook that listens to socket events for a specific conversation.
 * Returns real-time state (typing indicator, online status) and
 * invalidates React Query caches when messages change.
 */
export function useChatSocket(conversationId: string) {
  const queryClient = useQueryClient();
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [isRecipientOnline, setIsRecipientOnline] = useState<boolean | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUserId = getAuthUser()?.id;

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversationId) return;

    // ─── New message
    const onNewMessage = (message: ChatMessage) => {
      if (message.conversationId !== conversationId) return;
      // Invalidate messages query to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages(conversationId),
      });
      // Also invalidate chat list to update last message
      queryClient.invalidateQueries({ queryKey: queryKeys.chats() });
      // If the message is from someone else, mark it as read immediately
      // (the user is actively viewing this conversation)
      if (message.senderId !== currentUserId) {
        emitMarkAsRead(conversationId);
      }
    };

    // ─── Messages read by the other person
    const onMessagesRead = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId !== conversationId) return;
      // Refresh messages so sent bubbles update to "read" (double-tick)
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages(conversationId),
      });
    };

    // ─── Typing indicator
    const onTyping = (data: TypingState & { conversationId: string }) => {
      if (data.conversationId !== conversationId) return;
      if (data.userId === currentUserId) return;

      if (data.isTyping) {
        setTypingUser(data.userName);
        // Auto-clear after 4s in case stop event is missed
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTypingUser(null), 4000);
      } else {
        setTypingUser(null);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
      }
    };

    // ─── Message edited
    const onMessageEdited = (message: ChatMessage) => {
      if (message.conversationId !== conversationId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages(conversationId),
      });
      // Update chat list if this was the last message
      queryClient.invalidateQueries({ queryKey: queryKeys.chats() });
    };

    // ─── Message deleted
    const onMessageDeleted = (data: {
      messageId: string;
      conversationId: string;
      mode: string;
    }) => {
      if (data.conversationId !== conversationId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages(conversationId),
      });
      // Update chat list if this was the last message
      queryClient.invalidateQueries({ queryKey: queryKeys.chats() });
    };

    // ─── User online/offline status
    const onUserStatusChanged = (data: {
      userId: string;
      isOnline: boolean;
    }) => {
      // Update if it's the other person in this conversation
      if (data.userId !== currentUserId) {
        setIsRecipientOnline(data.isOnline);
      }
    };

    socket.on("newMessage", onNewMessage);
    socket.on("messagesRead", onMessagesRead);
    socket.on("isTyping", onTyping);
    socket.on("messageEdited", onMessageEdited);
    socket.on("messageDeleted", onMessageDeleted);
    socket.on("userStatusChanged", onUserStatusChanged);

    return () => {
      socket.off("newMessage", onNewMessage);
      socket.off("messagesRead", onMessagesRead);
      socket.off("isTyping", onTyping);
      socket.off("messageEdited", onMessageEdited);
      socket.off("messageDeleted", onMessageDeleted);
      socket.off("userStatusChanged", onUserStatusChanged);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [conversationId, currentUserId, queryClient]);

  return { typingUser, isRecipientOnline };
}
