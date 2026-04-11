import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

/**
 * Configure how notifications are displayed when the app is in the foreground.
 * This must be called at module level (before any component mounts) so it is
 * active for the entire app lifecycle.
 *
 * Suppresses banner + sound for message notifications when the user is already
 * viewing that conversation (active conversation check via active-conversation.ts).
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as Record<string, any> | undefined;
    if (data?.type === "message" && data?.conversationId) {
      const { getActiveConversationId } = require("./active-conversation") as typeof import("./active-conversation");
      if (data.conversationId === getActiveConversationId()) {
        return {
          shouldShowBanner: false,
          shouldShowList: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }
    }
    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

/**
 * Request notification permissions and return the native device push token.
 *
 * We use `getDevicePushTokenAsync()` (NOT `getExpoPushTokenAsync()`) because
 * the backend sends directly via Firebase Admin SDK, which requires:
 *   • Android → FCM registration token
 *   • iOS     → APNs device token (Firebase configures APNs internally)
 *
 * The Expo push token (`ExponentPushToken[...]`) only works with Expo's own
 * push service and is NOT accepted by Firebase Admin SDK's `messaging().send()`.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const Device = await import("expo-device");

    if (!Device.isDevice) {
      console.log("[Push] Physical device required for push notifications");
      return null;
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[Push] Permission not granted");
      return null;
    }

    // Android notification channel (required for Android 8+)
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "LoveRebuilt",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#E86673",
        sound: "default",
      });
    }

    // Native FCM / APNs token — what Firebase Admin SDK expects
    const tokenData = await Notifications.getDevicePushTokenAsync();
    console.log("[Push] Device token:", tokenData.data);
    return tokenData.data as string;
  } catch (error) {
    console.log("[Push] Token registration failed:", error);
    return null;
  }
}
