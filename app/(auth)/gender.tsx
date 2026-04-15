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

const GENDER_OPTIONS = [
  { label: "Man", value: "Male" },
  { label: "Woman", value: "Female" },
];

export default function GenderScreen() {
  const router = useRouter();
  const updateMutation = useUpdateProfileMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<{
    label: string;
    value: string;
  } | null>(null);

  const handleSelect = (option: { label: string; value: string }) => {
    setSelected(option);
    setIsOpen(false);
  };

  const handleContinue = () => {
    if (!selected) return;

    updateMutation.mutate(
      { gender: selected.value },
      {
        onSuccess: () => router.push("/identity"),
        onError: (err: any) =>
          showToast("error", "Error", err?.message || "Failed to save gender"),
      },
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <OnboardingHeader progress={50} />

      <VStack flex={1} px="$6" pt="$6">
        <Text size="2xl" fontWeight="$bold" color="$textLight900">
          I'm a
        </Text>
        <Text size="md" color="$textLight600" mt="$1">
          Select your gender identity
        </Text>

        {/* Dropdown Trigger */}
        <Pressable mt="$8" onPress={() => setIsOpen(true)}>
          <Input
            size="xl"
            variant="outline"
            borderRadius="$xl"
            bg="#F7F5F4"
            borderWidth={1}
            borderColor={selected ? "#1A1A1A" : "$borderLight300"}
            isReadOnly
          >
            <InputField
              value={selected?.label || ""}
              placeholder="Select your Identity (e.g Man)"
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

        {/* Graphic & Button Area */}
        <Box flex={1} justifyContent="flex-end" alignItems="center" pb="$8">
          <Box
            position="absolute"
            bottom={-40}
            left={0}
            right={0}
            alignItems="center"
            zIndex={-1}
            pointerEvents="none"
          >
            <Image
              source={require("@/assets/images/gender-graphic.png")}
              style={{
                width: 315.99,
                height: 254,
              }}
              contentFit="contain"
            />
          </Box>

          <Button
            w="100%"
            size="xl"
            bg={selected ? "#E86673" : "#F4F3F2"}
            borderRadius="$full"
            mt="$6"
            disabled={!selected || updateMutation.isPending}
            onPress={handleContinue}
            style={
              selected
                ? {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 6,
                    elevation: 3,
                  }
                : {}
            }
          >
            {updateMutation.isPending ? (
              <ButtonSpinner color="#FFFFFF" />
            ) : (
              <ButtonText
                fontWeight="$bold"
                color={selected ? "#FFFFFF" : "$textLight400"}
              >
                Continue
              </ButtonText>
            )}
          </Button>
        </Box>
      </VStack>

      {/* Bottom Sheet for Selection */}
      <Actionsheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        snapPoints={[30]}
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
              I'm a
            </Text>
            {GENDER_OPTIONS.map((opt) => (
              <Box key={opt.value}>
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
                    {opt.label}
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
