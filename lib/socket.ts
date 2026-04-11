import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/auth-store";

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://staging-api.loverebuilt.com";

let socket: Socket | null = null;

/** Get or create the singleton socket connection. */
export function getSocket(): Socket | null {
  return socket;
}

/** Connect to the WebSocket server with the current auth token. */
export function connectSocket(): Socket | null {
  const token = getAccessToken();
  if (!token) return null;

  // Already connected
  if (socket?.connected) return socket;

  // Disconnect stale socket
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    query: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("[Socket] Connected:", socket?.id);
  });

  socket.on("connect_error", (err) => {
    console.error("[Socket] Connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason);
  });

  return socket;
}

/** Disconnect and clean up the socket. */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// ─── Emit helpers

import type { MessageType } from "@/types/chat.types";

export function emitSendMessage(data: {
  conversationId: string;
  content?: string;
  replyToId?: string;
  mediaUrl?: string;
  type?: MessageType;
}, callback?: (response: any) => void) {
  socket?.emit("sendMessage", data, (response: any) => {
    callback?.(response);
  });
}

export function emitTyping(conversationId: string, isTyping: boolean) {
  socket?.emit("typing", { conversationId, isTyping });
}

export function emitEditMessage(messageId: string, content: string) {
  socket?.emit("editMessage", { messageId, content });
}

export function emitDeleteMessage(messageId: string, mode: "everyone" | "me") {
  socket?.emit("deleteMessage", { messageId, mode });
}

export function emitMarkAsRead(conversationId: string) {
  socket?.emit("markAsRead", { conversationId });
}

// ─── Call signaling

export function emitCallInvite(data: {
  receiverId: string;
  channelName: string;
  isVideo: boolean;
  info?: { callerName: string; callerAvatar?: string };
}) {
  socket?.emit("call:invite", data);
}

export function emitCallAccept(callerId: string, channelName: string) {
  socket?.emit("call:accept", { callerId, channelName });
}

export function emitCallReject(callerId: string) {
  socket?.emit("call:reject", { callerId, reason: "declined" });
}

export function emitCallHangup(otherUserId: string, channelName: string) {
  socket?.emit("call:hangup", { otherUserId, channelName });
}
