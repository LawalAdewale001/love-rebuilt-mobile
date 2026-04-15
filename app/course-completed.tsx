import { Box, Button, ButtonText, Text, VStack } from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CourseCompletedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <VStack
        flex={1}
        px="$6"
        justifyContent="center"
        alignItems="center"
        space="2xl"
      >
        {/* Success Graphic */}
        <Box
          w={200}
          h={200}
          bg="#FFF9FA"
          borderRadius="$full"
          justifyContent="center"
          alignItems="center"
          mb="$4"
        >
          <Image
            source={require("@/assets/images/candles-graphic.png")} // Fallback to an existing asset, replace with a trophy or checkmark if you have one
            style={{ width: 120, height: 120 }}
            contentFit="contain"
          />
        </Box>

        <VStack space="sm" alignItems="center">
          <Text
            size="3xl"
            fontWeight="$bold"
            color="$textLight900"
            textAlign="center"
          >
            Congratulations!
          </Text>
          <Text size="md" color="$textLight600" textAlign="center" px="$4">
            You've successfully completed this course. Keep up the great work on
            your journey!
          </Text>
        </VStack>

        <Box w="100%" mt="$8">
          <Button
            w="100%"
            size="xl"
            bg="#E86673"
            borderRadius="$full"
            onPress={() => router.replace("/(tabs)/learn")}
          >
            <ButtonText fontWeight="$bold" color="#FFFFFF">
              Back to Courses
            </ButtonText>
          </Button>
        </Box>
      </VStack>
    </SafeAreaView>
  );
}
