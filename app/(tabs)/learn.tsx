import {
    Box,
    Pressable,
    ScrollView,
    Text,
    VStack
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

// Mock Data Structure
const LEARN_CATEGORIES = [
  {
    title: "Faith Love",
    videos: [
      {
        id: 1,
        title: "How to Heal",
        duration: "50mins",
        image: require("@/assets/images/react-logo.png"),
      },
      {
        id: 2,
        title: "Trust Again",
        duration: "45mins",
        image: require("@/assets/images/react-logo.png"),
      },
    ],
  },
  {
    title: "Acts of Staying",
    videos: [
      {
        id: 3,
        title: "How to Heal",
        duration: "50mins",
        image: require("@/assets/images/react-logo.png"),
      },
      {
        id: 4,
        title: "Communication",
        duration: "30mins",
        image: require("@/assets/images/react-logo.png"),
      },
    ],
  },
  {
    title: "Building Love",
    videos: [
      {
        id: 5,
        title: "How to Heal",
        duration: "50mins",
        image: require("@/assets/images/react-logo.png"),
      },
      {
        id: 6,
        title: "Growing Together",
        duration: "60mins",
        image: require("@/assets/images/react-logo.png"),
      },
    ],
  },
];

export default function LearnScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Header */}
      <Box px="$6" py="$2" alignItems="center" justifyContent="center">
        <Text size="xl" fontWeight="$bold" color="$textLight900">
          Learn
        </Text>
      </Box>

      <ScrollView
        flex={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <VStack space="2xl" mt="$4">
          {LEARN_CATEGORIES.map((category, index) => (
            <VStack key={index} space="md">
              {/* Category Title */}
              <Text
                px="$6"
                size="md"
                fontWeight="$medium"
                color="$textLight500"
              >
                {category.title}
              </Text>

              {/* Horizontal Video Carousel */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
              >
                {category.videos.map((video) => (
                  <Pressable
                    key={video.id}
                    w={160}
                    h={200}
                    borderRadius="$2xl"
                    overflow="hidden"
                    position="relative"
                    onPress={() => router.push("/video-player")}
                  >
                    <Image
                      source={video.image}
                      style={{
                        width: "100%",
                        height: "100%",
                        position: "absolute",
                      }}
                      contentFit="cover"
                    />

                    {/* Gradient Overlay */}
                    <Box
                      position="absolute"
                      bottom={0}
                      left={0}
                      right={0}
                      h="60%"
                      bg="$black"
                      opacity={0.6}
                    />

                    {/* Play Icon Centered */}
                    <Box
                      position="absolute"
                      top={0}
                      bottom={0}
                      left={0}
                      right={0}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Box
                        w={40}
                        h={40}
                        bg="rgba(255,255,255,0.3)"
                        borderRadius="$full"
                        justifyContent="center"
                        alignItems="center"
                        pl="$1"
                      >
                        <Text color="#FFFFFF" size="lg">
                          ▶
                        </Text>
                      </Box>
                    </Box>

                    {/* Bottom Text */}
                    <VStack
                      position="absolute"
                      bottom={16}
                      left={16}
                      zIndex={10}
                    >
                      <Text color="#FFFFFF" fontWeight="$bold" size="md">
                        {video.title}
                      </Text>
                      <Text color="$textLight300" size="xs">
                        {video.duration}
                      </Text>
                    </VStack>
                  </Pressable>
                ))}
              </ScrollView>
            </VStack>
          ))}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
