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
                      bg={item.isRead ? "#F7F5F4" : "#FFF0F2"}
                      justifyContent="center"
                      alignItems="center"
                      overflow="hidden"
                    >
                      {item.avatar ? (
                        <Image
                          source={{ uri: item.avatar }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      ) : (
                        <Image
                          source={require("@/assets/images/icon-bell.png")}
                          style={{ width: 24, height: 24 }}
                          contentFit="contain"
                          tintColor={item.isRead ? "#666" : PRIMARY_COLOR}
                        />
                      )}
                    </Box>

                    {/* Content */}
                    <VStack flex={1} space="xs">
                      <HStack
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Text
                          size="md"
                          fontWeight="$bold"
                          color="$textLight900"
                        >
                          {item.title || "Alert"}
                        </Text>
                        <Text size="xs" color="$textLight500">
                          {/* Assuming backend sends an ISO string */}
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString()
                            : "Now"}
                        </Text>
                      </HStack>
                      <Text size="sm" color="$textLight600" numberOfLines={2}>
                        {item.message}
                      </Text>
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
