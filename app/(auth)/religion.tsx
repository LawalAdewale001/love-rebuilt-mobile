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
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const RELIGION_OPTIONS = [
  "Christian",
  "Muslim",
  "Diviner",
  "Idol Worshipper",
  "Prefer Not to Say",
];

export default function ReligionScreen() {
  const router = useRouter();
  const updateMutation = useUpdateProfileMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    setSelected(option);
    setIsOpen(false);
  };

  const handleContinue = () => {
    if (!selected) return;
    updateMutation.mutate(
      { religion: selected },
      {
        onSuccess: () => router.push("/tribe"),
        onError: (err: any) =>
          showToast(
            "error",
            "Error",
            err?.message || "Failed to save religion",
          ),
      },
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <OnboardingHeader progress={90} />

      <VStack flex={1} px="$6" pt="$6">
        <Text size="2xl" fontWeight="$bold" color="$textLight900">
          Let's Know your Religion
        </Text>
        <Text size="md" color="$textLight600" mt="$1">
          Select your religion to personalize your experience
        </Text>

        <Pressable mt="$8" onPress={() => setIsOpen(true)}>
          <Input
            size="xl"
            variant="outline"
            borderRadius="$xl"
            bg="#F7F5F4"
            borderWidth={1}
            borderColor={selected ? "#1A1A1A" : "$borderLight300"}
            isReadOnly
            pointerEvents="none"
          >
            <InputField
              value={selected || ""}
              placeholder="Select your Religion"
              placeholderTextColor="$textLight400"
              color="$textLight900"
              pointerEvents="none"
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

        <Box flex={1}>
          <Image
            source={require("@/assets/images/religion-graphic.png")}
            style={{
              width: 435,
              height: 400,
              position: "absolute",
              bottom: -65,
              left: -35,
            }}
            contentFit="contain"
          />

          <Button
            w="100%"
            size="xl"
            bg={selected ? "#FFFFFF" : "#F4F3F2"}
            borderRadius="$full"
            mt="auto"
            disabled={!selected || updateMutation.isPending}
            onPress={handleContinue}
            style={
              selected
                ? {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }
                : {}
            }
          >
            {updateMutation.isPending ? (
              <ButtonSpinner color="#1A1A1A" />
            ) : (
              <ButtonText
                fontWeight="$bold"
                color={selected ? "#1A1A1A" : "$textLight400"}
              >
                Continue
              </ButtonText>
            )}
          </Button>
        </Box>
      </VStack>

      <Actionsheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        snapPoints={[50]}
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
              Select your Religion
            </Text>
            {RELIGION_OPTIONS.map((opt) => (
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
