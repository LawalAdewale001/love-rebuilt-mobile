import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { Box, HStack, Text } from "@gluestack-ui/themed";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function OfflineBanner() {
  const [status, setStatus] = useState<"online" | "offline" | "restored">("online");
  const offset = useSharedValue(100);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const removeNetInfoSubscription = NetInfo.addEventListener((state) => {
      const isActuallyOffline = state.isConnected === false;
      
      setStatus((prev) => {
        if (prev === "offline" && !isActuallyOffline) {
          // Just came back online
          offset.value = withTiming(0, { duration: 300 });
          timeout = setTimeout(() => {
            offset.value = withTiming(100, { duration: 300 });
            setTimeout(() => setStatus("online"), 300);
          }, 3000);
          return "restored";
        }
        
        if (isActuallyOffline) {
          if (timeout) clearTimeout(timeout);
          offset.value = withTiming(0, { duration: 300 });
          return "offline";
        }

        if (!isActuallyOffline && prev !== "restored") {
          offset.value = withTiming(100, { duration: 300 });
          return "online";
        }

        return prev;
      });
    });

    return () => {
      removeNetInfoSubscription();
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  if (status === "online" && offset.value === 100) return null;

  const isRestored = status === "restored";

  return (
    <Animated.View style={[styles.container, { bottom: insets.bottom + 14 }, animatedStyle]}>
      <Box 
        bg={isRestored ? "#4CAF50" : "#1A1A1A"} 
        borderRadius={12} 
        px="$4" 
        py="$3" 
        shadowColor="#000000" 
        shadowOffset={{ width: 0, height: 4 }} 
        shadowOpacity={0.2} 
        shadowRadius={8} 
        elevation={5}
      >
        <HStack space="sm" alignItems="center">
          <MaterialIcons 
            name={isRestored ? "check-circle" : "cloud-off"} 
            size={20} 
            color={isRestored ? "#FFFFFF" : "#E86A7A"} 
          />
          <Text color="#FFFFFF" fontSize={14} fontWeight="$medium">
            {isRestored 
              ? "Connection restored. You're back online!" 
              : "You are currently offline. Check your connection."}
          </Text>
        </HStack>
      </Box>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 9999,
  },
});
