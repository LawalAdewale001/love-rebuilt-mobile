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
  ScrollView,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Mock data for chat conversations
const CHATS = [
  {
    id: "1",
    name: "Patrica",
    time: "9:36 AM",
    message: "Can we plan our first meet up, at your own location?",
    avatar: null,
    isGroup: false,
    unread: true,
  },
  {
    id: "2",
    name: "Princess",
    time: "9:36 PM",
    message: "Can we go for an hangout tomorrow by 6pm at Ikeja?",
    avatar: null,
    isGroup: false,
    unread: true,
  },
  {
    id: "3",
    name: "Football Lovers",
    time: "10:45 AM",
    message: "...josh: I love man u but they always mess up in pick matches.",
    avatar: null,
    isGroup: true,
    unread: false,
  },
  {
    id: "4",
    name: "Juliet",
    time: "10:15 AM",
    message: "How about a cozy dinner date this weekend, my dear?",
    avatar: null,
    isGroup: false,
    unread: true,
  },
  {
    id: "5",
    name: "Foodies",
    time: "10:45 AM",
    message: "...dave: Man I love shawarma and I mess it, i will need to go get it.",
    avatar: null,
    isGroup: true,
    unread: false,
  },
  {
    id: "6",
    name: "Nature Lovers",
    time: "11:20 AM",
    message: "Join this group to discuss nature and find love!",
    avatar: null,
    isGroup: true,
    unread: true,
  },
];

type ChatOption = {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
};

export default function ChatsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "groups">("all");
  const [optionsChat, setOptionsChat] = useState<(typeof CHATS)[number] | null>(null);

  const filteredChats =
    activeTab === "groups" ? CHATS.filter((c) => c.isGroup) : CHATS;

  const getOptionsForChat = (chat: (typeof CHATS)[number]): ChatOption[] => {
    if (chat.isGroup) {
      return [
        { icon: <LeaveGroupOptionIcon size={32} />, label: "Leave Group", onPress: () => setOptionsChat(null) },
        { icon: <ReportOptionIcon size={32} />, label: "Report Group", onPress: () => setOptionsChat(null) },
      ];
    }
    return [
      { icon: <CallOptionIcon size={32} />, label: `Call ${chat.name}`, onPress: () => setOptionsChat(null) },
      { icon: <VideoCallOptionIcon size={32} />, label: `Video Call ${chat.name}`, onPress: () => setOptionsChat(null) },
      { icon: <PlanMeetupOptionIcon size={32} />, label: "Plan a meetup", onPress: () => setOptionsChat(null) },
      { icon: <BlockOptionIcon size={32} />, label: `Block ${chat.name}`, onPress: () => setOptionsChat(null) },
      { icon: <SupportOptionIcon size={32} />, label: `Report ${chat.name}`, onPress: () => setOptionsChat(null) },
    ];
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <VStack flex={1}>
        {/* Full-width header image — below status bar */}
        <Image
          source={require("@/assets/images/chat-top.png")}
          style={{ width: "100%", height: 100 }}
          contentFit="cover"
        />

        <Box alignItems="center" pb="$1">
          <Text
            fontSize={22}
            fontWeight="$bold"
            color="#1A1A1A"
          >
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
            />
          </Input>
        </Box>

        {/* All / Groups Toggle */}
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

        {/* Chat List */}
        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          {filteredChats.map((chat) => (
            <Pressable
              key={chat.id}
              onPress={() =>
                router.push({
                  pathname: "/chat-conversation",
                  params: { name: chat.name, id: chat.id, isGroup: chat.isGroup ? "1" : "0" },
                })
              }
              onLongPress={() => setOptionsChat(chat)}
            >
              <HStack
                px="$5"
                py="$3"
                alignItems="center"
                space="md"
              >
                {/* Unread dot — to the left of avatar */}
                {chat.unread ? (
                  <Box w={8} h={8} borderRadius={6} bg={PRIMARY_COLOR} />
                ) : (
                  <Box w={8} h={8} />
                )}

                {/* Avatar */}
                {chat.isGroup ? (
                  <Box w={32} h={32} position="relative">
                    {/* Stacked group avatars */}
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
                      overflow="hidden"
                    >
                      <MaterialIcons name="person" size={18} color={PRIMARY_COLOR} />
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
                      overflow="hidden"
                    >
                      <MaterialIcons name="person" size={18} color={PRIMARY_COLOR} />
                    </Box>
                  </Box>
                ) : (
                  <Box
                    w={32}
                    h={32}
                    borderRadius={24}
                    bg="#F0C4C8"
                    justifyContent="center"
                    alignItems="center"
                    overflow="hidden"
                  >
                    <MaterialIcons name="person" size={26} color={PRIMARY_COLOR} />
                  </Box>
                )}

                {/* Chat Info */}
                <VStack flex={1} space="xs">
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text
                      fontSize={15}
                      fontWeight="$bold"
                      color="#1A1A1A"
                    >
                      {chat.name}
                    </Text>
                    <HStack alignItems="center" space="xs">
                      <Text fontSize={12} color="#999999">
                        {chat.time}
                      </Text>
                      <MaterialIcons
                        name="chevron-right"
                        size={16}
                        color="#CCCCCC"
                      />
                    </HStack>
                  </HStack>
                  <Text
                    fontSize={13}
                    color="#999999"
                    numberOfLines={1}
                  >
                    {chat.message}
                  </Text>
                </VStack>
              </HStack>
            </Pressable>
          ))}
        </ScrollView>
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
                {/* Close button */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setOptionsChat(null)}
                >
                  <MaterialIcons name="close" size={20} color="#333" />
                </TouchableOpacity>

                {/* "options" label */}
                <Text style={styles.optionsLabel}>options</Text>

                {/* Option items */}
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
