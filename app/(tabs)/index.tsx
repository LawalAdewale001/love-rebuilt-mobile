import { showToast } from "@/components/ui/toast";
import { PRIMARY_COLOR } from "@/constants/theme";
import {
  useDiscoveryGeneralQuery,
  useProfileQuery,
  useRecordInteractionMutation,
} from "@/lib/queries";
import {
  Box,
  HStack,
  Pressable,
  Spinner,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const DEFAULT_AVATAR = require("@/assets/images/home-avatar.png");

export default function DiscoverScreen() {
  const router = useRouter();

  // Tab state drives the query!
  const [activeTab, setActiveTab] = useState<"forYou" | "nearby">("forYou");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Queries
  const { data: currentUser } = useProfileQuery();
  // Pass the activeTab to the query hook
  const {
    data: discoveryResponse,
    isLoading,
    isFetching,
  } = useDiscoveryGeneralQuery(activeTab);
  const interactionMutation = useRecordInteractionMutation();

  // Reset the deck index when switching tabs
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeTab]);

  // Extract the actual array of users from the API response schema
  const discoveryProfiles = discoveryResponse?.data?.result || [];
  const currentProfile = discoveryProfiles[currentIndex];

  const firstName = currentUser?.fullName?.split(" ")[0] ?? "there";
  const avatarSource = currentUser?.avatar
    ? { uri: currentUser.avatar }
    : DEFAULT_AVATAR;

  const handleInteraction = (action: "like" | "pass") => {
    if (!currentProfile) return;

    interactionMutation.mutate(
      { targetUserId: currentProfile.id, action },
      {
        onSuccess: () => {
          // Move to the next profile in the array
          setCurrentIndex((prev) => prev + 1);
        },
        onError: () => {
          showToast("error", "Error", "Failed to record interaction");
        },
      },
    );
  };

  // Build the tags array safely from the available fields in the new schema
  const getTags = (profile: any) => {
    const tags = [
      profile.religion,
      profile.tribe,
      profile.childrenStatus,
    ].filter(Boolean);
    return tags.slice(0, 3); // Max 3 tags
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <VStack flex={1} px="$6" pt="$2">
        {/* Header Section */}
        <HStack justifyContent="space-between" alignItems="center">
          <HStack space="md" alignItems="center">
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

          <HStack space="lg" alignItems="center">
            <Pressable onPress={() => router.push("/search")}>
              <Image
                source={require("@/assets/images/icon-search.png")}
                style={{ width: 24, height: 24 }}
                contentFit="contain"
              />
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
              <Image
                source={require("@/assets/images/icon-bell.png")}
                style={{ width: 20, height: 20 }}
                contentFit="contain"
              />
            </Pressable>
          </HStack>
        </HStack>

        {/* Toggle & Filter Section */}
        <HStack mt="$6" space="md" alignItems="center">
          <HStack flex={1} bg="#F7F5F4" borderRadius="$full" p="$1">
            <Pressable
              flex={1}
              py="$3"
              borderRadius="$full"
              bg={activeTab === "forYou" ? PRIMARY_COLOR : "transparent"}
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
              bg={activeTab === "nearby" ? PRIMARY_COLOR : "transparent"}
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
          <Pressable
            w={48}
            h={48}
            bg={PRIMARY_COLOR}
            borderRadius="$full"
            justifyContent="center"
            alignItems="center"
            onPress={() => router.push("/modal")}
          >
            <Image
              source={require("@/assets/images/icon-filter.png")}
              style={{ width: 20, height: 20 }}
              contentFit="contain"
            />
          </Pressable>
        </HStack>

        {/* Main Dating Card View */}
        <Box flex={1} mt="$6" mb="$2">
          {isLoading && discoveryProfiles.length === 0 ? (
            <Box flex={1} justifyContent="center" alignItems="center">
              <Spinner size="large" color={PRIMARY_COLOR} />
            </Box>
          ) : currentProfile ? (
            <Pressable
              flex={1}
              borderRadius={30}
              overflow="hidden"
              position="relative"
              onPress={() =>
                router.push({
                  pathname: "/profile-detail",
                  params: { id: currentProfile.id },
                })
              }
            >
              {/* Profile Image */}
              <Image
                source={{
                  uri:
                    currentProfile.pictures?.[0] ||
                    "https://via.placeholder.com/400",
                }}
                style={{ width: "100%", height: "100%", position: "absolute" }}
                contentFit="cover"
              />

              {/* Status Badge */}
              <Box
                position="absolute"
                top={16}
                left={16}
                bg="#FFFFFF"
                opacity={0.9}
                py="$2"
                px="$4"
                borderRadius="$full"
              >
                <HStack space="xs" alignItems="center">
                  <Image
                    source={require("@/assets/images/icon-status.png")}
                    style={{ width: 16, height: 16 }}
                    contentFit="contain"
                  />
                  <Text fontWeight="$semibold" size="sm" color="#1A1A1A">
                    {currentProfile.relationshipGoal || "Open to Dating"}
                  </Text>
                </HStack>
              </Box>

              {/* Data Loading indicator for Tab switching */}
              {isFetching && (
                <Box
                  position="absolute"
                  top={16}
                  right={16}
                  bg="#FFFFFF"
                  py="$1"
                  px="$2"
                  borderRadius="$full"
                >
                  <Spinner size="small" color={PRIMARY_COLOR} />
                </Box>
              )}

              {/* Bottom Gradient */}
              <VStack
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                pt="$20"
                pb="$6"
                px="$6"
                bg="$black"
                opacity={0.6}
              />

              {/* Bottom Info Content */}
              <VStack
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                pb="$6"
                px="$6"
                zIndex={10}
              >
                {/* Location & Distance */}
                <HStack space="xs" alignItems="center" mb="$2">
                  <Image
                    source={require("@/assets/images/icon-location.png")}
                    style={{ width: 16, height: 16 }}
                    contentFit="contain"
                  />
                  <Text color="#FFFFFF" size="sm" fontWeight="$medium">
                    {currentProfile.location || "Location Unknown"}
                    {currentProfile.distance != null
                      ? ` • ${Math.round(currentProfile.distance)}km away`
                      : ""}
                  </Text>
                </HStack>

                {/* Name, Age, Verification */}
                <HStack space="xs" alignItems="center" mb="$3">
                  <Text color="#FFFFFF" size="3xl" fontWeight="$bold">
                    {currentProfile.fullName?.split(" ")[0]},{" "}
                    {currentProfile.age}
                  </Text>
                  {currentProfile.isVerified && (
                    <Image
                      source={require("@/assets/images/icon-verified.png")}
                      style={{ width: 24, height: 24 }}
                      contentFit="contain"
                    />
                  )}
                </HStack>

                {/* Tags & Action Buttons */}
                <HStack
                  space="md"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <HStack space="sm" flexWrap="wrap" flex={1}>
                    {getTags(currentProfile).map((tag: any, idx: number) => (
                      <Box
                        key={idx}
                        bg="rgba(255,255,255,0.2)"
                        px="$3"
                        py="$1"
                        borderRadius="$full"
                      >
                        <Text color="#FFFFFF" size="sm" fontWeight="$medium">
                          {tag}
                        </Text>
                      </Box>
                    ))}
                  </HStack>

                  {/* Floating Heart Button to Like */}
                  <Pressable
                    w={56}
                    h={56}
                    bg={PRIMARY_COLOR}
                    borderRadius="$full"
                    justifyContent="center"
                    alignItems="center"
                    ml="$2"
                    onPress={() => handleInteraction("like")}
                    disabled={interactionMutation.isPending}
                  >
                    {interactionMutation.isPending ? (
                      <Spinner color="#FFFFFF" size="small" />
                    ) : (
                      <Image
                        source={require("@/assets/images/icon-heart.png")}
                        style={{ width: 24, height: 24 }}
                        contentFit="contain"
                      />
                    )}
                  </Pressable>
                </HStack>
              </VStack>
            </Pressable>
          ) : (
            <Box flex={1} justifyContent="center" alignItems="center">
              <Text size="lg" color="$textLight500" textAlign="center">
                No more profiles found.{"\n"}Check back later!
              </Text>
            </Box>
          )}
        </Box>
      </VStack>
    </SafeAreaView>
  );
}
