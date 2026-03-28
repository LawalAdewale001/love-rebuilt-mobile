import { Box, HStack, Pressable, Text } from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Mock images array
const IMAGES = [
  require("@/assets/images/react-logo.png"), // Image 1
  require("@/assets/images/react-logo.png"), // Image 2
  require("@/assets/images/react-logo.png"), // Image 3
];

export default function ProfileGalleryScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Simple tap-to-advance gallery logic
  const handleNext = () => {
    if (currentIndex < IMAGES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Fixed Top Header */}
      <Box
        px="$6"
        py="$4"
        position="relative"
        justifyContent="center"
        alignItems="center"
        zIndex={10}
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
          <Text size="sm" color="#1A1A1A" fontWeight="bold">
            {"<"}
          </Text>
        </Pressable>
        <Text size="xl" fontWeight="$bold" color="$textLight900">
          Patricia Gallery
        </Text>
      </Box>

      {/* Main Image Area */}
      <Box flex={1} px="$6" pb="$8" position="relative">
        <Box flex={1} borderRadius={20} overflow="hidden">
          <Image
            source={IMAGES[currentIndex]}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        </Box>

        {/* Invisible Tap Zones for Navigation */}
        <Pressable
          position="absolute"
          top={0}
          bottom={0}
          left={0}
          w={width / 2}
          onPress={handlePrev}
        />
        <Pressable
          position="absolute"
          top={0}
          bottom={0}
          right={0}
          w={width / 2}
          onPress={handleNext}
        />

        {/* Pagination Dots */}
        <HStack
          position="absolute"
          bottom={45}
          left={0}
          right={0}
          justifyContent="center"
          space="sm"
          pointerEvents="none"
        >
          {IMAGES.map((_, idx) => (
            <Box
              key={idx}
              w={8}
              h={8}
              borderRadius="$full"
              bg={idx === currentIndex ? "#E86673" : "transparent"}
              borderWidth={1}
              borderColor="#E86673"
            />
          ))}
        </HStack>
      </Box>
    </SafeAreaView>
  );
}
