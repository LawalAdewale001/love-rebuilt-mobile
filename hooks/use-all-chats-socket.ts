import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { getAuthUser } from "@/lib/auth-store";
import { queryKeys } from "@/lib/queries";
import { getActiveConversationId } from "@/lib/active-conversation";
import { Audio } from "expo-av";

type TypingState = {
  userId: string;
  userName: string;
  isTyping: boolean;
  conversationId: string;
};

// Preloaded notification sound reference (loaded once, reused)
let notificationSound: Audio.Sound | null = null;

async function playNotificationSound() {
  try {
    if (!notificationSound) {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        require("@/assets/audio/notification.mp3"),
        { shouldPlay: false, volume: 1.0 }
      );
      notificationSound = sound;
    }
    await notificationSound.setPositionAsync(0);
    await notificationSound.playAsync();
  } catch (e) {
    console.warn("[Notification] Sound error:", e);
  }
}

/**
 * Hook to listen for events across ALL conversations.
 * Useful for the chat list screen.
 * Also plays notification.mp3 when a new message arrives in a conversation
 * the user is NOT currently viewing — just like WhatsApp.
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

            if (timeouts.current[data.conversationId]) {
              clearTimeout(timeouts.current[data.conversationId]);
            }

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

      const onNewMessage = (message: any) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.chats() });

        // Play notification sound if the message is from someone else
        // AND the user is not currently viewing that conversation
        const isFromMe = message?.senderId === currentUserId;
        const isActiveConversation = message?.conversationId === getActiveConversationId();
        if (!isFromMe && !isActiveConversation) {
          playNotificationSound();
        }
      };

      s.on("isTyping", onTyping);
      s.on("newMessage", onNewMessage);
      s.on("messageEdited", handleRefresh);
      s.on("messageDeleted", handleRefresh);

      return () => {
        s.off("isTyping", onTyping);
        s.off("newMessage", onNewMessage);
        s.off("messageEdited", handleRefresh);
        s.off("messageDeleted", handleRefresh);
      };
    };

    let cleanupListeners: (() => void) | undefined;

    if (socket) {
      cleanupListeners = setupListeners(socket);
    } else {
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
      Object.values(timeouts.current).forEach((t) => clearTimeout(t));
    };
  }, [currentUserId, queryClient]);

  return { typingMap };
}
