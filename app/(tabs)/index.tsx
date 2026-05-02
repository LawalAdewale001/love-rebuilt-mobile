import { showToast } from "@/components/ui/toast";
import { PRIMARY_COLOR } from "@/constants/theme";
import {
  useDiscoveryGeneralQuery,
  useProfileQuery,
  useRecordInteractionMutation,
  useLikedProfiles,
} from "@/lib/queries";
import {
  Box,
  HStack,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function DiscoverScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"forYou" | "nearby">("forYou");
  const { likedProfiles, toggleLike } = useLikedProfiles();

  const { data: currentUser } = useProfileQuery();
  const {
    data: discoveryProfiles = [],
    isLoading,
    isFetching,
  } = useDiscoveryGeneralQuery(activeTab);

  const interactionMutation = useRecordInteractionMutation();

  const firstName = currentUser?.fullName?.split(" ")[0] ?? "there";
  const avatarSource = currentUser?.avatar ? { uri: currentUser.avatar } : null;

  /* app/(tabs)/index.tsx */

  /* app/(tabs)/index.tsx */

  // Handles both Likes and Passes
  const handleInteraction = (targetUserId: string, type: "like" | "pass" | "dislike") => {
    // Map 'pass' to 'dislike' for the backend
    const apiType = type === "pass" ? "dislike" : type;

    interactionMutation.mutate(
      {
        receiverId: targetUserId,
        type: apiType,
      },
      {
        onSuccess: () => {
          // Use the original 'type' for the toast
          showToast("success", type === "like" ? "Liked!" : "Unliked", "");
        },
        onError: (err: any) => {
          showToast(
            "error",
            "Error",
            err?.message || "Failed to record interaction",
          );
        },
      },
    );
  };

  const getTags = (profile: any) => {
    const tags = [
      profile.religion,
      profile.tribe,
      profile.childrenStatus,
    ].filter(Boolean);
    return tags.slice(0, 3);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <VStack flex={1} pt="$2">
        {/* Header Section */}
        <HStack justifyContent="space-between" alignItems="center" px="$6">
          <HStack space="md" alignItems="center">
            <Box w={48} h={48} borderRadius="$full" overflow="hidden">
              {avatarSource ? (
                <Image
                  source={avatarSource}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : (
                <Box
                  w={48}
                  h={48}
                  borderRadius="$full"
                  bg="$rose100"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text fontWeight="$bold" color="$rose500" fontSize={18}>
                    {firstName?.charAt(0).toUpperCase() ?? "?"}
                  </Text>
                </Box>
              )}
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
        <HStack mt="$6" space="md" alignItems="center" px="$6">
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

        {/* Sliding Deck Area */}
        <Box flex={1} mt="$6" mb="$2">
          {isLoading && discoveryProfiles.length === 0 ? (
            <Box flex={1} justifyContent="center" alignItems="center">
              <Spinner size="large" color={PRIMARY_COLOR} />
            </Box>
          ) : discoveryProfiles.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
              snapToInterval={width - 48 + 16} // Snaps exactly to the next card
              decelerationRate="fast"
            >
              {discoveryProfiles.map((profile: any, index: number) => (
                <Pressable
                  key={profile.id}
                  w={width - 48} // Takes up full screen width minus the horizontal padding
                  mr={index === discoveryProfiles.length - 1 ? 0 : 16} // Replaced 'gap' with margin right
                  borderRadius={30}
                  overflow="hidden"
                  position="relative"
                  onPress={() =>
                    router.push({
                      pathname: "/profile-detail",
                      params: { id: profile.id },
                    })
                  }
                >
                  <Image
                    source={{
                      uri:
                        profile.avatar ||
                        profile.pictures?.[0] ||
                        "https://via.placeholder.com/400",
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "absolute",
                    }}
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
                      <Text fontWeight="500" fontSize={12} color="#1D1D1D">
                        {profile.relationshipGoal || "Open to Dating"}
                      </Text>
                    </HStack>
                  </Box>

                  {/* Bottom Gradient */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 250,
                      zIndex: 5,
                    }}
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
                    <HStack space="xs" alignItems="center" mb="$2">
                      <Image
                        source={require("@/assets/images/icon-location.png")}
                        style={{ width: 16, height: 16 }}
                        contentFit="contain"
                      />
                      <Text color="#FFFFFF" fontSize={12} fontWeight="400" lineHeight={22}>
                        {profile.location || "Location Unknown"}
                      </Text>
                    </HStack>

                    <HStack space="xs" alignItems="center" mb="$3">
                      <Text color="#FFFFFF" fontSize={17} fontWeight="600" lineHeight={22}>
                        {profile.fullName?.split(" ")[0]}, {profile.age}
                      </Text>
                      {profile.isVerified && (
                        <Image
                          source={require("@/assets/images/icon-verified.png")}
                          style={{ width: 24, height: 24 }}
                          contentFit="contain"
                        />
                      )}
                    </HStack>

                    <HStack
                      space="md"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Box flex={1}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <HStack space="sm" flexWrap="nowrap" alignItems="center">
                            {(() => {
                              const displayTags = profile.interests?.length 
                                ? profile.interests 
                                : [profile.religion, profile.tribe, profile.childrenStatus].filter(Boolean);

                              return (
                                <>
                                  {displayTags.slice(0, 2).map((tag: string, idx: number) => (
                                    <Box
                                      key={idx}
                                      bg="rgba(255,255,255,0.2)"
                                      px="$3"
                                      py="$1"
                                      borderRadius="$full"
                                    >
                                      <Text
                                        color="#FFFFFF"
                                        fontSize={12}
                                        fontWeight="500"
                                        lineHeight={22}
                                      >
                                        {tag}
                                      </Text>
                                    </Box>
                                  ))}
                                  {displayTags.length > 2 && (
                                    <Box
                                      bg="rgba(255,255,255,0.2)"
                                      px="$3"
                                      py="$1"
                                      borderRadius="$full"
                                    >
                                      <Text
                                        color="#FFFFFF"
                                        fontSize={12}
                                        fontWeight="500"
                                        lineHeight={22}
                                      >
                                        +{displayTags.length - 2}
                                      </Text>
                                    </Box>
                                  )}
                                </>
                              );
                            })()}
                          </HStack>
                        </ScrollView>
                      </Box>

                      <Pressable
                        w={48}
                        h={48}
                        bg={PRIMARY_COLOR}
                        borderRadius="$full"
                        justifyContent="center"
                        alignItems="center"
                        onPress={() => {
                          const isLiked = !!likedProfiles[profile.id];
                          toggleLike(profile.id, isLiked);
                          handleInteraction(profile.id, isLiked ? "dislike" : "like");
                        }}
                      >
                        <Ionicons
                          name={likedProfiles[profile.id] ? "heart" : "heart-outline"}
                          size={24}
                          color="#FFFFFF"
                        />
                      </Pressable>
                    </HStack>
                  </VStack>
                </Pressable>
              ))}
            </ScrollView>
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
