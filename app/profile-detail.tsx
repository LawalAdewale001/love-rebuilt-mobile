import { PRIMARY_COLOR } from "@/constants/theme";
import { useUserProfileByIdQuery, useRecordInteractionMutation, useLikedProfiles } from "@/lib/queries";
import { showToast } from "@/components/ui/toast";
import {
  Box,
  Button,
  ButtonText,
  HStack,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

const TagPill = ({ text }: { text: string }) => (
  <Box bg="#F7F5F4" px="$4" py="$2" borderRadius="$full">
    <Text size="sm" color="$textLight900" fontWeight="$medium">
      {text}
    </Text>
  </Box>
);

export default function ProfileDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>(); // Grab ID from router params

  const { likedProfiles, toggleLike } = useLikedProfiles();
  const isLiked = !!likedProfiles[id || ""];
  const interactionMutation = useRecordInteractionMutation();

  const handleInteraction = (targetUserId: string, type: "like" | "dislike") => {
    interactionMutation.mutate(
      {
        receiverId: targetUserId,
        type,
      },
      {
        onSuccess: () => {
          showToast("success", type === "like" ? "Liked!" : "Unliked", "");
        },
        onError: (err: any) => {
          showToast("error", "Error", err?.message || "Failed to record interaction");
        },
      }
    );
  };

  // Fetch user data based on the ID
  const { data: profile, isLoading, error } = useUserProfileByIdQuery(id || "");

  if (isLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spinner size="large" color={PRIMARY_COLOR} />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text color="$textLight500">Profile not found.</Text>
        <Button mt="$4" onPress={() => router.back()}>
          <ButtonText>Go Back</ButtonText>
        </Button>
      </SafeAreaView>
    );
  }

  // Calculate age safely from DOB
  const age = profile.dob
    ? new Date().getFullYear() - new Date(profile.dob).getFullYear()
    : "?";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Header */}
      <Box
        px="$6"
        py="$4"
        position="relative"
        justifyContent="center"
        alignItems="center"
      >
        <Pressable
          position="absolute"
          left={24}
          onPress={() => router.back()}
          p="$2"
          borderWidth={1}
          borderColor="$borderLight300"
          borderRadius="$full"
          w={36}
          h={36}
          justifyContent="center"
          alignItems="center"
        >
          <Image
            source={require("@/assets/images/ArrowLeft.png")}
            style={{ width: 16, height: 16 }}
            contentFit="contain"
          />
        </Pressable>
        <HStack alignItems="center" space="xs">
          <Text size="xl" fontWeight="$bold" color="$textLight900">
            {profile.fullName?.split(" ")[0]}, {age}
          </Text>
          {profile.isVerified && (
            <Image
              source={require("@/assets/images/icon-verified.png")}
              style={{ width: 20, height: 20 }}
              contentFit="contain"
            />
          )}
        </HStack>
      </Box>

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack px="$6" pb="$10" pt="$2" space="2xl">
          {/* Hero Image Section */}
          <Box
            h={400}
            w="100%"
            borderRadius={30}
            overflow="hidden"
            position="relative"
          >
            <Image
              source={{
                uri:
                  profile.avatar ||
                  profile.pictures?.[0] ||
                  "https://via.placeholder.com/400",
              }}
              style={{ width: "100%", height: "100%", position: "absolute" }}
              contentFit="cover"
            />

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

            <Box
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              h={200}
              bg="$black"
              opacity={0.6}
              zIndex={5}
            />

            <VStack
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              pb="$6"
              px="$6"
              zIndex={10}
            >
              <HStack space="xs" alignItems="center" mb="$1">
                <Image
                  source={require("@/assets/images/icon-location.png")}
                  style={{ width: 16, height: 16 }}
                  contentFit="contain"
                />
                <Text color="#FFFFFF" fontSize={12} fontWeight="400" lineHeight={22}>
                  {profile.location || "Unknown Location"}
                </Text>
              </HStack>

              <HStack space="xs" alignItems="center" mb="$3">
                <Text color="#FFFFFF" fontSize={17} fontWeight="600" lineHeight={22}>
                  {profile.fullName}, {age}
                </Text>
                {profile.isVerified && (
                  <Image
                    source={require("@/assets/images/icon-verified.png")}
                    style={{ width: 24, height: 24 }}
                    contentFit="contain"
                  />
                )}
              </HStack>

              <HStack space="md" alignItems="center" justifyContent="space-between">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                  <HStack space="sm" flexWrap="nowrap" flex={1} alignItems="center">
                    {profile.interests?.slice(0, 2).map((tag: string, idx: number) => (
                      <Box
                        key={idx}
                        bg="rgba(255,255,255,0.2)"
                        px="$4"
                        py="$2"
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
                    {profile.interests && profile.interests.length > 2 && (
                      <Box
                        bg="rgba(255,255,255,0.2)"
                        px="$4"
                        py="$2"
                        borderRadius="$full"
                      >
                        <Text
                          color="#FFFFFF"
                          fontSize={12}
                          fontWeight="500"
                          lineHeight={22}
                        >
                          +{profile.interests.length - 2}
                        </Text>
                      </Box>
                    )}
                  </HStack>
                </ScrollView>

                {/* Like button in profile detail hero section (Matches screenshot 2) */}
                <Pressable
                  w={56}
                  h={56}
                  bg={PRIMARY_COLOR}
                  borderRadius="$full"
                  justifyContent="center"
                  alignItems="center"
                  ml="$2"
                  onPress={() => {
                    toggleLike(profile.id, isLiked);
                    handleInteraction(profile.id, !isLiked ? "like" : "dislike");
                  }}
                >
                  <Ionicons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={24}
                    color="#FFFFFF"
                  />
                </Pressable>
              </HStack>
            </VStack>
          </Box>

          {/* About Me */}
          {/* Assuming you mapped 'bio' or 'about' in your backend. Adjust if needed. */}
          <VStack space="xs">
            <Text size="lg" fontWeight="$bold" color="$textLight900">
              About Me
            </Text>
            <Text size="md" color="$textLight500" lineHeight="$md">
              {(profile as any).bio || "This user hasn't added a bio yet."}
            </Text>
          </VStack>

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <VStack space="sm">
              <Text size="lg" fontWeight="$bold" color="$textLight900">
                Interests
              </Text>
              <HStack space="sm" flexWrap="wrap" gap={8}>
                {profile.interests.map((item) => (
                  <TagPill key={item} text={item} />
                ))}
              </HStack>
            </VStack>
          )}

          {/* More About Me */}
          <VStack space="sm">
            <Text size="lg" fontWeight="$bold" color="$textLight900">
              More About Me
            </Text>
            <HStack space="sm" flexWrap="wrap" gap={8}>
              {profile.religion && <TagPill text={profile.religion} />}
              {profile.tribe && <TagPill text={profile.tribe} />}
              {profile.identity && <TagPill text={profile.identity} />}
            </HStack>
          </VStack>
        </VStack>
      </ScrollView>

      {/* Bottom Action Button */}
      <Box
        px="$6"
        pt="$4"
        pb="$8"
        bg="#FFFFFF"
        borderTopWidth={1}
        borderTopColor="$borderLight50"
      >
        <Button
          size="xl"
          bg={PRIMARY_COLOR}
          borderRadius="$full"
          onPress={() => {
            // Direct them to the chat conversation screen!
            router.push({
              pathname: "/chat-conversation",
              params: {
                name: profile.fullName,
                recipientId: profile.id,
                avatar: profile.avatar || "",
              },
            });
          }}
        >
          <ButtonText fontWeight="$bold">
            Send {profile.fullName?.split(" ")[0]} a Message
          </ButtonText>
        </Button>
      </Box>
    </SafeAreaView>
  );
}
