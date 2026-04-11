import { LogBox } from "react-native";

// Suppress SafeAreaView deprecation warning from dependencies (e.g. Gluestack) until they update
LogBox.ignoreLogs([
  "SafeAreaView has been deprecated",
  "react-native-safe-area-context",
  "Expo AV has been deprecated",
]);

import { config } from "@gluestack-ui/config";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Redirect, Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import "react-native-reanimated";
import * as Notifications from "expo-notifications";

import { ToastProvider } from "@/components/ui/toast";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { useColorScheme } from "@/hooks/use-color-scheme";
import "@/lib/api-client-interceptors"; // Registers axios interceptors for protected routes
import "@/lib/push-notifications";       // Registers setNotificationHandler at module level
import { getAccessToken, loadAuth } from "@/lib/auth-store";
import { queryClient } from "@/lib/query-client";
import { connectSocket, getSocket } from "@/lib/socket";

/**
 * Listens globally for incoming call invitations and navigates to the
 * incoming-call screen. Mounted once for the entire authenticated session.
 */
function useIncomingCallSocket() {
  const router = useRouter();

  useEffect((): (() => void) => {
    let cleanup: (() => void) = () => {};
    let intervalId: ReturnType<typeof setInterval>;

    const register = (socket: ReturnType<typeof getSocket>) => {
      if (!socket) return;

      const onInvited = (data: {
        callerId: string;
        channelName: string;
        isVideo: boolean;
        info?: { callerName?: string; callerAvatar?: string };
      }) => {
        router.push({
          pathname: "/incoming-call",
          params: {
            callerName: data.info?.callerName || "Unknown",
            callerAvatar: data.info?.callerAvatar || "",
            callerId: data.callerId,
            channelName: data.channelName,
            isVideo: data.isVideo ? "true" : "false",
          },
        });
      };

      socket.on("call:invited", onInvited);
      cleanup = () => { socket.off("call:invited", onInvited); };
    };

    const socket = getSocket();
    if (socket) {
      register(socket);
    } else {
      // Socket may not be ready yet — poll until it is
      intervalId = setInterval(() => {
        const s = getSocket();
        if (s) {
          clearInterval(intervalId);
          register(s);
        }
      }, 500);
    }

    return () => {
      clearInterval(intervalId);
      cleanup();
    };
  }, []);
}

/**
 * Handles push notification taps — routes the user to the relevant screen
 * whether the app was in the foreground, background, or just launched from
 * a killed state (lastNotificationResponse covers the killed-state case).
 *
 * When the app is cold-started by a tap, auth may not be confirmed yet. We
 * hold the response in a ref and process it only once authReady is true, so
 * the router and query cache are both available.
 */
