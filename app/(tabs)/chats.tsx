import { PRIMARY_COLOR } from "@/constants/theme";
import {
  BlockOptionIcon,
  CallOptionIcon,
  LeaveGroupOptionIcon,
  PlanMeetupOptionIcon,
  ReportOptionIcon,
  SupportOptionIcon,
  VideoCallOptionIcon,
} from "@/components/ui/chat-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  Box,
  HStack,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  Pressable,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getAuthUser } from "@/lib/auth-store";
import {
  type ChatConversation,
  useChatListQuery,
  useChatSearchQuery,
} from "@/lib/queries";
import { MessageType } from "@/types/chat.types";
import { useAllChatsSocket } from "@/hooks/use-all-chats-socket";

type ChatOption = {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
};

/** For direct chats, find the other person's name, avatar, userId, and online status. */
function getDirectChatDisplay(chat: ChatConversation, currentUserId: string) {
  const other = chat.members.find((m) => m.userId !== currentUserId);
  return {
    name: other?.name ?? chat.name,
    avatar: other?.avatar ?? null,
    userId: other?.userId ?? "",
    isOnline: other?.isOnline ?? false,
    isLiked: other?.isLiked ?? false,
    lastSeen: other?.lastSeen ?? null,
  };
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ChatsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "groups">("all");
  const [optionsChat, setOptionsChat] = useState<ChatConversation | null>(null);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const currentUserId = getAuthUser()?.id ?? "";

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const isSearching = debouncedSearch.length > 0;

  // Chat list (paginated)
  const {
    data: chatListData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isListLoading,
    refetch,
    isRefetching,
  } = useChatListQuery();
  
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Search
  const { data: searchData, isLoading: isSearchLoading } =
    useChatSearchQuery(debouncedSearch);

  // Typing status across all chats
  const { typingMap } = useAllChatsSocket();

  const allChats =
    chatListData?.pages.flatMap((page) => page.result ?? page) ?? [];

  const filteredChats = isSearching
    ? (searchData?.chats ?? [])
    : activeTab === "groups"
      ? allChats.filter((c) => c.type === "group")
      : allChats;

  const getOptionsForChat = useCallback(
    (chat: ChatConversation): ChatOption[] => {
      const display = getDirectChatDisplay(chat, currentUserId);
      if (chat.type === "group") {
        return [
          {
            icon: <LeaveGroupOptionIcon size={32} />,
            label: "Leave Group",
            onPress: () => setOptionsChat(null),
          },
          {
            icon: <ReportOptionIcon size={32} />,
            label: "Report Group",
            onPress: () => setOptionsChat(null),
          },
        ];
      }
      return [
        {
          icon: <CallOptionIcon size={32} />,
          label: `Call ${display.name}`,
          onPress: () => setOptionsChat(null),
        },
        {
          icon: <VideoCallOptionIcon size={32} />,
          label: `Video Call ${display.name}`,
          onPress: () => setOptionsChat(null),
        },
        {
          icon: <PlanMeetupOptionIcon size={32} />,
          label: "Plan a meetup",
          onPress: () => setOptionsChat(null),
        },
        {
          icon: <BlockOptionIcon size={32} />,
          label: `Block ${display.name}`,
          onPress: () => setOptionsChat(null),
        },
        {
          icon: <SupportOptionIcon size={32} />,
          label: `Report ${display.name}`,
          onPress: () => setOptionsChat(null),
        },
      ];
    },
    [currentUserId]
  );

  const renderChatItem = useCallback(
    ({ item: chat }: { item: ChatConversation }) => {
      const isGroup = chat.type === "group";
      const display = isGroup
        ? { name: chat.name, avatar: chat.image, userId: "", isOnline: false, isLiked: false }
        : getDirectChatDisplay(chat, currentUserId);

      const lastMessageText = chat.lastMessage?.content ?? null;
      const timeText = chat.lastMessage
        ? formatTime(chat.lastMessage.createdAt)
        : formatTime(chat.updatedAt);

      return (
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/chat-conversation",
              params: {
                name: display.name,
                id: chat.id,
                isGroup: isGroup ? "1" : "0",
                avatar: display.avatar ?? "",
                recipientId: isGroup ? "" : display.userId,
                isOnline: !isGroup && display.isOnline ? "1" : "0",
                isLiked: !isGroup && display.isLiked ? "1" : "0",
                lastSeen: !isGroup && display.lastSeen ? display.lastSeen : "",
              },
            })
          }
          onLongPress={() => setOptionsChat(chat)}
        >
          <HStack px="$5" py="$3" alignItems="center" space="md">
            {/* Unread dot */}
            {chat.unreadCount > 0 ? (
              <Box w={8} h={8} borderRadius={6} bg={PRIMARY_COLOR} />
            ) : (
              <Box w={8} h={8} />
            )}

            {/* Avatar */}
            {isGroup ? (
              display.avatar ? (
                <Box
                  w={40}
                  h={40}
                  borderRadius={20}
                  overflow="hidden"
                >
                  <Image
                    source={{ uri: display.avatar }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                </Box>
              ) : (
                <Box w={40} h={40} position="relative">
                  <Box
                    w={32}
                    h={32}
                    borderRadius={16}
                    bg="#F0C4C8"
                    position="absolute"
                    top={0}
                    left={0}
                    borderWidth={2}
                    borderColor="#FFFFFF"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <MaterialIcons
                      name="person"
                      size={18}
                      color={PRIMARY_COLOR}
                    />
                  </Box>
                  <Box
                    w={32}
                    h={32}
                    borderRadius={16}
                    bg="#F0D4C8"
                    position="absolute"
                    bottom={0}
                    right={0}
                    borderWidth={2}
                    borderColor="#FFFFFF"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <MaterialIcons
                      name="person"
                      size={18}
                      color={PRIMARY_COLOR}
                    />
                  </Box>
                </Box>
              )
            ) : display.avatar ? (
              <Box
                w={40}
                h={40}
                borderRadius={20}
                overflow="hidden"
              >
                <Image
                  source={{ uri: display.avatar }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </Box>
            ) : (
              <Box
                w={40}
                h={40}
                borderRadius={20}
                bg="#F0C4C8"
                justifyContent="center"
                alignItems="center"
              >
                <MaterialIcons
                  name="person"
                  size={26}
                  color={PRIMARY_COLOR}
                />
              </Box>
            )}

            {/* Chat Info */}
            <VStack flex={1} space="xs">
              <HStack justifyContent="space-between" alignItems="center">
                <Text
                  fontSize={15}
                  fontWeight="$bold"
                  color="#1A1A1A"
                  numberOfLines={1}
                  flex={1}
                  mr="$2"
                >
                  {display.name}
                </Text>
                <HStack alignItems="center" space="xs">
                  <Text fontSize={12} color="#999999">
                    {timeText}
                  </Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={16}
                    color="#CCCCCC"
                  />
                </HStack>
              </HStack>
              {typingMap[chat.id] ? (
                <Text fontSize={13} color={PRIMARY_COLOR} fontStyle="italic">
                  Is typing...
                </Text>
              ) : chat.lastMessage ? (
                <HStack alignItems="center" space="xs">
                  {chat.lastMessage.type === MessageType.IMAGE && (
                    <MaterialIcons name="camera-alt" size={14} color="#999999" />
                  )}
                  {chat.lastMessage.type === MessageType.AUDIO && (
                    <MaterialIcons name="mic" size={14} color="#999999" />
                  )}
                  {chat.lastMessage.type === MessageType.FILE && (
                    <MaterialIcons name="insert-drive-file" size={14} color="#999999" />
                  )}
                  {chat.lastMessage.type === MessageType.VIDEO && (
                    <MaterialIcons name="videocam" size={14} color="#999999" />
                  )}
                  <Text fontSize={13} color="#999999" numberOfLines={1} flex={1}>
                    {chat.lastMessage.type === MessageType.TEXT
                      ? chat.lastMessage.content
                      : chat.lastMessage.type === MessageType.AUDIO
                        ? "Voice note"
                        : chat.lastMessage.type === MessageType.FILE
                          ? "Document"
                          : chat.lastMessage.type.charAt(0).toUpperCase() + chat.lastMessage.type.slice(1)}
                  </Text>
                </HStack>
              ) : typingMap[chat.id] ? (
                <Text fontSize={13} color={PRIMARY_COLOR} fontStyle="italic">
                  Typing...
                </Text>
              ) : (
                <Text fontSize={13} color="#CCCCCC" numberOfLines={1}>
                  No messages yet
                </Text>
              )}
            </VStack>
          </HStack>
        </Pressable>
      );
    },
    [currentUserId, router]
  );

  const isLoading = isSearching ? isSearchLoading : isListLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <VStack flex={1}>
        {/* Full-width header image */}
        <Image
          source={require("@/assets/images/chat-top.png")}
          style={{ width: "100%", height: 100 }}
          contentFit="cover"
        />

        <Box alignItems="center" pb="$1">
          <Text fontSize={22} fontWeight="$bold" color="#1A1A1A">
            Messages
          </Text>
        </Box>

        {/* Search Bar */}
        <Box px="$5" mt="$3" mb="$3">
          <Input
            bg="#F5F5F5"
            borderRadius={25}
            borderWidth={0}
            h={44}
            px="$1"
          >
            <InputSlot pl="$3">
              <InputIcon>
                <MaterialIcons name="search" size={20} color="#999999" />
              </InputIcon>
            </InputSlot>
            <InputField
              placeholder="Search"
              placeholderTextColor="#999999"
              fontSize={15}
              color="#1A1A1A"
              value={searchText}
              onChangeText={setSearchText}
              autoCorrect={false}
            />
            {searchText.length > 0 && (
              <InputSlot pr="$3" onPress={() => setSearchText("")}>
                <MaterialIcons name="close" size={18} color="#999999" />
              </InputSlot>
            )}
          </Input>
        </Box>

        {/* All / Groups Toggle */}
        {!isSearching && (
          <HStack px="$5" mb="$3" space="sm">
            <Pressable
              flex={1}
              h={38}
              bg={activeTab === "all" ? PRIMARY_COLOR : "#F5F5F5"}
              borderRadius={20}
              justifyContent="center"
              alignItems="center"
              onPress={() => setActiveTab("all")}
            >
              <Text
                color={activeTab === "all" ? "#FFFFFF" : "#999999"}
                fontWeight="$semibold"
                fontSize={14}
              >
                All
              </Text>
            </Pressable>
            <Pressable
              flex={1}
              h={38}
              bg={activeTab === "groups" ? PRIMARY_COLOR : "#F5F5F5"}
              borderRadius={20}
              justifyContent="center"
              alignItems="center"
              onPress={() => setActiveTab("groups")}
            >
              <Text
                color={activeTab === "groups" ? "#FFFFFF" : "#999999"}
                fontWeight="$semibold"
                fontSize={14}
              >
                Groups
              </Text>
            </Pressable>
          </HStack>
        )}

        {/* Chat List */}
        {isLoading ? (
          <Box flex={1} justifyContent="center" alignItems="center">
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          </Box>
        ) : (
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item.id}
            renderItem={renderChatItem}
            onEndReached={() => {
              if (!isSearching && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            onRefresh={refetch}
            refreshing={isRefetching}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Box flex={1} py="$10" alignItems="center">
                <Text color="#999999" fontSize={15}>
                  {isSearching ? "No results found" : "No conversations yet"}
                </Text>
              </Box>
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <Box py="$4" alignItems="center">
                  <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                </Box>
              ) : null
            }
          />
        )}
      </VStack>

      {/* Options Modal */}
      <Modal
        visible={!!optionsChat}
        transparent
        animationType="fade"
        onRequestClose={() => setOptionsChat(null)}
      >
        <TouchableWithoutFeedback onPress={() => setOptionsChat(null)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.optionsCard}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setOptionsChat(null)}
                >
                  <MaterialIcons name="close" size={20} color="#333" />
                </TouchableOpacity>
                <Text style={styles.optionsLabel}>options</Text>
                {optionsChat &&
                  getOptionsForChat(optionsChat).map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.optionRow}
                      onPress={option.onPress}
                      activeOpacity={0.7}
                    >
                      {option.icon}
                      <Text style={styles.optionText}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: "75%",
    maxWidth: 300,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  optionsLabel: {
    fontSize: 12,
    color: PRIMARY_COLOR,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  optionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1A1A1A",
  },
});
