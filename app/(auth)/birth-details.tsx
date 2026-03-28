import { OnboardingHeader } from "@/components/ui/onboarding-header";
import {
  Box,
  Button,
  ButtonText,
  HStack,
  Input,
  InputField,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BirthDetailsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <OnboardingHeader progress={75} />

      <VStack flex={1} px="$6" pt="$6">
        <Text size="2xl" fontWeight="$bold" color="$textLight900">
          Let's Know your Birth Details
        </Text>
        <Text size="md" color="$textLight600" mt="$1" pr="$10">
          Setting your age will bring matches suitable for you.
        </Text>

        <HStack space="md" mt="$8" justifyContent="space-between">
          <Box flex={1}>
            <Input
              size="xl"
              variant="outline"
              borderRadius="$xl"
              bg="#F7F5F4"
              borderWidth={1}
              borderColor="$borderLight900"
            >
              <VStack pl="$4" py="$2" justifyContent="center">
                <Text size="xs" color="$textLight500">
                  Day
                </Text>
                <InputField
                  p={0}
                  h={24}
                  value="07"
                  fontWeight="$bold"
                  size="lg"
                />
              </VStack>
            </Input>
          </Box>
          <Box flex={1}>
            <Input
              size="xl"
              variant="outline"
              borderRadius="$xl"
              bg="#F7F5F4"
              borderWidth={1}
              borderColor="$borderLight900"
            >
              <VStack pl="$4" py="$2" justifyContent="center">
                <Text size="xs" color="$textLight500">
                  Month
                </Text>
                <InputField
                  p={0}
                  h={24}
                  value="05"
                  fontWeight="$bold"
                  size="lg"
                />
              </VStack>
            </Input>
          </Box>
          <Box flex={1.2}>
            <Input
              size="xl"
              variant="outline"
              borderRadius="$xl"
              bg="#F7F5F4"
              borderWidth={1}
              borderColor="$borderLight900"
            >
              <VStack pl="$4" py="$2" justifyContent="center">
                <Text size="xs" color="$textLight500">
                  Year
                </Text>
                <InputField
                  p={0}
                  h={24}
                  value="1907"
                  fontWeight="$bold"
                  size="lg"
                />
              </VStack>
            </Input>
          </Box>
        </HStack>

        <Box
          flex={1}
          justifyContent="flex-end"
          alignItems="center"
          pb="$8"
          // Removed flexDirection="row" from here so the button spans full width properly
        >
          {/* Candles Container - Placed absolutely behind the button */}
          <HStack
            position="absolute"
            bottom={-80} // Adjusted from -50 to bring them up further on the screen
            left={-10} // Slight negative margin ensures they fill the edges nicely
            right={-10}
            justifyContent="space-between" // Spaces the two images evenly
            alignItems="flex-end"
            zIndex={-1} // Crucial: Keeps images behind the button
            pointerEvents="none" // Ensures images don't accidentally block button taps
          >
            <Image
              source={require("@/assets/images/candles-graphic1.png")}
              style={{ width: 186.3, height: 513.86 }} // Exact Figma specs
              contentFit="contain"
            />
            <Image
              source={require("@/assets/images/candles-graphic.png")}
              style={{ width: 186.3, height: 513.86 }} // Exact Figma specs
              contentFit="contain"
            />
          </HStack>

          <Button
            w="100%"
            size="xl"
            bg="#FFFFFF"
            borderRadius="$full"
            mt="auto"
            onPress={() => router.push("/gender")}
            // Added a subtle shadow so the white button pops clearly over the busy candle graphics
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
              position: "absolute",
              bottom: "5%",
            }}
          >
            <ButtonText fontWeight="$bold" color="#1A1A1A">
              Continue
            </ButtonText>
          </Button>
        </Box>
      </VStack>
    </SafeAreaView>
  );
}
