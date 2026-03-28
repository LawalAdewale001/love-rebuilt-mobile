import {
  Box,
  Button,
  ButtonText,
  HStack,
  Pressable,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerifyEmailScreen() {
  const router = useRouter();
  // Mocking OTP state for UI purposes
  const otp = ["6", "5", "4", "7", "1"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* <OnboardingHeader progress={25} /> */}

      <VStack flex={1} px="$6" pt="$6" justifyContent="space-between" pb="$8">
        <Box>
          <Text size="2xl" fontWeight="$bold" color="$textLight900">
            Let's Verify your Mail
          </Text>
          <Text size="md" color="$textLight600" mt="$1">
            Enter the 5 digits sent to abiodun@gmail.com
          </Text>

          <HStack space="md" mt="$8" justifyContent="space-between">
            {otp.map((digit, index) => (
              <Box
                key={index}
                w={56}
                h={64}
                bg="#F7F5F4"
                borderRadius="$xl"
                borderWidth={1}
                borderColor="$borderLight300"
                justifyContent="center"
                alignItems="center"
              >
                <Text size="2xl" fontWeight="$bold">
                  {digit}
                </Text>
              </Box>
            ))}
          </HStack>
        </Box>

        <VStack space="lg" alignItems="center">
          <Text fontWeight="$bold" size="lg">
            00:56
          </Text>
          <HStack>
            <Text color="$textLight600">Didn't get code? </Text>
            <Pressable>
              <Text color="#E86673" fontWeight="$bold">
                Resend Code
              </Text>
            </Pressable>
          </HStack>

          <Button
            w="100%"
            size="xl"
            bg="#E86673"
            borderRadius="$full"
            onPress={() => router.push("/location")}
          >
            <ButtonText fontWeight="$bold">Continue</ButtonText>
          </Button>
        </VStack>
      </VStack>
    </SafeAreaView>
  );
}
