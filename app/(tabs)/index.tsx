import { IconSymbol } from "@/components/ui/icon-symbol";
import { useProfileQuery } from "@/lib/queries";
import { Box, HStack, Pressable, Text, VStack } from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const DEFAULT_AVATAR = require("@/assets/images/home-avatar.png");

export default function DiscoverScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"forYou" | "nearby">("forYou");
  const { data: profile } = useProfileQuery();

  const firstName = profile?.fullName?.split(" ")[0] ?? "there";
  const avatarSource = profile?.avatar
    ? { uri: profile.avatar }
    : DEFAULT_AVATAR;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <VStack flex={1} px="$6" pt="$2">
        {/* Header Section */}
        <HStack justifyContent="space-between" alignItems="center">
          <HStack space="md" alignItems="center">
            {/* User Avatar */}
            <Box w={48} h={48} borderRadius="$full" overflow="hidden">
              <Image
                source={avatarSource}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            </Box>
            <VStack>
              <Text size="sm" color="$textLight500">
                Hello, {firstName}
              </Text>
              <Text size="lg" fontWeight="$bold" color="$textLight900">
                Let's Find a Match
              </Text>
            </VStack>
          </HStack>

          {/* Header Action Icons */}
          <HStack space="lg" alignItems="center">
            <Pressable onPress={() => router.push("/search")}>
              <IconSymbol name="circle" size={24} color="#1A1A1A" />
              {/* Replace with search icon */}
            </Pressable>
            <Pressable
              w={40}
              h={40}
              bg="#FFF9FA"
              borderRadius="$full"
              borderWidth={1}
              borderColor="#FDECEE"
              justifyContent="center"
              alignItems="center"
              onPress={() => router.push("/notifications")}
            >
              <IconSymbol name="bell.fill" size={20} color="#E86673" />
              {/* Replace with bell icon */}
            </Pressable>
          </HStack>
        </HStack>

        {/* Toggle & Filter Section */}
        <HStack mt="$6" space="md" alignItems="center">
          {/* Segmented Control */}
          <HStack flex={1} bg="#F7F5F4" borderRadius="$full" p="$1">
            <Pressable
              flex={1}
              py="$3"
              borderRadius="$full"
              bg={activeTab === "forYou" ? "#E86673" : "transparent"}
              alignItems="center"
              onPress={() => setActiveTab("forYou")}
            >
              <Text
                fontWeight="$bold"
                color={activeTab === "forYou" ? "#FFFFFF" : "$textLight500"}
              >
                For You
              </Text>
            </Pressable>
            <Pressable
              flex={1}
              py="$3"
              borderRadius="$full"
              bg={activeTab === "nearby" ? "#E86673" : "transparent"}
              alignItems="center"
              onPress={() => setActiveTab("nearby")}
            >
              <Text
                fontWeight="$bold"
                color={activeTab === "nearby" ? "#FFFFFF" : "$textLight500"}
              >
                Nearby
              </Text>
            </Pressable>
          </HStack>

          {/* Filter Button */}
          <Pressable
            w={48}
            h={48}
            bg="#E86673"
            borderRadius="$full"
            justifyContent="center"
            alignItems="center"
            onPress={() => router.push("/modal")}
          >
            <IconSymbol
              name="arrow.down.forward.and.arrow.up.backward"
              size={20}
              color="#FFFFFF"
            />
          </Pressable>
        </HStack>

        {/* Main Dating Card */}
        <Pressable
          flex={1}
          mt="$6"
          mb="$2"
          borderRadius={30}
          overflow="hidden"
          position="relative"
          onPress={() => router.push("/profile-detail")}
        ></Pressable>
      </VStack>
    </SafeAreaView>
  );
}
