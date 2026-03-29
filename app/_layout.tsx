import { LogBox } from "react-native";

// Suppress SafeAreaView deprecation warning from dependencies (e.g. Gluestack) until they update
LogBox.ignoreLogs([
  "SafeAreaView has been deprecated",
  "react-native-safe-area-context",
]);

import { config } from "@gluestack-ui/config";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import "@/lib/api-client-interceptors"; // Registers axios interceptors for protected routes
import { queryClient } from "@/lib/query-client";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <GluestackUIProvider config={config}>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
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
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </GluestackUIProvider>
    </QueryClientProvider>
  );
}