function useNotificationNavigation(authReady: boolean) {
  const router = useRouter();
  const lastHandled = useRef<string | null>(null);
  const pendingResponse = useRef<Notifications.NotificationResponse | null>(null);

  const navigate = (response: Notifications.NotificationResponse) => {
    const id = response.notification.request.identifier;
    if (lastHandled.current === id) return; // Prevent double-navigation
    lastHandled.current = id;

    const data = response.notification.request.content.data as Record<string, any> | undefined;
    if (!data) return;

    if (data.type === "message" && data.conversationId) {
      // Try to look up live member info from the chat list cache so the
      // header shows the correct name/avatar/online status immediately.
      const { queryClient } = require("@/lib/query-client") as typeof import("@/lib/query-client");
      const { queryKeys } = require("@/lib/queries") as typeof import("@/lib/queries");
      const { getAuthUser } = require("@/lib/auth-store") as typeof import("@/lib/auth-store");
      const currentUserId = getAuthUser()?.id ?? "";

      let resolvedName: string = data.senderName ?? "Chat";
      let resolvedAvatar: string = data.senderAvatar ?? "";
      let resolvedIsOnline = "0";
      let resolvedLastSeen = "";
      let resolvedIsLiked = "0";
      let resolvedRecipientId: string = data.senderId ?? "";

      const cachedList = queryClient.getQueryData(queryKeys.chats()) as any;
      if (cachedList?.pages) {
        for (const page of cachedList.pages) {
          const conv = (page.result as any[])?.find((c: any) => c.id === data.conversationId);
          if (conv) {
            const other = (conv.members as any[])?.find((m: any) => m.userId !== currentUserId);
            if (other) {
              resolvedName = other.name ?? resolvedName;
              resolvedAvatar = other.avatar ?? resolvedAvatar;
              resolvedIsOnline = other.isOnline ? "1" : "0";
              resolvedLastSeen = other.lastSeen ?? "";
              resolvedIsLiked = other.isLiked ? "1" : "0";
              resolvedRecipientId = other.userId ?? resolvedRecipientId;
            }
            break;
          }
        }
      }

      router.push({
        pathname: "/chat-conversation",
        params: {
          id: data.conversationId,
          name: resolvedName,
          avatar: resolvedAvatar,
          isGroup: data.isGroup ? "1" : "0",
          recipientId: resolvedRecipientId,
          isOnline: resolvedIsOnline,
          isLiked: resolvedIsLiked,
          lastSeen: resolvedLastSeen,
        },
      });
    } else if (data.type === "like") {
      router.push("/(tabs)");
    }
  };

  // Once auth is confirmed, flush any pending cold-start notification tap
  useEffect(() => {
    if (!authReady) return;
    if (pendingResponse.current) {
      navigate(pendingResponse.current);
      pendingResponse.current = null;
    }
  }, [authReady]);

  useEffect(() => {
    // Handle taps when app is in foreground or background
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (!authReady) {
        pendingResponse.current = response; // Hold until auth is ready
      } else {
        navigate(response);
      }
    });

    // Handle tap that opened the app from a killed state
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      if (!authReady) {
        pendingResponse.current = response; // Will be flushed once authReady
      } else {
        navigate(response);
      }
    });

    return () => sub.remove();
  }, []);
}

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [authState, setAuthState] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    loadAuth().then(async () => {
      const hasToken = !!getAccessToken();
      setAuthState(hasToken ? "authenticated" : "unauthenticated");
      if (hasToken) {
        connectSocket();
        // Refresh push token on every app start so it stays current
        try {
          const { registerForPushNotifications } = await import("@/lib/push-notifications");
          const { apiClient } = await import("@/lib/api-client");
          const token = await registerForPushNotifications();
          if (token) {
            apiClient.patch("/api/user/update", { devicePushToken: token }).catch(() => {});
          }
        } catch {}
      }
      SplashScreen.hideAsync();
    });
  }, []);

  // Global incoming call listener (active for the whole authenticated session)
  useIncomingCallSocket();

  // Push notification tap → navigate to the right screen
  // authReady = true only after loadAuth() completes and user is confirmed authenticated
  useNotificationNavigation(authState === "authenticated");

  if (authState === "loading") return null;

  return (
    <QueryClientProvider client={queryClient}>
      <GluestackUIProvider config={config}>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <ToastProvider>
            {authState === "authenticated" && <Redirect href="/(tabs)" />}
            <Stack initialRouteName="(auth)">
              {/* The Auth flow */}
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              {/* The Main App flow */}
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

              {/* Modals and Overlays */}
              <Stack.Screen
                name="modal"
                options={{
                  presentation: "modal",
                  title: "Modal",
                  headerShown: false,
                }}
              />

              {/* New Screens */}
              <Stack.Screen name="search" options={{ headerShown: false }} />
              <Stack.Screen
                name="notifications"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="profile-detail"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="profile-gallery"
                options={{ headerShown: false }}
              />
              {/* Learn Flow Screens */}
              <Stack.Screen
                name="video-player"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="course-completed"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="chat-conversation"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="call-screen"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="incoming-call"
                options={{ headerShown: false, animation: "slide_from_bottom" }}
              />
            </Stack>
            <StatusBar style="auto" />
            <OfflineBanner />
          </ToastProvider>
        </ThemeProvider>
      </GluestackUIProvider>
    </QueryClientProvider>
  );
}
