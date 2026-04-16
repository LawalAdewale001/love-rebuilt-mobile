import { showToast } from "@/components/ui/toast";
import { useCompleteMiniCourseMutation } from "@/lib/queries";
import { Ionicons } from "@expo/vector-icons";
import {
  Box,
  Button,
  ButtonSpinner,
  ButtonText,
  Pressable,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { ResizeMode, Video } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VideoPlayerScreen() {
  const router = useRouter();

  // Extract data directly from navigation parameters to bypass the API call
  const { id, videoUrl, title, description } = useLocalSearchParams<{
    id: string;
    videoUrl: string;
    title: string;
    description: string;
  }>();

  const videoRef = useRef<Video>(null);
  const completeMutation = useCompleteMiniCourseMutation();
  const [hasFinished, setHasFinished] = useState(false);

  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.didJustFinish && !hasFinished) {
      setHasFinished(true);
    }
  };

  const handleComplete = () => {
    if (!id) return;

    completeMutation.mutate(id, {
      onSuccess: () => {
        router.replace("/course-completed");
      },
      onError: (err: any) => {
        showToast(
          "error",
          "Error",
          err?.message || "Could not mark as complete",
        );
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Header / Back Button */}
      <Box px="$6" py="$4" flexDirection="row" alignItems="center">
        <Pressable onPress={() => router.back()} p="$2" ml="-$2">
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
        <Text
          color="#FFFFFF"
          fontWeight="$bold"
          size="lg"
          ml="$2"
          numberOfLines={1}
          flex={1}
        >
          {title || "Course"}
        </Text>
      </Box>

      {/* Video Player Area */}
      <Box flex={1} justifyContent="center" bg="#1A1A1A">
        {videoUrl ? (
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={{ width: "100%", height: 300 }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
        ) : (
          <Text color="$textLight400" textAlign="center">
            Video URL not found
          </Text>
        )}
      </Box>

      {/* Details & Complete Button */}
      <VStack
        bg="#FFFFFF"
        p="$6"
        borderTopLeftRadius="$3xl"
        borderTopRightRadius="$3xl"
        space="md"
      >
        <Text size="xl" fontWeight="$bold" color="$textLight900">
          {title || "No Title"}
        </Text>
        <Text color="$textLight500" size="md">
          {description || "No description provided."}
        </Text>

        <Button
          w="100%"
          size="xl"
          bg={hasFinished ? "#E86673" : "#F4F3F2"}
          borderRadius="$full"
          mt="$6"
          disabled={!hasFinished || completeMutation.isPending}
          onPress={handleComplete}
        >
          {completeMutation.isPending ? (
            <ButtonSpinner color="#FFFFFF" />
          ) : (
            <ButtonText
              fontWeight="$bold"
              color={hasFinished ? "#FFFFFF" : "$textLight400"}
            >
              {hasFinished ? "Mark as Completed" : "Watch to Complete"}
            </ButtonText>
          )}
        </Button>
      </VStack>
    </SafeAreaView>
  );
}
