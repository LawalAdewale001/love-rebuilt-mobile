import { Platform } from "react-native";

/** Register for push notifications and return the Expo push token. Returns null silently in Expo Go or on failure. */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const Device = await import("expo-device");
    const Notifications = await import("expo-notifications");
    const Constants = (await import("expo-constants")).default;

    if (!Device.isDevice) {
      console.log("[Push] Must use physical device for push notifications");
      return null;
    }

    // Configure foreground notification display
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[Push] Permission not granted");
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#E86673",
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log("[Push] Token:", tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.log("[Push] Registration failed (expected in Expo Go):", error);
    return null;
  }
}
