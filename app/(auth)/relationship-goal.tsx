import { IconSymbol } from "@/components/ui/icon-symbol";
import { OnboardingHeader } from "@/components/ui/onboarding-header";
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

const GOAL_OPTIONS = [
  "Marriage",
  "Serious Relationship",
  "Life Partner",
  "Companionship",
  "Friendship First",
  "Open to Something Meaningful",
  "Not Sure Yet",
  "Prefer Not to Say",
];

export default function RelationshipGoalScreen() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    setSelected(option);
    setIsOpen(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <OnboardingHeader progress={96} />

      <VStack flex={1} px="$6" pt="$6">
        <Text size="2xl" fontWeight="$bold" color="$textLight900">
          Let's Know your Relationship Goal
        </Text>
        <Text size="md" color="$textLight600" mt="$1">
          Tailor your experience by setting a relationship goal.
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
          >
            <InputField
              value={selected || ""}
              placeholder="Select your relationship goal"
              placeholderTextColor="$textLight400"
              color="$textLight900"
              pointerEvents="none"
            />
            <InputSlot pr="$4">
              <IconSymbol
                name="chevron.right"
                size={20}
                color="#1A1A1A"
                style={{ transform: [{ rotate: "90deg" }] }}
              />
            </InputSlot>
          </Input>
        </Pressable>

        <Box flex={1}>
          <Image
            source={require("@/assets/images/relationship-graphic.png")}
            style={{
              width: 500,
              height: 500,
              position: "absolute",
              bottom: -50,
              left: -70,
            }}
            contentFit="contain"
          />

          {/* Per your design, the active button here is Pink */}
          <Button
            w="100%"
            size="xl"
            bg={selected ? "#E86673" : "#F4F3F2"}
            borderRadius="$full"
            mt="auto"
            disabled={!selected}
            onPress={() => router.push("/children-status")}
          >
            <ButtonText
              fontWeight="$bold"
              color={selected ? "#FFFFFF" : "$textLight400"}
            >
              Continue
            </ButtonText>
          </Button>
        </Box>
      </VStack>

      <Actionsheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        snapPoints={[75]}
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
              Select your relationship goals
            </Text>
            {GOAL_OPTIONS.map((opt) => (
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
