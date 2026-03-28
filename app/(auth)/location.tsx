import { OnboardingHeader } from "@/components/ui/onboarding-header";
import {
  Box,
  Button,
  ButtonText,
  Divider,
  HStack,
  Input,
  InputField,
  InputSlot,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LocationScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <OnboardingHeader progress={25} />

      <VStack flex={1} px="$6" pt="$6">
        <Text size="2xl" fontWeight="$bold" color="$textLight900">
          Your Location
        </Text>
        <Text size="md" color="$textLight600" mt="$1">
          Where are you based?
        </Text>

        <Input
          size="xl"
          variant="outline"
          borderRadius="$full"
          mt="$6"
          borderColor="#E86673"
        >
          <InputSlot pl="$4">
            <Text>🔍</Text>
          </InputSlot>
          <InputField placeholder="Lagos" />
        </Input>

        <HStack alignItems="center" mt="$6" space="md">
          <Text color="#E86673" size="lg">
            📍
          </Text>
          <Text color="#E86673" fontWeight="$bold" size="md">
            Use your current location
          </Text>
        </HStack>

        <Divider mt="$4" mb="$4" />

        {/* Mock Location List */}
        <VStack space="lg">
          {["Ikorodu", "Victoria Island", "Yaba", "Mushin"].map((area, i) => (
            <HStack key={i} space="md" alignItems="center">
              <Text color="#E86673" size="lg">
                📍
              </Text>
              <VStack>
                <Text fontWeight="$medium" color="$textLight900">
                  Lagos
                </Text>
                <Text color="$textLight500" size="sm">
                  {area}, Lagos, Nigeria
                </Text>
              </VStack>
            </HStack>
          ))}
        </VStack>

        {/* Absolute positioned continue button at bottom */}
        <Box position="absolute" bottom={32} left={24} right={24}>
          <Button
            size="xl"
            bg="#E86673"
            borderRadius="$full"
            onPress={() => router.push("/birth-details")}
          >
            <ButtonText fontWeight="$bold">Continue</ButtonText>
          </Button>
        </Box>
      </VStack>
    </SafeAreaView>
  );
}
