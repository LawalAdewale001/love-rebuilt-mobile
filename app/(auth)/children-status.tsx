import { IconSymbol } from "@/components/ui/icon-symbol";
import { OnboardingHeader } from "@/components/ui/onboarding-header";
import { showToast } from "@/components/ui/toast";
import { useUpdateProfileMutation } from "@/lib/queries";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
  Box,
  Button,
  ButtonSpinner,
  ButtonText,
  Divider,
  Input,
  InputField,
  InputSlot,
  Pressable,
  ScrollView,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const STATUS_OPTIONS = ["No, I don't have children", "Yes, I have children"];
const COUNT_OPTIONS = ["1", "2", "3", "4", "5 or more"];
const LOCATION_OPTIONS = [
  "They live with me",
  "Shared custody (sometimes with me)",
  "They live with their other parent",
  "They live with grandparents/family",
  "Boarding school",
  "Mixed arrangement",
];
const AGE_OPTIONS = [
  "0–2 years (Infant/Toddler)",
  "3–5 years (Preschool)",
  "6–12 years (Primary school)",
  "13–17 years (Teenager)",
  "18+ (Adult)",
];

type SheetType = "status" | "count" | "location" | "age" | null;

export default function ChildrenStatusScreen() {
  const router = useRouter();
  const updateMutation = useUpdateProfileMutation();
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);

  const [status, setStatus] = useState<string | null>(null);
  const [count, setCount] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [age, setAge] = useState<string | null>(null);

  const hasChildren = status === "Yes, I have children";
  const isComplete = hasChildren
    ? count && location && age
    : status === "No, I don't have children";

  const handleSelect = (value: string) => {
    if (activeSheet === "status") {
      setStatus(value);
      if (value === "No, I don't have children") {
        setCount(null);
        setLocation(null);
        setAge(null);
      }
    }
    if (activeSheet === "count") setCount(value);
    if (activeSheet === "location") setLocation(value);
    if (activeSheet === "age") setAge(value);

    setActiveSheet(null);
  };

  const handleContinue = () => {
    if (!isComplete) return;

    // Map the string selections to the required UserProfile types from your query definitions
    const payload = {
      hasChildren,
      childrenCount: count ? parseInt(count.split(" ")[0]) : 0, // Gets the number out of "5 or more" safely
      childrenStay: location || "",
      childrenAgeRangeInYears: age || "",
    };

    updateMutation.mutate(payload, {
      onSuccess: () => router.push("/gallery"),
      onError: (err: any) =>
        showToast("error", "Error", err?.message || "Failed to save status"),
    });
  };

  const currentOptions =
    activeSheet === "status"
      ? STATUS_OPTIONS
      : activeSheet === "count"
        ? COUNT_OPTIONS
        : activeSheet === "location"
          ? LOCATION_OPTIONS
          : activeSheet === "age"
            ? AGE_OPTIONS
            : [];

  const currentTitle =
    activeSheet === "status"
      ? "Do you have children?"
      : activeSheet === "count"
        ? "How many children do you have?"
        : activeSheet === "location"
          ? "Where do your children currently live?"
          : activeSheet === "age"
            ? "Children's Age"
            : "";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <OnboardingHeader progress={98} />

      <VStack flex={1} px="$6" pt="$6">
        <Text size="2xl" fontWeight="$bold" color="$textLight900">
          Whats is your Children Status
        </Text>
        <Text size="md" color="$textLight600" mt="$1">
          We use this to personalize your dashboard view
        </Text>

        <ScrollView flex={1} showsVerticalScrollIndicator={false} mt="$8">
          <VStack space="md" pb="$10">
            <Pressable onPress={() => setActiveSheet("status")}>
              <Input
                size="xl"
                variant="outline"
                borderRadius="$xl"
                bg={status ? "#FFFFFF" : "#F7F5F4"}
                borderWidth={1}
                borderColor={status ? "#1A1A1A" : "$borderLight300"}
                isReadOnly
              >
                {status && (
                  <Text
                    position="absolute"
                    top={6}
                    left={16}
                    size="xs"
                    color="$textLight500"
                  >
                    Select your children status
                  </Text>
                )}
                <InputField
                  value={status || ""}
                  placeholder="Select your children status"
                  placeholderTextColor="$textLight400"
                  color="$textLight900"
                  pointerEvents="none"
                  pt={status ? "$4" : "$0"}
                />
                <InputSlot pr="$4">
                  <Box>
                    <IconSymbol
                      name="chevron.right"
                      size={20}
                      color="#1A1A1A"
                      style={{ transform: [{ rotate: "90deg" }] }}
                    />
                  </Box>
                </InputSlot>
              </Input>
            </Pressable>

            {hasChildren && (
              <Pressable onPress={() => setActiveSheet("count")}>
                <Input
                  size="xl"
                  variant="outline"
                  borderRadius="$xl"
                  bg={count ? "#FFFFFF" : "#F7F5F4"}
                  borderWidth={1}
                  borderColor={count ? "#1A1A1A" : "$borderLight300"}
                  isReadOnly
                >
                  {count && (
                    <Text
                      position="absolute"
                      top={6}
                      left={16}
                      size="xs"
                      color="$textLight500"
                    >
                      How many children do you have?
                    </Text>
                  )}
                  <InputField
                    value={count || ""}
                    placeholder="How many children do you have?"
                    placeholderTextColor="$textLight400"
                    color="$textLight900"
                    pointerEvents="none"
                    pt={count ? "$4" : "$0"}
                  />
                  <InputSlot pr="$4">
                    <Box>
                      <IconSymbol
                        name="chevron.right"
                        size={20}
                        color="#1A1A1A"
                        style={{ transform: [{ rotate: "90deg" }] }}
                      />
                    </Box>
                  </InputSlot>
                </Input>
              </Pressable>
            )}

            {hasChildren && count && (
              <Pressable onPress={() => setActiveSheet("location")}>
                <Input
                  size="xl"
                  variant="outline"
                  borderRadius="$xl"
                  bg={location ? "#FFFFFF" : "#F7F5F4"}
                  borderWidth={1}
                  borderColor={location ? "#1A1A1A" : "$borderLight300"}
                  isReadOnly
                >
                  {location && (
                    <Text
                      position="absolute"
                      top={6}
                      left={16}
                      size="xs"
                      color="$textLight500"
                    >
                      Where do your children currently live?
                    </Text>
                  )}
                  <InputField
                    value={location || ""}
                    placeholder="Where do your children currently live?"
                    placeholderTextColor="$textLight400"
                    color="$textLight900"
                    pointerEvents="none"
                    pt={location ? "$4" : "$0"}
                  />
                  <InputSlot pr="$4">
                    <Box>
                      <IconSymbol
                        name="chevron.right"
                        size={20}
                        color="#1A1A1A"
                        style={{ transform: [{ rotate: "90deg" }] }}
                      />
                    </Box>
                  </InputSlot>
                </Input>
              </Pressable>
            )}

            {hasChildren && location && (
              <Pressable onPress={() => setActiveSheet("age")}>
                <Input
                  size="xl"
                  variant="outline"
                  borderRadius="$xl"
                  bg={age ? "#FFFFFF" : "#F7F5F4"}
                  borderWidth={1}
                  borderColor={age ? "#1A1A1A" : "$borderLight300"}
                  isReadOnly
                >
                  {age && (
                    <Text
                      position="absolute"
                      top={6}
                      left={16}
                      size="xs"
                      color="$textLight500"
                    >
                      Children's Age
                    </Text>
                  )}
                  <InputField
                    value={age || ""}
                    placeholder="Children's Age"
                    placeholderTextColor="$textLight400"
                    color="$textLight900"
                    pointerEvents="none"
                    pt={age ? "$4" : "$0"}
                  />
                  <InputSlot pr="$4">
                    <Box>
                      <IconSymbol
                        name="chevron.right"
                        size={20}
                        color="#1A1A1A"
                        style={{ transform: [{ rotate: "90deg" }] }}
                      />
                    </Box>
                  </InputSlot>
                </Input>
              </Pressable>
            )}
          </VStack>
        </ScrollView>

        <Box pb="$8" bg="$white">
          <Button
            w="100%"
            size="xl"
            bg={isComplete ? "#E86673" : "#F4F3F2"}
            borderRadius="$full"
            disabled={!isComplete || updateMutation.isPending}
            onPress={handleContinue}
          >
            {updateMutation.isPending ? (
              <ButtonSpinner color="#FFFFFF" />
            ) : (
              <ButtonText
                fontWeight="$bold"
                color={isComplete ? "#FFFFFF" : "$textLight400"}
              >
                Continue
              </ButtonText>
            )}
          </Button>
        </Box>
      </VStack>

      <Actionsheet
        isOpen={activeSheet !== null}
        onClose={() => setActiveSheet(null)}
        snapPoints={[activeSheet === "location" ? 65 : 45]}
      >
        <ActionsheetBackdrop />
        <ActionsheetContent
          bg="#FFF9FA"
          borderTopLeftRadius="$3xl"
          borderTopRightRadius="$3xl"
        >
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator bg="$backgroundLight400" w="$16" />
          </ActionsheetDragIndicatorWrapper>
          <VStack w="100%" px="$0" pb="$6" pt="$2">
            <Text
              px="$6"
              pb="$4"
              size="lg"
              fontWeight="$bold"
              color="$textLight900"
            >
              {currentTitle}
            </Text>
            {currentOptions.map((opt) => (
              <Box key={opt}>
                <Divider bg="$borderLight200" />
                <ActionsheetItem
                  onPress={() => handleSelect(opt)}
                  py="$4"
                  justifyContent="center"
                >
                  <ActionsheetItemText
                    color="$textLight900"
                    fontWeight="$medium"
                  >
                    {opt}
                  </ActionsheetItemText>
                </ActionsheetItem>
              </Box>
            ))}
            <Divider bg="$borderLight200" />
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
    </SafeAreaView>
  );
}
