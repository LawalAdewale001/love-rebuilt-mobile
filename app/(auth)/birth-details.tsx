import { OnboardingHeader } from "@/components/ui/onboarding-header";
import { showToast } from "@/components/ui/toast";
import { useUpdateProfileMutation } from "@/lib/queries";
import {
  Box,
  Button,
  ButtonSpinner,
  ButtonText,
  HStack,
  Input,
  InputField,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BirthDetailsScreen() {
  const router = useRouter();
  const updateMutation = useUpdateProfileMutation();

  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const isComplete = day.length > 0 && month.length > 0 && year.length === 4;

  const handleContinue = () => {
    if (!isComplete) return;

    try {
      const dobDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
      );
      const dobString = dobDate.toISOString();

      updateMutation.mutate(
        { dob: dobString },
        {
          onSuccess: () => router.push("/gender"),
          onError: (err: any) =>
            showToast(
              "error",
              "Error",
              err?.message || "Failed to save date of birth",
            ),
        },
      );
    } catch (error) {
      showToast("error", "Invalid Date", "Please enter a valid date of birth.");
    }
  };

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
          {/* DAY INPUT */}
          <Box flex={1}>
            <Input
              size="xl"
              variant="outline"
              borderRadius="$xl"
              bg="#F7F5F4"
              borderWidth={1}
              borderColor="$borderLight900"
              h={65} // <-- Explicitly making the input box taller
            >
              <VStack pl="$4" flex={1} justifyContent="center" pb="$1">
                <Text size="xs" color="$textLight500" mt="$1">
                  Day
                </Text>
                <InputField
                  p={0}
                  flex={1} // <-- Letting the input naturally fill the remaining space
                  value={day}
                  onChangeText={setDay}
                  keyboardType="numeric"
                  maxLength={2}
                  fontWeight="$bold"
                  size="md"
                  placeholder="DD"
                  color="$textLight900"
                />
              </VStack>
            </Input>
          </Box>

          {/* MONTH INPUT */}
          <Box flex={1}>
            <Input
              size="xl"
              variant="outline"
              borderRadius="$xl"
              bg="#F7F5F4"
              borderWidth={1}
              borderColor="$borderLight900"
              h={65}
            >
              <VStack pl="$4" flex={1} justifyContent="center" pb="$1">
                <Text size="xs" color="$textLight500" mt="$1">
                  Month
                </Text>
                <InputField
                  p={0}
                  flex={1}
                  value={month}
                  onChangeText={setMonth}
                  keyboardType="numeric"
                  maxLength={2}
                  fontWeight="$bold"
                  size="md"
                  placeholder="MM"
                  color="$textLight900"
                />
              </VStack>
            </Input>
          </Box>

          {/* YEAR INPUT */}
          <Box flex={1.2}>
            <Input
              size="xl"
              variant="outline"
              borderRadius="$xl"
              bg="#F7F5F4"
              borderWidth={1}
              borderColor="$borderLight900"
              h={65}
            >
              <VStack pl="$4" flex={1} justifyContent="center" pb="$1">
                <Text size="xs" color="$textLight500" mt="$1">
                  Year
                </Text>
                <InputField
                  p={0}
                  flex={1}
                  value={year}
                  onChangeText={setYear}
                  keyboardType="numeric"
                  maxLength={4}
                  fontWeight="$bold"
                  size="md"
                  placeholder="YYYY"
                  color="$textLight900"
                />
              </VStack>
            </Input>
          </Box>
        </HStack>

        <Box flex={1} justifyContent="flex-end" alignItems="center" pb="$8">
          <HStack
            position="absolute"
            bottom={-80}
            left={-10}
            right={-10}
            justifyContent="space-between"
            alignItems="flex-end"
            zIndex={-1}
            pointerEvents="none"
          >
            <Image
              source={require("@/assets/images/candles-graphic1.png")}
              style={{ width: 186.3, height: 513.86 }}
              contentFit="contain"
            />
            <Image
              source={require("@/assets/images/candles-graphic.png")}
              style={{ width: 186.3, height: 513.86 }}
              contentFit="contain"
            />
          </HStack>

          <Button
            w="100%"
            size="xl"
            bg="#FFFFFF"
            borderRadius="$full"
            mt="auto"
            disabled={!isComplete || updateMutation.isPending}
            onPress={handleContinue}
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
            {updateMutation.isPending ? (
              <ButtonSpinner color="#1A1A1A" />
            ) : (
              <ButtonText fontWeight="$bold" color="#1A1A1A">
                Continue
              </ButtonText>
            )}
          </Button>
        </Box>
      </VStack>
    </SafeAreaView>
  );
}
