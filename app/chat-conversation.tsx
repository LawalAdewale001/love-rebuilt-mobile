import {
  BlockOptionIcon,
  CallOptionIcon,
  CameraIcon,
  CurvyStarburstFrame,
  DualStarburstFrame,
  HeartIcon,
  LeaveGroupOptionIcon,
  MicrophoneIcon,
  PlanMeetupOptionIcon,
  ReportOptionIcon,
  SendIcon,
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  TextInput,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAuthUser } from "@/lib/auth-store";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { useInteractionMutation, useMessagesQuery, type ChatMessage } from "@/lib/queries";
import { emitDeleteMessage, emitEditMessage, emitSendMessage, emitTyping } from "@/lib/socket";
import { PRIMARY_COLOR } from "@/constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type Message = {
  id: string;
  text: string;
  sent: boolean;
  time: string;
  read?: boolean;
  sender?: string;
  replyTo?: { id: string; text: string; sender?: string };
  edited?: boolean;
  deleted?: boolean;
};

// Mock messages — sent = current user (right, pink), received = other person (left, gray)
const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    text: "Can't wait for the results! Hope everything goes smoothly.",
    sent: false,
    time: "9:30 AM",
    read: true,
  },
  {
    id: "2",
    text: "Can we plan our first meet up, at your own location?",
    sent: true,
    time: "9:32 AM",
    read: true,
  },
  {
    id: "3",
    text: "Yeah sure, I will prepare myself and know what next.",
    sent: false,
    time: "9:35 AM",
    read: false,
  },
];

const MOCK_GROUP_MESSAGES: Message[] = [
  {
    id: "1",
    text: "I love man u team alot",
    sent: false,
    time: "9:30 AM",
    sender: "james",
  },
  {
    id: "2",
    text: "Same here!",
    sent: false,
    time: "9:31 AM",
    sender: "patrica",
  },
  {
    id: "3",
    text: "I love man u team alot",
    sent: false,
    time: "9:32 AM",
    sender: "james",
    replyTo: { id: "1", text: "I love man u team alot", sender: "james" },
  },
  {
    id: "4",
    text: "that team is not good at all",
    sent: false,
    time: "9:33 AM",
    sender: "blessing",
  },
  {
    id: "5",
    text: "Leave man u oo, them no sabi.",
    sent: false,
    time: "9:34 AM",
    sender: "AJ",
  },
  {
    id: "6",
    text: "Man u for mold",
    sent: false,
    time: "9:35 AM",
    sender: "jackson",
  },
];

const COMPATIBILITY_QUESTIONS = [
  "What are your financial values?",
  "What is Parenting style?",
  "How do you handle conflict?",
  "What are your love languages?",
];

const CONNECTION_OPTIONS = [
  "Casual chat",
  "Getting Serious",
  "Dating",
  "Exclusive",
];

type SheetType = "leave" | "block" | "report" | "joinGroup" | "planMeetup" | null;

const PRIVATE_OPTIONS_MENU = [
  { label: "Call", appendName: true, icon: <CallOptionIcon size={24} />, sheet: null as SheetType, callType: "voice" as string | null },
  { label: "Video Call", appendName: true, icon: <VideoCallOptionIcon size={24} />, sheet: null as SheetType, callType: "video" as string | null },
  { label: "Plan a meetup", appendName: false, icon: <PlanMeetupOptionIcon size={24} />, sheet: "planMeetup" as SheetType, callType: null as string | null },
  { label: "Block", appendName: false, icon: <BlockOptionIcon size={24} />, sheet: "block" as SheetType, callType: null as string | null },
  { label: "Report", appendName: false, icon: <ReportOptionIcon size={24} />, sheet: "report" as SheetType, callType: null as string | null },
];

const GROUP_OPTIONS_MENU = [
  { label: "Leave Group", appendName: false, icon: <LeaveGroupOptionIcon size={24} />, sheet: "leave" as SheetType, callType: null as string | null },
  { label: "Report Group", appendName: false, icon: <ReportOptionIcon size={24} />, sheet: "report" as SheetType, callType: null as string | null },
];

