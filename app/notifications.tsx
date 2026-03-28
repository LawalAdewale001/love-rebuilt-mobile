import { IconSymbol } from "@/components/ui/icon-symbol";
import {
    Box,
    Divider,
    HStack,
    Pressable,
    ScrollView,
    Text,
    VStack,
} from "@gluestack-ui/themed";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

// Mock Data
const NOTIFICATIONS = [
  {
    id: 1,
    type: "match",
    title: "You have a new match",
    message: "Patrica as what you search for, start of a conversation now",
    actionText: "View Patrica Profile",
    iconBg: "#FFE5B4",
    iconColor: "#FFA500",
  },
  {
    id: 2,
    type: "system",
    title: "Welcome to love built",
    message: "We have setup matches based on your preferences",
    actionText: "View Matches",
    iconBg: "#9999FF",
    iconColor: "#4B0082",
  },
];

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Header */}
      <Box
        px="$6"
        py="$4"
        position="relative"
        justifyContent="center"
        alignItems="center"
      >
        <Pressable
          position="absolute"
          left={24}
          onPress={() => router.back()}
          p="$2"
          borderWidth={1}
          borderColor="$borderLight300"
          borderRadius="$full"
          w={36}
          h={36}
          justifyContent="center"
          alignItems="center"
        >
          <IconSymbol name="chevron.left" size={20} color="#1A1A1A" />
        </Pressable>
        <Text size="xl" fontWeight="$bold" color="$textLight900">
          Notifications
        </Text>
      </Box>

      <ScrollView flex={1} mt="$4">
        {NOTIFICATIONS.map((notif, index) => (
          <Box key={notif.id}>
            <HStack px="$6" py="$5" space="md" alignItems="flex-start">
              {/* Icon Bubble */}
              <Box
                w={48}
                h={48}
                borderRadius="$full"
                bg={notif.iconBg}
                justifyContent="center"
                alignItems="center"
              >
                <Text color={notif.iconColor} size="xl">
                  ♥
                </Text>
                {/* Use appropriate IconSymbol here */}
              </Box>

              {/* Content */}
              <VStack flex={1} space="xs">
                <Text size="md" fontWeight="$bold" color="$textLight900">
                  {notif.title}
                </Text>
                <Text size="sm" color="$textLight500" lineHeight="$sm">
                  {notif.message}
                </Text>

                {/* Action Button */}
                <Pressable
                  mt="$2"
                  onPress={() =>
                    router.push(
                      notif.type === "match"
                        ? "/profile-detail"
                        : "/(tabs)/matches",
                    )
                  }
                >
                  <Box
                    bg="#FFF0F2"
                    px="$4"
                    py="$2"
                    borderRadius="$full"
                    alignSelf="flex-start"
                  >
                    <Text color="#E86673" fontWeight="$medium" size="sm">
                      {notif.actionText}
                    </Text>
                  </Box>
                </Pressable>
              </VStack>
            </HStack>
            {index < NOTIFICATIONS.length - 1 && (
              <Divider bg="$borderLight100" />
            )}
          </Box>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
