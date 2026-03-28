import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="location" />
      <Stack.Screen name="birth-details" />
      <Stack.Screen name="gender" />
      <Stack.Screen name="identity" />
      <Stack.Screen name="religion" />
      <Stack.Screen name="tribe" />
      <Stack.Screen name="relationship-goal" />
      <Stack.Screen name="children-status" />

      <Stack.Screen name="gallery" />
    </Stack>
  );
}
