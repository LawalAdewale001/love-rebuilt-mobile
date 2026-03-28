import { Box, Button, ButtonText, Text, VStack } from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CourseCompletedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#E86673" }}>
      <VStack
        flex={1}
        px="$6"
        justifyContent="center"
        alignItems="center"
        space="3xl"
      >
        {/* Graphic */}
        <Box w={250} h={180} justifyContent="center" alignItems="center">
          {/* Export the textured double-heart graphic from Figma and link it here */}
          <Image
            source={require("@/assets/images/react-logo.png")}
            style={{ width: "100%", height: "100%" }}
            contentFit="contain"
          />
        </Box>

        {/* Text Content */}
        <VStack space="sm" alignItems="center" mt="$4">
          <Text size="xl" fontWeight="$bold" color="#FFFFFF">
            Course Completed
          </Text>
          <Text
            size="md"
            color="#FFFFFF"
            textAlign="center"
            lineHeight="$lg"
            px="$4"
          >
            Congrats, Abiodun! You've completed "How to Heal" and have new
            matches
          </Text>
        </VStack>
      </VStack>

      {/* Bottom Button */}
      <Box px="$6" pb="$8" pt="$4">
        <Button
          w="100%"
          size="xl"
          bg="#FFFFFF"
          borderRadius="$full"
          // Replace routes back to matches so they can't swipe back to the completion screen
          onPress={() => router.replace("/(tabs)/matches")}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <ButtonText fontWeight="$bold" color="#1A1A1A">
            Check Matches
          </ButtonText>
        </Button>
      </Box>
    </SafeAreaView>
  );
}
