import { Box, HStack, Pressable } from "@gluestack-ui/themed";
import { useRouter } from "expo-router";
import { IconSymbol } from "./icon-symbol";

interface OnboardingHeaderProps {
  progress: number; // 0 to 100
}

export function OnboardingHeader({ progress }: OnboardingHeaderProps) {
  const router = useRouter();

  return (
    <HStack alignItems="center" px="$6" py="$4" mt="$2">
      <Pressable
        onPress={() => router.back()}
        p="$2"
        borderWidth={1}
        borderColor="$borderLight300"
        borderRadius="$full"
      >
        <IconSymbol name="chevron.left" size={20} color="#1A1A1A" />
      </Pressable>

      {/* Progress Bar Container */}
      <Box
        flex={1}
        ml="$4"
        mr="$10"
        h="$1"
        bg="$backgroundLight200"
        borderRadius="$full"
        overflow="hidden"
      >
        <Box w={`${progress}%`} h="$full" bg="#E86673" borderRadius="$full" />
      </Box>
    </HStack>
  );
}