export default function ChatConversationScreen() {
  const router = useRouter();
  const { name = "Patricia", id: chatId = "0", isGroup: isGroupParam, avatar: avatarParam, recipientId: recipientIdParam, isOnline: isOnlineParam } = useLocalSearchParams<{
    name: string;
    id: string;
    isGroup: string;
    avatar: string;
    recipientId: string;
    isOnline: string;
  }>();
  const isGroup = isGroupParam === "1";
  const currentUserId = getAuthUser()?.id ?? "";
  const compatKey = `compat_dismissed_${chatId}`;
  const joinedKey = `group_joined_${chatId}`;
  const [message, setMessage] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [showCompatibility, setShowCompatibility] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const likeScale = useRef(new Animated.Value(1)).current;
  const interactionMutation = useInteractionMutation();

  // Fetch real messages from API
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessagesQuery(chatId);

  // Map API messages to local Message format (reversed since API returns newest first)
  const apiMessages: Message[] = useMemo(() => {
    if (!messagesData?.pages) return [];
    const allApiMsgs: ChatMessage[] = messagesData.pages.flatMap(
      (page) => page.result ?? page
    );
    return allApiMsgs
      .map((m) => ({
        id: m.id,
        text: m.content,
        sent: m.senderId === currentUserId,
        time: new Date(m.createdAt).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
        read: m.isRead,
        sender: isGroup ? m.sender?.fullName : undefined,
        replyTo: m.replyTo
          ? {
              id: m.replyTo.id,
              text: m.replyTo.content,
              sender: m.replyTo.sender?.fullName,
            }
          : undefined,
        deleted: m.isDeleted,
      }))
      .reverse();
  }, [messagesData, currentUserId, isGroup]);

  // Local messages for optimistic sends — cleared when API data updates
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const prevApiCountRef = useRef(0);
  if (apiMessages.length !== prevApiCountRef.current) {
    prevApiCountRef.current = apiMessages.length;
    if (localMessages.length > 0) {
      setLocalMessages([]);
    }
  }
  const messages = [...apiMessages, ...localMessages];

  // Socket: real-time events
  const { typingUser, isRecipientOnline } = useChatSocket(chatId);
  const isOnline = isRecipientOnline ?? isOnlineParam === "1";

  // Typing debounce
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [contextMsg, setContextMsg] = useState<Message | null>(null);
  const [deleteMsg, setDeleteMsg] = useState<Message | null>(null);
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const scrollViewRef = useRef<any>(null);

  // Load compatibility dismissed state from storage
  useEffect(() => {
    AsyncStorage.getItem(compatKey).then((val) => {
      if (val !== "1") setShowCompatibility(true);
    });
  }, [compatKey]);

  // Show join group sheet on first visit for group chats
  useEffect(() => {
    if (!isGroup) return;
    AsyncStorage.getItem(joinedKey).then((val) => {
      if (val !== "1") {
        // Small delay so the screen renders first
        setTimeout(() => openSheet("joinGroup"), 500);
      }
    });
  }, [isGroup, joinedKey]);

  const dismissCompatibility = useCallback(() => {
    setShowCompatibility(false);
    AsyncStorage.setItem(compatKey, "1");
  }, [compatKey]);

  // Questionnaire bottom sheet state
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaireStep, setQuestionnaireStep] = useState<
    "question" | "success"
  >("question");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Generic bottom sheet state (leave, block, report, joinGroup, planMeetup)
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [reportStep, setReportStep] = useState<"form" | "success">("form");
  const [reportText, setReportText] = useState("");
  const [meetupStep, setMeetupStep] = useState<"form" | "success">("form");
  const [meetupTitle, setMeetupTitle] = useState("");
  const [meetupLocation, setMeetupLocation] = useState("");
  const [meetupDate, setMeetupDate] = useState<Date | null>(null);
  const [meetupTime, setMeetupTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const closeSheetRef = useRef<() => void>(() => {});

  // Pan responder for draggable bottom sheet
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down (positive dy)
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If dragged down more than 100px, close the sheet
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          closeQuestionnaire();
        } else {
          // Snap back to open position
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  // Pan responder for the drag handle on input bar (drag UP to open)
  const inputBarPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 10,
      onPanResponderRelease: (_, gestureState) => {
        // If swiped up (negative dy), open the sheet
        if (gestureState.dy < -30 || gestureState.vy < -0.3) {
          openQuestionnaire();
        }
      },
    })
  ).current;

  const openQuestionnaire = () => {
    setQuestionnaireStep("question");
    setSelectedOptions([]);
    setShowQuestionnaire(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeQuestionnaire = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowQuestionnaire(false);
      setSelectedOptions([]);
    });
  };

  const toggleOption = (option: string) => {
    setSelectedOptions((prev) =>
      prev.includes(option) ? [] : [option]
    );
  };

  const handleSubmit = () => {
    setQuestionnaireStep("success");
  };

  // ── Generic sheet open / close ──
  const openSheet = useCallback((type: SheetType) => {
    setActiveSheet(type);
    setReportStep("form");
    setReportText("");
    setMeetupStep("form");
    setMeetupTitle("");
    setMeetupLocation("");
    setMeetupDate(null);
    setMeetupTime(null);
    setShowDatePicker(false);
    setShowTimePicker(false);
    Animated.spring(sheetAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [sheetAnim]);

  const closeSheet = useCallback(() => {
    Animated.timing(sheetAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setActiveSheet(null);
      setReportStep("form");
      setReportText("");
      setMeetupStep("form");
      setMeetupTitle("");
      setMeetupLocation("");
      setMeetupDate(null);
      setMeetupTime(null);
      setShowDatePicker(false);
      setShowTimePicker(false);
    });
  }, [sheetAnim]);

  closeSheetRef.current = closeSheet;

  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          sheetAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          closeSheetRef.current();
        } else {
          Animated.spring(sheetAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  const handleSend = () => {
    if (!message.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Edit mode — emit via socket
    if (editingMsg) {
      emitEditMessage(editingMsg.id, message.trim());
      setLocalMessages((prev) =>
        prev.map((m) =>
          m.id === editingMsg.id
            ? { ...m, text: message.trim(), edited: true }
            : m
        )
      );
      setMessage("");
      setEditingMsg(null);
      return;
    }

    // Send message via socket
    emitSendMessage({
      conversationId: chatId,
      content: message.trim(),
      replyToId: replyingTo?.id,
    });

    // Optimistic local message
    const newMsg: Message = {
      id: String(Date.now()),
      text: message.trim(),
      sent: true,
      time: "Now",
      read: false,
    };
    if (replyingTo) {
      newMsg.replyTo = {
        id: replyingTo.id,
        text: replyingTo.text,
        sender: replyingTo.sender,
      };
    }
    setLocalMessages((prev) => [...prev, newMsg]);
    setMessage("");
    setReplyingTo(null);
    emitTyping(chatId, false);
  };

  // Emit typing indicator on text input change
  const handleTextChange = (text: string) => {
    setMessage(text);
    if (text.trim().length > 0) {
      emitTyping(chatId, true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => emitTyping(chatId, false), 2000);
    } else {
      emitTyping(chatId, false);
    }
  };

  const handleDeleteForMe = (msg: Message) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    emitDeleteMessage(msg.id, "me");
    setLocalMessages((prev) => prev.filter((m) => m.id !== msg.id));
    setDeleteMsg(null);
  };

  const handleDeleteForEveryone = (msg: Message) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    emitDeleteMessage(msg.id, "everyone");
    setLocalMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id
          ? { ...m, text: "This message was deleted", deleted: true, replyTo: undefined, edited: false }
          : m
      )
    );
    setDeleteMsg(null);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <VStack flex={1}>
          {/* Header */}
          <HStack
            px="$4"
            py="$3"
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth={1}
            borderBottomColor="#F4F3F2"
          >
            <HStack alignItems="center" space="sm" flex={1}>
              <Pressable
                onPress={() => router.back()}
                w={36}
                h={36}
                borderRadius={18}
                bg="#F5F5F5"
                justifyContent="center"
                alignItems="center"
              >
                <MaterialIcons name="arrow-back" size={20} color="#1A1A1A" />
              </Pressable>

              {/* Avatar */}
              {avatarParam ? (
                <Box w={36} h={36} borderRadius={18} overflow="hidden">
                  <Image
                    source={{ uri: avatarParam }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                </Box>
              ) : (
                <Box
                  w={36}
                  h={36}
                  borderRadius={18}
                  bg="#F0C4C8"
                  justifyContent="center"
                  alignItems="center"
                >
                  <MaterialIcons name="person" size={20} color={PRIMARY_COLOR} />
                </Box>
              )}

              <VStack flex={1}>
                <Text
                  fontSize={17}
                  fontWeight="$bold"
                  color="#1A1A1A"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {name}
                </Text>
                {!isGroup && (
                  <HStack alignItems="center" space="xs">
                    <Box
                      w={8}
                      h={8}
                      borderRadius={4}
                      bg={isOnline ? "#4CAF50" : "#BDBDBD"}
                    />
                    <Text fontSize={12} color={isOnline ? "#4CAF50" : "#999999"}>
                      {isOnline ? "Online" : "Offline"}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </HStack>

            <HStack alignItems="center" space="md">
              {!isGroup && recipientIdParam ? (
                <Pressable
                  disabled={interactionMutation.isPending}
                  onPress={() => {
                    const newLiked = !isLiked;
                    Haptics.impactAsync(
                      newLiked
                        ? Haptics.ImpactFeedbackStyle.Medium
                        : Haptics.ImpactFeedbackStyle.Light
                    );
                    Animated.sequence([
                      Animated.spring(likeScale, {
                        toValue: 1.4,
                        useNativeDriver: true,
                        speed: 50,
                        bounciness: 12,
                      }),
                      Animated.spring(likeScale, {
                        toValue: 1,
                        useNativeDriver: true,
                        speed: 30,
                        bounciness: 8,
                      }),
                    ]).start();
                    setIsLiked(newLiked);
                    interactionMutation.mutate(
                      {
                        receiverId: recipientIdParam,
                        type: newLiked ? "like" : "dislike",
                      },
                      {
                        onError: () => setIsLiked(!newLiked),
                      }
                    );
                  }}
                >
                  <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                    <HeartIcon size={28} isLiked={isLiked} />
                  </Animated.View>
                </Pressable>
              ) : null}
              <Pressable onPress={() => setShowOptions(!showOptions)}>
                <MaterialIcons name="more-vert" size={24} color="#1A1A1A" />
              </Pressable>
            </HStack>
          </HStack>

          {/* Options Dropdown */}
          {showOptions && (
            <Box
              position="absolute"
              top={70}
              right={16}
              bg="#FFFFFF"
              borderRadius={12}
              py="$2"
              px="$1"
              zIndex={100}
              shadowColor="#000000"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.15}
              shadowRadius={8}
              elevation={5}
              minWidth={200}
            >
              {(isGroup ? GROUP_OPTIONS_MENU : PRIVATE_OPTIONS_MENU).map((option) => (
                <Pressable
                  key={option.label}
                  onPress={() => {
                    setShowOptions(false);
                    if (option.callType) {
                      router.push({
                        pathname: "/call-screen",
                        params: { name, type: option.callType },
                      });
                    } else if (option.sheet) {
                      openSheet(option.sheet);
                    }
                  }}
                  px="$4"
                  py="$3"
                >
                  <HStack alignItems="center" space="md">
                    {option.icon}
                    <Text
                      fontSize={14}
                      color="#1A1A1A"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      flex={1}
                    >
                      {option.label}{option.appendName ? ` ${name}` : ""}
                    </Text>
                  </HStack>
                </Pressable>
              ))}
            </Box>
          )}

          {showOptions && (
            <Pressable
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              zIndex={99}
              onPress={() => setShowOptions(false)}
            />
          )}

          {/* Date Separator */}
          <Box alignItems="center" py="$3">
            <Text fontSize={12} color="#999999">
              Mar. 13, 2026
            </Text>
          </Box>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            flex={1}
            px="$4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
            onScroll={({ nativeEvent }) => {
              // Load older messages when scrolled near top
              if (
                nativeEvent.contentOffset.y < 50 &&
                hasNextPage &&
                !isFetchingNextPage
              ) {
                fetchNextPage();
              }
            }}
            scrollEventThrottle={400}
          >
            {isFetchingNextPage && (
              <Box py="$3" alignItems="center">
                <Text fontSize={12} color="#999999">Loading older messages...</Text>
              </Box>
            )}
            {messages.map((msg) => (
              <Pressable
                key={msg.id}
                onLongPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setContextMsg(msg);
                }}
              >
                <Box
                  alignItems={msg.sent ? "flex-end" : "flex-start"}
                  mb="$3"
                >
                  {/* Group sender name + avatar */}
                  {isGroup && !msg.sent && msg.sender && (
                    <HStack alignItems="center" space="xs" mb="$1" ml="$1">
                      <Box
                        w={20}
                        h={20}
                        borderRadius={10}
                        bg="#D0C4D8"
                        justifyContent="center"
                        alignItems="center"
                        overflow="hidden"
                      >
                        <MaterialIcons name="person" size={12} color="#FFFFFF" />
                      </Box>
                      <Text fontSize={12} color="#999999">
                        -{msg.sender}
                      </Text>
                    </HStack>
                  )}

                  {/* Single bubble with optional reply inside */}
                  <Box
                    maxWidth="75%"
                    bg={msg.deleted
                      ? "transparent"
                      : msg.sent ? PRIMARY_COLOR : "#E6E5EB"}
                    borderRadius={18}
                    borderBottomRightRadius={msg.sent ? 4 : 18}
                    borderBottomLeftRadius={msg.sent ? 18 : 4}
                    overflow="hidden"
                    {...(msg.deleted && {
                      borderWidth: 1,
                      borderColor: "#D0D0D0",
                    })}
                  >
                    {/* Deleted message */}
                    {msg.deleted ? (
                      <HStack px="$4" py="$3" alignItems="center" space="xs">
                        <MaterialIcons name="block" size={14} color="#999999" />
                        <Text
                          fontSize={14}
                          color="#999999"
                          fontStyle="italic"
                        >
                          This message was deleted
                        </Text>
                      </HStack>
                    ) : (
                      <>
                        {/* Quoted reply inside the bubble */}
                        {msg.replyTo && (
                          <Box
                            bg={msg.sent ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.06)"}
                            mx="$2"
                            mt="$2"
                            borderRadius={10}
                            px="$3"
                            py="$2"
                          >
                            <Box
                              borderLeftWidth={3}
                              borderLeftColor={msg.sent ? "#FFFFFF" : PRIMARY_COLOR}
                              pl="$2"
                            >
                              <Text
                                fontSize={12}
                                fontWeight="$bold"
                                color={msg.sent ? "#FFFFFF" : PRIMARY_COLOR}
                              >
                                {msg.replyTo.sender || name}
                              </Text>
                              <Text
                                fontSize={12}
                                color={msg.sent ? "rgba(255,255,255,0.8)" : "#666666"}
                                numberOfLines={2}
                              >
                                {msg.replyTo.text}
                              </Text>
                            </Box>
                          </Box>
                        )}

                        {/* Message text */}
                        <Box px="$4" py="$3">
                          <Text
                            fontSize={14}
                            color={msg.sent ? "#FFFFFF" : "#1A1A1A"}
                            lineHeight={20}
                          >
                            {msg.text}
                          </Text>

                          {/* Edited + read receipts row */}
                          <HStack justifyContent={msg.edited ? "space-between" : "flex-end"} alignItems="center" mt="$0.5">
                            {msg.edited && (
                              <Text
                                fontSize={11}
                                fontStyle="italic"
                                color={msg.sent ? "rgba(255,255,255,0.6)" : "#999999"}
                              >
                                edited
                              </Text>
                            )}
                            {!isGroup && msg.sent && (
                              <MaterialIcons
                                name="done-all"
                                size={14}
                                color={msg.read ? "#53BDEB" : "rgba(255,255,255,0.5)"}
                              />
                            )}
                          </HStack>
                        </Box>
                      </>
                    )}
                  </Box>
                </Box>
              </Pressable>
            ))}
          </ScrollView>

          {/* Deeper Compatibility Questions Bar */}
          {showCompatibility && (
            <Box borderTopWidth={1} borderTopColor="#F4F3F2">
              <HStack
                px="$4"
                py="$2"
                alignItems="center"
                justifyContent="space-between"
              >
                <Text fontSize={13} fontWeight="$semibold" color="#1A1A1A">
                  Deeper Compatibility Questions
                </Text>
                <Pressable onPress={dismissCompatibility}>
                  <MaterialIcons name="cancel" size={20} color="#999999" />
                </Pressable>
              </HStack>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: 8,
                  gap: 8,
                }}
              >
                {COMPATIBILITY_QUESTIONS.map((question) => (
                  <Pressable
                    key={question}
                    borderWidth={1}
                    borderColor="#E0E0E0"
                    borderRadius={20}
                    px="$3"
                    py="$2"
                    onPress={() => setMessage(question)}
                  >
                    <Text fontSize={12} color="#1A1A1A">
                      {question}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Box>
          )}

          {/* Editing bar */}
          {editingMsg && (
            <Box bg="#E8F5E9" borderTopWidth={1} borderTopColor="#C8E6C9" px="$4" py="$2">
              <HStack alignItems="center" justifyContent="space-between">
                <HStack flex={1} alignItems="center" space="sm">
                  <MaterialIcons name="edit" size={16} color="#4CAF50" />
                  <Box flex={1}>
                    <Text fontSize={12} fontWeight="$bold" color="#4CAF50">
                      Editing message
                    </Text>
                    <Text fontSize={13} color="#666666" numberOfLines={1}>
                      {editingMsg.text}
                    </Text>
                  </Box>
                </HStack>
                <Pressable onPress={() => { setEditingMsg(null); setMessage(""); }} p="$1">
                  <MaterialIcons name="close" size={18} color="#999999" />
                </Pressable>
              </HStack>
            </Box>
          )}

          {/* Reply preview bar */}
          {replyingTo && !editingMsg && (
            <Box bg="#F5F5F5" borderTopWidth={1} borderTopColor="#F4F3F2" px="$4" py="$2">
              <HStack alignItems="center" justifyContent="space-between">
                <Box flex={1} borderLeftWidth={3} borderLeftColor={PRIMARY_COLOR} pl="$2">
                  <Text fontSize={12} fontWeight="$bold" color={PRIMARY_COLOR}>
                    {replyingTo.sender || (replyingTo.sent ? "You" : name)}
                  </Text>
                  <Text fontSize={13} color="#666666" numberOfLines={1}>
                    {replyingTo.text}
                  </Text>
                </Box>
                <Pressable onPress={() => setReplyingTo(null)} p="$1">
                  <MaterialIcons name="close" size={18} color="#999999" />
                </Pressable>
              </HStack>
            </Box>
          )}

          {/* Typing indicator */}
          {typingUser && (
            <Box px="$5" py="$1" bg="#FFFFFF">
              <Text fontSize={12} color="#999999" fontStyle="italic">
                {typingUser} is typing...
              </Text>
            </Box>
          )}

          {/* Message Input Bar */}
          <Box bg="#FFFFFF" borderTopWidth={1} borderTopColor="#F4F3F2">
              <HStack px="$4" py="$2" alignItems="center" space="sm">
                <Pressable
                  w={36}
                  h={36}
                  justifyContent="center"
                  alignItems="center"
                >
                  <CameraIcon size={24} color="#1A1A1A" />
                </Pressable>

                <Box flex={1} bg="#F5F5F5" borderRadius={22} borderWidth={1} borderColor="#E0E0E0" minHeight={40} maxHeight={100} justifyContent="center">
                  <HStack alignItems="flex-end">
                    <TextInput
                      placeholder="Message..."
                      placeholderTextColor="#999999"
                      style={{
                        fontSize: 14,
                        color: "#1A1A1A",
                        flex: 1,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        maxHeight: 90,
                      }}
                      value={message}
                      onChangeText={handleTextChange}
                      multiline
                      blurOnSubmit={false}
                    />
                    <Pressable pr="$3" pb="$2.5">
                      <MicrophoneIcon size={18} color={PRIMARY_COLOR} />
                    </Pressable>
                  </HStack>
                </Box>

                <Pressable
                  w={40}
                  h={40}
                  bg={PRIMARY_COLOR}
                  borderRadius={20}
                  justifyContent="center"
                  alignItems="center"
                  onPress={handleSend}
                >
                  <SendIcon size={18} color="#FFFFFF" />
                </Pressable>
              </HStack>

              {/* Draggable Bottom Sheet Handle — swipe up to open questionnaire (private only) */}
              {!isGroup && (
                <Box
                  {...inputBarPanResponder.panHandlers}
                  alignItems="center"
                  pb="$1"
                  pt="$1"
                >
                  <Box w={120} h={4} borderRadius={3} bg="#1A1A1A" />
                </Box>
              )}
          </Box>
        </VStack>
      </KeyboardAvoidingView>

      {/* Message context action bar (WhatsApp-style top bar) */}
      {contextMsg && !contextMsg.deleted && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={200}
        >
          <TouchableWithoutFeedback onPress={() => setContextMsg(null)}>
            <Box flex={1} bg="rgba(0,0,0,0.15)">
              <Box bg="#FFFFFF" pt="$12" pb="$3" px="$4"
                shadowColor="#000000"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.1}
                shadowRadius={4}
                elevation={5}
              >
                <HStack justifyContent="space-around" alignItems="center">
                  <Pressable
                    alignItems="center"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setReplyingTo(contextMsg);
                      setContextMsg(null);
                    }}
                    px="$3"
                    py="$1"
                  >
                    <MaterialIcons name="reply" size={22} color="#1A1A1A" />
                    <Text fontSize={11} color="#1A1A1A" mt="$0.5">Reply</Text>
                  </Pressable>
                  <Pressable
                    alignItems="center"
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      await Clipboard.setStringAsync(contextMsg.text);
                      setContextMsg(null);
                    }}
                    px="$3"
                    py="$1"
                  >
                    <MaterialIcons name="content-copy" size={22} color="#1A1A1A" />
                    <Text fontSize={11} color="#1A1A1A" mt="$0.5">Copy</Text>
                  </Pressable>
                  {contextMsg.sent && (
                    <Pressable
                      alignItems="center"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setEditingMsg(contextMsg);
                        setMessage(contextMsg.text);
                        setContextMsg(null);
                      }}
                      px="$3"
                      py="$1"
                    >
                      <MaterialIcons name="edit" size={22} color="#1A1A1A" />
                      <Text fontSize={11} color="#1A1A1A" mt="$0.5">Edit</Text>
                    </Pressable>
                  )}
                  <Pressable
                    alignItems="center"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setForwardMsg(contextMsg);
                      setContextMsg(null);
                    }}
                    px="$3"
                    py="$1"
                  >
                    <MaterialIcons name="shortcut" size={22} color="#1A1A1A" />
                    <Text fontSize={11} color="#1A1A1A" mt="$0.5">Forward</Text>
                  </Pressable>
                  <Pressable
                    alignItems="center"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDeleteMsg(contextMsg);
                      setContextMsg(null);
                    }}
                    px="$3"
                    py="$1"
                  >
                    <MaterialIcons name="delete-outline" size={22} color="#1A1A1A" />
                    <Text fontSize={11} color="#1A1A1A" mt="$0.5">Delete</Text>
                  </Pressable>
                </HStack>
              </Box>
            </Box>
          </TouchableWithoutFeedback>
        </Box>
      )}

      {/* Delete confirmation modal (WhatsApp-style) */}
      <Modal
        visible={!!deleteMsg}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteMsg(null)}
      >
        <TouchableWithoutFeedback onPress={() => setDeleteMsg(null)}>
          <Box flex={1} bg="rgba(0,0,0,0.5)" justifyContent="center" alignItems="center">
            <TouchableWithoutFeedback>
              <Box bg="#FFFFFF" borderRadius={16} p="$5" mx="$6" w="85%" maxWidth={320}>
                <Text fontSize={16} fontWeight="$bold" color="#1A1A1A" mb="$4">
                  Delete message?
                </Text>

                {deleteMsg?.sent && (
                  <Pressable
                    borderWidth={1}
                    borderColor={PRIMARY_COLOR}
                    borderRadius={24}
                    py="$2.5"
                    alignItems="center"
                    mb="$3"
                    onPress={() => deleteMsg && handleDeleteForEveryone(deleteMsg)}
                  >
                    <Text fontSize={14} fontWeight="$semibold" color={PRIMARY_COLOR}>
                      Delete for everyone
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  borderWidth={1}
                  borderColor={PRIMARY_COLOR}
                  borderRadius={24}
                  py="$2.5"
                  alignItems="center"
                  mb="$3"
                  onPress={() => deleteMsg && handleDeleteForMe(deleteMsg)}
                >
                  <Text fontSize={14} fontWeight="$semibold" color={PRIMARY_COLOR}>
                    Delete for me
                  </Text>
                </Pressable>

                <Pressable
                  py="$2.5"
                  alignItems="center"
                  onPress={() => setDeleteMsg(null)}
                >
                  <Text fontSize={14} fontWeight="$semibold" color="#999999">
                    Cancel
                  </Text>
                </Pressable>
              </Box>
            </TouchableWithoutFeedback>
          </Box>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Forward message modal */}
      <Modal
        visible={!!forwardMsg}
        transparent
        animationType="fade"
        onRequestClose={() => setForwardMsg(null)}
      >
        <TouchableWithoutFeedback onPress={() => setForwardMsg(null)}>
          <Box flex={1} bg="rgba(0,0,0,0.5)" justifyContent="flex-end">
            <TouchableWithoutFeedback>
              <Box
                bg="#FFFFFF"
                borderTopLeftRadius={24}
                borderTopRightRadius={24}
                pb="$6"
                pt="$4"
                px="$5"
                maxHeight={SCREEN_HEIGHT * 0.5}
              >
                <Text fontSize={18} fontWeight="$bold" color="#1A1A1A" mb="$1">
                  Forward to
                </Text>
                <Text fontSize={13} color="#999999" mb="$4">
                  Select a chat to forward the message
                </Text>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {["Patrica", "Princess", "Football Lovers", "Juliet", "Foodies"].map(
                    (contact) => (
                      <Pressable
                        key={contact}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setForwardMsg(null);
                        }}
                        py="$3"
                        borderBottomWidth={1}
                        borderBottomColor="#F4F3F2"
                      >
                        <HStack alignItems="center" space="md">
                          <Box
                            w={36}
                            h={36}
                            borderRadius={18}
                            bg="#F0C4C8"
                            justifyContent="center"
                            alignItems="center"
                          >
                            <MaterialIcons name="person" size={20} color={PRIMARY_COLOR} />
                          </Box>
                          <Text fontSize={15} color="#1A1A1A" flex={1}>
                            {contact}
                          </Text>
                          <MaterialIcons name="send" size={18} color={PRIMARY_COLOR} />
                        </HStack>
                      </Pressable>
                    )
                  )}
                </ScrollView>
              </Box>
            </TouchableWithoutFeedback>
          </Box>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Questionnaire Bottom Sheet Modal */}
      <Modal
        visible={showQuestionnaire}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={closeQuestionnaire}>
          <Box flex={1} bg="rgba(0,0,0,0.5)" justifyContent="flex-end">
            <TouchableWithoutFeedback>
              <Animated.View
                style={{ transform: [{ translateY: slideAnim }] }}
              >
                <Box
                  bg={PRIMARY_COLOR}
                  borderTopLeftRadius={24}
                  borderTopRightRadius={24}
                  px="$6"
                  pt="$0"
                  pb="$8"
                >
                  {/* Draggable Handle Area */}
                  <Box
                    {...panResponder.panHandlers}
                    alignItems="center"
                    pt="$4"
                    pb="$4"
                  >
                    <Box
                      w={40}
                      h={5}
                      borderRadius={3}
                      bg="rgba(255,255,255,0.5)"
                    />
                  </Box>

                  {questionnaireStep === "question" ? (
                    <>
                      {/* Couple Images with Dual Starburst */}
                      <Box alignItems="center" mb="$4">
                        <DualStarburstFrame
                          width={310}
                          height={210}
                          leftImageUri="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&crop=top"
                          rightImageUri="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop&crop=top"
                        />
                      </Box>

                      <Text
                        fontSize={20}
                        fontWeight="$bold"
                        color="#FFFFFF"
                        textAlign="center"
                        mb="$1"
                      >
                        How is your connection going?
                      </Text>
                      <Text
                        fontSize={14}
                        color="rgba(255,255,255,0.8)"
                        textAlign="center"
                        mb="$5"
                      >
                        Select your preferred answer
                      </Text>

                      {/* Option Chips */}
                      <HStack
                        flexWrap="wrap"
                        justifyContent="center"
                        mb="$6"
                        gap={10}
                      >
                        {CONNECTION_OPTIONS.map((option) => {
                          const isSelected = selectedOptions.includes(option);
                          return (
                            <Pressable
                              key={option}
                              onPress={() => toggleOption(option)}
                              borderWidth={1.5}
                              borderColor="#FFFFFF"
                              borderRadius={20}
                              px="$4"
                              py="$2"
                              bg={isSelected ? "#FFFFFF" : "transparent"}
                            >
                              <Text
                                fontSize={14}
                                fontWeight="$medium"
                                color={isSelected ? PRIMARY_COLOR : "#FFFFFF"}
                              >
                                {option}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </HStack>

                      {/* Submit Button */}
                      <Pressable
                        bg={
                          selectedOptions.length > 0
                            ? "#FFFFFF"
                            : "rgba(255,255,255,0.4)"
                        }
                        borderRadius={28}
                        py="$3"
                        alignItems="center"
                        mb="$3"
                        onPress={
                          selectedOptions.length > 0 ? handleSubmit : undefined
                        }
                      >
                        <Text
                          fontSize={16}
                          fontWeight="$semibold"
                          color={
                            selectedOptions.length > 0
                              ? PRIMARY_COLOR
                              : "rgba(255,255,255,0.6)"
                          }
                        >
                          Submit
                        </Text>
                      </Pressable>

                      {/* Cancel Button */}
                      <Pressable
                        borderWidth={1.5}
                        borderColor="#FFFFFF"
                        borderRadius={28}
                        py="$3"
                        alignItems="center"
                        onPress={closeQuestionnaire}
                      >
                        <Text
                          fontSize={16}
                          fontWeight="$semibold"
                          color="#FFFFFF"
                        >
                          Cancel
                        </Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      {/* Success State */}
                      <Box alignItems="center" mb="$4">
                        <DualStarburstFrame
                          width={310}
                          height={210}
                          leftImageUri="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&crop=top"
                          rightImageUri="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop&crop=top"
                        />
                      </Box>

                      <Text
                        fontSize={20}
                        fontWeight="$bold"
                        color="#FFFFFF"
                        textAlign="center"
                        mb="$6"
                      >
                        Keep up the conversation
                      </Text>

                      <Pressable
                        bg="#FFFFFF"
                        borderRadius={28}
                        py="$3"
                        alignItems="center"
                        onPress={closeQuestionnaire}
                      >
                        <Text
                          fontSize={16}
                          fontWeight="$semibold"
                          color="#1A1A1A"
                        >
                          Continue your Conversation
                        </Text>
                      </Pressable>
                    </>
                  )}
                </Box>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Box>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Leave / Block / Report / Join Group Bottom Sheet ── */}
      <Modal
        visible={!!activeSheet}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={closeSheet}>
          <Box flex={1} bg="rgba(0,0,0,0.5)" justifyContent="flex-end">
            <TouchableWithoutFeedback>
              <Animated.View
                style={{ transform: [{ translateY: sheetAnim }] }}
              >
                {/* ── Leave Group ── */}
                {activeSheet === "leave" && (
                  <Box
                    bg={PRIMARY_COLOR}
                    borderTopLeftRadius={24}
                    borderTopRightRadius={24}
                    px="$6"
                    pb="$8"
                  >
                    <Box
                      {...sheetPanResponder.panHandlers}
                      alignItems="center"
                      pt="$4"
                      pb="$4"
                    >
                      <Box
                        w={40}
                        h={5}
                        borderRadius={3}
                        bg="rgba(255,255,255,0.5)"
                      />
                    </Box>

                    <Text
                      fontSize={20}
                      fontWeight="$bold"
                      color="#FFFFFF"
                      textAlign="center"
                      mb="$6"
                      px="$2"
                    >
                      Are you sure you want to{"\n"}exit {name} group?
                    </Text>

                    <Pressable
                      borderWidth={1.5}
                      borderColor="#FFFFFF"
                      borderRadius={28}
                      py="$3"
                      alignItems="center"
                      mb="$3"
                      onPress={closeSheet}
                    >
                      <Text
                        fontSize={16}
                        fontWeight="$semibold"
                        color="#FFFFFF"
                      >
                        Yes
                      </Text>
                    </Pressable>

                    <Pressable
                      bg="#FFFFFF"
                      borderRadius={28}
                      py="$3"
                      alignItems="center"
                      onPress={closeSheet}
                    >
                      <Text
                        fontSize={16}
                        fontWeight="$bold"
                        color="#1A1A1A"
                      >
                        No
                      </Text>
                    </Pressable>
                  </Box>
                )}

                {/* ── Block ── */}
                {activeSheet === "block" && (
                  <Box
                    bg={PRIMARY_COLOR}
                    borderTopLeftRadius={24}
                    borderTopRightRadius={24}
                    px="$6"
                    pb="$8"
                  >
                    <Box
                      {...sheetPanResponder.panHandlers}
                      alignItems="center"
                      pt="$4"
                      pb="$4"
                    >
                      <Box
                        w={40}
                        h={5}
                        borderRadius={3}
                        bg="rgba(255,255,255,0.5)"
                      />
                    </Box>

                    <Text
                      fontSize={20}
                      fontWeight="$bold"
                      color="#FFFFFF"
                      textAlign="center"
                      mb="$2"
                      px="$2"
                    >
                      Are you sure you want to{"\n"}block {name}?
                    </Text>

                    <Text
                      fontSize={14}
                      color="rgba(255,255,255,0.8)"
                      textAlign="center"
                      mb="$6"
                    >
                      You will loose your love rate progress, if{"\n"}you proceed.
                    </Text>

                    <Pressable
                      borderWidth={1.5}
                      borderColor="#FFFFFF"
                      borderRadius={28}
                      py="$3"
                      alignItems="center"
                      mb="$3"
                      onPress={closeSheet}
                    >
                      <Text
                        fontSize={16}
                        fontWeight="$semibold"
                        color="#FFFFFF"
                      >
                        Yes
                      </Text>
                    </Pressable>

                    <Pressable
                      bg="#FFFFFF"
                      borderRadius={28}
                      py="$3"
                      alignItems="center"
                      onPress={closeSheet}
                    >
                      <Text
                        fontSize={16}
                        fontWeight="$bold"
                        color="#1A1A1A"
                      >
                        No
                      </Text>
                    </Pressable>
                  </Box>
                )}

                {/* ── Report ── */}
                {activeSheet === "report" && reportStep === "form" && (
                  <Box
                    bg="#FFFFFF"
                    borderTopLeftRadius={24}
                    borderTopRightRadius={24}
                    pb="$6"
                  >
                    {/* Drag handle */}
                    <Box
                      {...sheetPanResponder.panHandlers}
                      alignItems="center"
                      pt="$4"
                      pb="$4"
                    >
                      <Box
                        w={40}
                        h={5}
                        borderRadius={3}
                        bg="#CCCCCC"
                      />
                    </Box>

                    <Box px="$6" pt="$1">
                      <Text
                        fontSize={20}
                        fontWeight="$bold"
                        color="#1A1A1A"
                        mb="$1"
                      >
                        Report {name}
                      </Text>
                      <Text fontSize={14} color="#999999" mb="$5">
                        Type out your report
                      </Text>

                      <Box
                        borderWidth={1}
                        borderColor="#E0E0E0"
                        borderRadius={12}
                        p="$4"
                        mb="$6"
                        bg="#F5F3F0"
                        minHeight={150}
                      >
                        <TextInput
                          value={reportText}
                          onChangeText={setReportText}
                          multiline
                          style={{
                            fontSize: 15,
                            color: "#1A1A1A",
                            minHeight: 110,
                            textAlignVertical: "top",
                          }}
                          placeholder="State your report"
                          placeholderTextColor="#999999"
                        />
                      </Box>

                      <Pressable
                        bg={reportText.trim() ? PRIMARY_COLOR : "#F5F3F0"}
                        borderRadius={28}
                        py="$3"
                        alignItems="center"
                        mb="$3"
                        onPress={reportText.trim() ? () => setReportStep("success") : undefined}
                      >
                        <Text
                          fontSize={16}
                          fontWeight="$bold"
                          color={reportText.trim() ? "#FFFFFF" : "#CCCCCC"}
                        >
                          Submit Report
                        </Text>
                      </Pressable>

                      <Pressable
                        borderWidth={1.5}
                        borderColor="#1A1A1A"
                        borderRadius={28}
                        py="$3"
                        alignItems="center"
                        onPress={closeSheet}
                      >
                        <Text
                          fontSize={16}
                          fontWeight="$bold"
                          color="#1A1A1A"
                        >
                          Cancel
                        </Text>
                      </Pressable>
                    </Box>
                  </Box>
                )}

                {/* ── Report Success ── */}
                {activeSheet === "report" && reportStep === "success" && (
                  <Box
                    bg={PRIMARY_COLOR}
                    borderTopLeftRadius={24}
                    borderTopRightRadius={24}
                    px="$6"
                    pb="$8"
                  >
                    <Box
                      {...sheetPanResponder.panHandlers}
                      alignItems="center"
                      pt="$4"
                      pb="$4"
                    >
                      <Box
                        w={40}
                        h={5}
                        borderRadius={3}
                        bg="rgba(255,255,255,0.5)"
                      />
                    </Box>

                    <Box alignItems="center" mb="$4">
                      <Image
                        source={require("@/assets/images/two-hearts.png")}
                        style={{ width: 180, height: 160 }}
                        contentFit="contain"
                      />
                    </Box>

                    <Text
                      fontSize={22}
                      fontWeight="$bold"
                      color="#FFFFFF"
                      textAlign="center"
                      mb="$2"
                    >
                      Report Sent
                    </Text>

                    <Text
                      fontSize={14}
                      color="rgba(255,255,255,0.8)"
                      textAlign="center"
                      mb="$6"
                    >
                      Our support team will look into the situation
                    </Text>

                    <Pressable
                      borderWidth={1.5}
                      borderColor="#FFFFFF"
                      borderRadius={28}
                      py="$3"
                      alignItems="center"
                      onPress={closeSheet}
                    >
                      <Text
                        fontSize={16}
                        fontWeight="$semibold"
                        color="#FFFFFF"
                      >
                        Cancel
                      </Text>
                    </Pressable>
                  </Box>
                )}

                {/* ── Plan Meetup Form ── */}
                {activeSheet === "planMeetup" && meetupStep === "form" && (
                  <Box
                    bg="#FFFFFF"
                    borderTopLeftRadius={24}
                    borderTopRightRadius={24}
                    pb="$6"
                  >
                    <Box
                      {...sheetPanResponder.panHandlers}
                      alignItems="center"
                      pt="$4"
                      pb="$4"
                    >
                      <Box
                        w={40}
                        h={5}
                        borderRadius={3}
                        bg="#CCCCCC"
                      />
                    </Box>

                    <Box px="$6" pt="$1">
                      <Text
                        fontSize={20}
                        fontWeight="$bold"
                        color="#1A1A1A"
                        mb="$1"
                      >
                        Plan a Meeting
                      </Text>
                      <Text fontSize={14} color="#999999" mb="$5">
                        Provide the details of meetup
                      </Text>

                      {/* Title */}
                      <Box
                        borderWidth={1}
                        borderColor="#E0E0E0"
                        borderRadius={12}
                        p="$3"
                        mb="$3"
                        bg="#F5F3F0"
                      >
                        {meetupTitle ? (
                          <Text fontSize={11} color="#999999" mb="$0.5">
                            Title of meetup
                          </Text>
                        ) : null}
                        <TextInput
                          value={meetupTitle}
                          onChangeText={setMeetupTitle}
                          style={{ fontSize: 15, color: "#1A1A1A" }}
                          placeholder="Title of meetup"
                          placeholderTextColor="#999999"
                        />
                      </Box>

                      {/* Location */}
                      <Box
                        borderWidth={1}
                        borderColor="#E0E0E0"
                        borderRadius={12}
                        p="$3"
                        mb="$3"
                        bg="#F5F3F0"
                      >
                        {meetupLocation ? (
                          <Text fontSize={11} color="#999999" mb="$0.5">
                            Location
                          </Text>
                        ) : null}
                        <TextInput
                          value={meetupLocation}
                          onChangeText={setMeetupLocation}
                          style={{ fontSize: 15, color: "#1A1A1A" }}
                          placeholder="Location"
                          placeholderTextColor="#999999"
                        />
                      </Box>

                      {/* Date & Time */}
                      <HStack space="md" mb="$6">
                        <Pressable
                          flex={1}
                          borderWidth={1}
                          borderColor="#E0E0E0"
                          borderRadius={12}
                          p="$3"
                          bg="#F5F3F0"
                          onPress={() => setShowDatePicker(true)}
                        >
                          {meetupDate ? (
                            <Text fontSize={11} color="#999999" mb="$0.5">
                              Date
                            </Text>
                          ) : null}
                          <Text
                            fontSize={15}
                            color={meetupDate ? "#1A1A1A" : "#999999"}
                          >
                            {meetupDate
                              ? meetupDate.toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "Date"}
                          </Text>
                        </Pressable>
                        <Pressable
                          flex={1}
                          borderWidth={1}
                          borderColor="#E0E0E0"
                          borderRadius={12}
                          p="$3"
                          bg="#F5F3F0"
                          onPress={() => setShowTimePicker(true)}
                        >
                          {meetupTime ? (
                            <Text fontSize={11} color="#999999" mb="$0.5">
                              Time
                            </Text>
                          ) : null}
                          <Text
                            fontSize={15}
                            color={meetupTime ? "#1A1A1A" : "#999999"}
                          >
                            {meetupTime
                              ? meetupTime.toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                })
                              : "Time"}
                          </Text>
                        </Pressable>
                      </HStack>

                      {showDatePicker && (
                        <DateTimePicker
                          value={meetupDate || new Date()}
                          mode="date"
                          minimumDate={new Date()}
                          accentColor={PRIMARY_COLOR}
                          themeVariant="light"
                          positiveButton={{ label: "OK", textColor: PRIMARY_COLOR }}
                          negativeButton={{ label: "Cancel", textColor: PRIMARY_COLOR }}
                          onChange={(
                            _event: DateTimePickerEvent,
                            selected?: Date
                          ) => {
                            setShowDatePicker(Platform.OS === "ios");
                            if (selected) setMeetupDate(selected);
                          }}
                        />
                      )}

                      {showTimePicker && (
                        <DateTimePicker
                          value={meetupTime || new Date()}
                          mode="time"
                          accentColor={PRIMARY_COLOR}
                          themeVariant="light"
                          positiveButton={{ label: "OK", textColor: PRIMARY_COLOR }}
                          negativeButton={{ label: "Cancel", textColor: PRIMARY_COLOR }}
                          onChange={(
                            _event: DateTimePickerEvent,
                            selected?: Date
                          ) => {
                            setShowTimePicker(Platform.OS === "ios");
                            if (selected) setMeetupTime(selected);
                          }}
                        />
                      )}

                      {/* Create Meetup */}
                      <Pressable
                        bg={
                          meetupTitle.trim() && meetupLocation.trim() && meetupDate && meetupTime
                            ? PRIMARY_COLOR
                            : "#F5F3F0"
                        }
                        borderRadius={28}
                        py="$3"
                        alignItems="center"
                        mb="$3"
                        onPress={
                          meetupTitle.trim() && meetupLocation.trim() && meetupDate && meetupTime
                            ? () => setMeetupStep("success")
                            : undefined
                        }
                      >
                        <Text
                          fontSize={16}
                          fontWeight="$bold"
                          color={
                            meetupTitle.trim() && meetupLocation.trim() && meetupDate && meetupTime
                              ? "#FFFFFF"
                              : "#CCCCCC"
                          }
                        >
                          Create Meetup
                        </Text>
                      </Pressable>

                      {/* Cancel */}
                      <Pressable
                        borderWidth={1.5}
                        borderColor="#1A1A1A"
                        borderRadius={28}
                        py="$3"
                        alignItems="center"
                        onPress={closeSheet}
                      >
                        <Text
                          fontSize={16}
                          fontWeight="$bold"
                          color="#1A1A1A"
                        >
                          Cancel
                        </Text>
                      </Pressable>
                    </Box>
                  </Box>
                )}

                {/* ── Plan Meetup Success ── */}
                {activeSheet === "planMeetup" && meetupStep === "success" && (
                  <Box
                    bg={PRIMARY_COLOR}
                    borderTopLeftRadius={24}
                    borderTopRightRadius={24}
                    px="$6"
                    pb="$8"
                  >
                    <Box
                      {...sheetPanResponder.panHandlers}
                      alignItems="center"
                      pt="$4"
                      pb="$4"
                    >
                      <Box
                        w={40}
                        h={5}
                        borderRadius={3}
                        bg="rgba(255,255,255,0.5)"
                      />
                    </Box>

                    <Box alignItems="center" mb="$4">
                      <Image
                        source={require("@/assets/images/two-hearts.png")}
                        style={{ width: 180, height: 160 }}
                        contentFit="contain"
                      />
                    </Box>

                    <Text
                      fontSize={22}
                      fontWeight="$bold"
                      color="#FFFFFF"
                      textAlign="center"
                      mb="$2"
                    >
                      Meetup Created Successfully
                    </Text>

                    <Text
                      fontSize={14}
                      color="rgba(255,255,255,0.8)"
                      textAlign="center"
                      mb="$6"
                      px="$2"
                    >
                      Lovebuilt as set up a reminder for you and{"\n"}{name}, wear your best outfit for the day.
                    </Text>

                    <Pressable
                      borderWidth={1.5}
                      borderColor="#FFFFFF"
                      borderRadius={28}
                      py="$3"
                      alignItems="center"
                      onPress={closeSheet}
                    >
                      <Text
                        fontSize={16}
                        fontWeight="$semibold"
                        color="#FFFFFF"
                      >
                        Cancel
                      </Text>
                    </Pressable>
                  </Box>
                )}

                {/* ── Join Group ── */}
                {activeSheet === "joinGroup" && (
                  <Box
                    bg={PRIMARY_COLOR}
                    borderTopLeftRadius={24}
                    borderTopRightRadius={24}
                    px="$6"
                    pb="$8"
                  >
                    <Box
                      {...sheetPanResponder.panHandlers}
                      alignItems="center"
                      pt="$4"
                      pb="$2"
                    >
                      <Box
                        w={40}
                        h={5}
                        borderRadius={3}
                        bg="rgba(255,255,255,0.5)"
                      />
                    </Box>

                    <Box alignItems="center" mb="$4">
                      <CurvyStarburstFrame
                        size={180}
                        imageUri="https://images.unsplash.com/photo-1462275646964-a0e3c11f18a6?w=400&h=400&fit=crop"
                      />
                    </Box>

                    <Text
                      fontSize={22}
                      fontWeight="$bold"
                      color="#FFFFFF"
                      textAlign="center"
                      mb="$1"
                    >
                      {name}
                    </Text>

                    <Text
                      fontSize={14}
                      color="rgba(255,255,255,0.8)"
                      textAlign="center"
                      mb="$4"
                    >
                      A group where nature is discussed{"\n"}and love is found.
                    </Text>

                    {/* Member avatars row */}
                    <HStack
                      justifyContent="center"
                      alignItems="center"
                      space="sm"
                      mb="$6"
                    >
                      <HStack>
                        {[0, 1].map((i) => (
                          <Box
                            key={i}
                            w={28}
                            h={28}
                            borderRadius={14}
                            bg="#F0C4C8"
                            borderWidth={2}
                            borderColor={PRIMARY_COLOR}
                            justifyContent="center"
                            alignItems="center"
                            marginRight={-8}
                            overflow="hidden"
                          >
                            <MaterialIcons
                              name="person"
                              size={16}
                              color="#FFFFFF"
                            />
                          </Box>
                        ))}
                      </HStack>
                      <Text fontSize={13} color="#FFFFFF" ml="$2">
                        +50
                      </Text>
                      <Box
                        w={24}
                        h={24}
                        borderRadius={12}
                        bg="#F0C4C8"
                        justifyContent="center"
                        alignItems="center"
                        overflow="hidden"
                        ml="$1"
                      >
                        <MaterialIcons
                          name="person"
                          size={14}
                          color="#FFFFFF"
                        />
                      </Box>
                      <Text fontSize={13} color="#FFFFFF">
                        Patrica is here
                      </Text>
                    </HStack>

                    <Pressable
                      bg="#FFFFFF"
                      borderRadius={28}
                      py="$3"
                      alignItems="center"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        AsyncStorage.setItem(joinedKey, "1");
                        closeSheet();
                      }}
                    >
                      <Text
                        fontSize={16}
                        fontWeight="$bold"
                        color="#1A1A1A"
                      >
                        Join {name}
                      </Text>
                    </Pressable>
                  </Box>
                )}
              </Animated.View>
            </TouchableWithoutFeedback>
          </Box>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
