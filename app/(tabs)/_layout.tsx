import { TabIcon } from "@/components/navigation/TabIcon";
import { useChatListQuery } from "@/lib/queries";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Tabs } from "expo-router";
import React, { useMemo } from "react";
import { Platform } from "react-native";

/**
 * Tab bar configuration with custom SVG icons and sleek animations.
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { data } = useChatListQuery();

  const totalUnreadCount = useMemo(() => {
    if (!data?.pages) return 0;
    return data.pages.reduce((acc, page) => {
      return acc + (page.result?.reduce((pAcc, chat) => pAcc + (chat.unreadCount || 0), 0) || 0);
    }, 0);
  }, [data]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#E86A7A", // Updated to match user's SVG color
        tabBarInactiveTintColor: "#7F7F7F", // Updated to match user's inactive SVG color
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#EEEEEE",
          height: Platform.OS === 'ios' ? 110 : 100,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 38 : 15,
          elevation: 0,
          shadowOpacity: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="index" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Matches",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="matches" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="chats" focused={focused} />
          ),
          tabBarBadge: totalUnreadCount > 0 ? totalUnreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#E86A7A",
            fontSize: 10,
            lineHeight: 14,
            height: 16,
            minWidth: 16,
            borderRadius: 8,
          }
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="learn" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

