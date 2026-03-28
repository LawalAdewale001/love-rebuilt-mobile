import { Box, Text } from "@gluestack-ui/themed";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <Box flex={1} justifyContent="center" alignItems="center">
        <Text size="xl" fontWeight="$bold" color="#E86673">
          Chats Screen
        </Text>
        <Text color="$textLight500" mt="$2">
          Your conversations will appear here.
        </Text>
      </Box>
    </SafeAreaView>
  );
}
