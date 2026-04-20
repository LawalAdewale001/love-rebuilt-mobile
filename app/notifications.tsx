import { PRIMARY_COLOR } from "@/constants/theme";
import {
  useMarkNotificationReadMutation,
  useNotificationListQuery,
} from "@/lib/queries";
import {
  Box,
  Divider,
  HStack,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const router = useRouter();

  const { data: notifications, isLoading, error } = useNotificationListQuery();
  const markReadMutation = useMarkNotificationReadMutation();

  const handleNotificationPress = (notification: any) => {
    // Mark as read if it isn't already
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }

    // Logic to route based on notification type
    // e.g. if (notification.type === 'match') router.push('/matches');
  };

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
          <Image
            source={require("@/assets/images/ArrowLeft.png")}
            style={{ width: 16, height: 16 }}
            contentFit="contain"
          />
        </Pressable>
        <Text size="xl" fontWeight="$bold" color="$textLight900">
          Notifications
        </Text>
      </Box>

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack px="$6" pt="$4" space="lg" pb="$10">
          {isLoading ? (
            <Box py="$10" alignItems="center">
              <Spinner size="large" color={PRIMARY_COLOR} />
            </Box>
          ) : error ? (
            <Box py="$10" alignItems="center">
              <Text color="$textLight500">Failed to load notifications.</Text>
            </Box>
          ) : notifications && notifications.length > 0 ? (
            notifications.map((item, index) => (
              <Box key={item.id}>
                <Pressable
                  py="$2"
                  onPress={() => handleNotificationPress(item)}
                >
                  <HStack
                    space="md"
                    alignItems="center"
                    opacity={item.isRead ? 0.6 : 1}
                  >
                    {/* Notification Icon/Avatar */}
                    <Box
                      w={48}
                      h={48}
                      borderRadius="$full"
                      bg={item.type === "match" ? "#FFDFB3" : "#A8A3FF"}
                      justifyContent="center"
                      alignItems="center"
                      overflow="hidden"
                    >
                      <Ionicons
                        name="heart"
                        size={24}
                        color={item.type === "match" ? "#FFA500" : "#4E3EFC"}
                      />
                    </Box>

                    {/* Content */}
                    <VStack flex={1} space="xs" pr="$2">
                      <Text
                        size="md"
                        fontWeight="$bold"
                        color="$textLight900"
                      >
                        {item.title || "Alert"}
                      </Text>
                      <Text size="sm" color="$textLight500" lineHeight={20}>
                        {item.body}
                      </Text>
                      <Box mt="$2">
                        {item.type === "match" ? (
                          <Box alignSelf="flex-start" bg="#FDECEE" py="$2" px="$4" borderRadius="$full">
                            <Text color={PRIMARY_COLOR} fontWeight="500" size="sm">
                              View Profile
                            </Text>
                          </Box>
                        ) : !item.isRead ? (
                          <Pressable
                            onPress={() => {
                              if (!item.isRead) {
                                markReadMutation.mutate(item.id);
                              }
                            }}
                          >
                            <Box alignSelf="flex-start" bg="#FDECEE" py="$2" px="$4" borderRadius="$full">
                              <HStack space="xs" alignItems="center">
                                <Ionicons name="checkmark-done" size={16} color={PRIMARY_COLOR} />
                                <Text color={PRIMARY_COLOR} fontWeight="500" size="sm">
                                  Mark as read
                                </Text>
                              </HStack>
                            </Box>
                          </Pressable>
                        ) : null}
                      </Box>
                    </VStack>

                    {/* Unread dot */}
                    {!item.isRead && (
                      <Box
                        w={8}
                        h={8}
                        borderRadius="$full"
                        bg={PRIMARY_COLOR}
                      />
                    )}
                  </HStack>
                </Pressable>
                {index < notifications.length - 1 && (
                  <Divider bg="$borderLight100" mt="$4" />
                )}
              </Box>
            ))
          ) : (
            <Box py="$20" alignItems="center">
              <Image
                source={require("@/assets/images/icon-bell.png")}
                style={{
                  width: 60,
                  height: 60,
                  opacity: 0.3,
                  marginBottom: 16,
                }}
                contentFit="contain"
              />
              <Text color="$textLight500" size="lg" textAlign="center">
                You have no notifications right now.
              </Text>
            </Box>
          )}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
