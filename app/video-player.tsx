import { Box, HStack, Pressable, Text, VStack } from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VideoPlayerScreen() {
  const router = useRouter();

  return (
    <Box flex={1} bg="#000000">
      {/* Full Screen Background Image / Video Thumbnail */}
      <Image
        source={require("@/assets/images/react-logo.png")} // Replace with the glowing heart hands graphic
        style={{ width: "100%", height: "100%", position: "absolute" }}
        contentFit="cover"
      />

      {/* Dark overlay to make text pop */}
      <Box
        position="absolute"
        top={0}
        bottom={0}
        left={0}
        right={0}
        bg="$black"
        opacity={0.3}
      />

      <SafeAreaView style={{ flex: 1, justifyContent: "space-between" }}>
        {/* Top Header */}
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
            w={36}
            h={36}
            borderRadius="$full"
            borderWidth={1}
            borderColor="#FFFFFF"
            justifyContent="center"
            alignItems="center"
          >
            <Text size="sm" color="#FFFFFF" fontWeight="bold">
              {"<"}
            </Text>
          </Pressable>
          <Text size="xl" fontWeight="$bold" color="#FFFFFF">
            How to Heal
          </Text>
        </Box>

        {/* Bottom Controls Area */}
        <VStack px="$6" pb="$8" space="lg">
          {/* Media Buttons */}
          <HStack
            justifyContent="center"
            alignItems="center"
            space="3xl"
            mb="$4"
          >
            <Pressable>
              <Text color="#FFFFFF" size="3xl">
                ⏮
              </Text>
            </Pressable>

            <Pressable
              w={64}
              h={64}
              borderRadius="$full"
              borderWidth={1}
              borderColor="#FFFFFF"
              justifyContent="center"
              alignItems="center"
            >
              <Text color="#FFFFFF" size="3xl">
                ▶
              </Text>
            </Pressable>

            <Pressable onPress={() => router.replace("/course-completed")}>
              <Text color="#FFFFFF" size="3xl">
                ⏭
              </Text>
            </Pressable>
          </HStack>

          {/* Progress Bar */}
          <VStack space="xs">
            <Box
              h={6}
              bg="rgba(255,255,255,0.3)"
              borderRadius="$full"
              w="100%"
              overflow="hidden"
            >
              <Box h="100%" w="15%" bg="#E86673" borderRadius="$full" />
            </Box>
            <HStack justifyContent="space-between">
              <Text color="#FFFFFF" size="xs">
                00:03
              </Text>
              <Text color="#FFFFFF" size="xs">
                03:23
              </Text>
            </HStack>
          </VStack>
        </VStack>
      </SafeAreaView>
    </Box>
  );
}
