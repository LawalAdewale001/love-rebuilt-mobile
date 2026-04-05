/**
 * ChatConversationScreen — orchestration layer.
 *
 * All UI is delegated to sub-components in components/chat/:
 *   ChatHeader     — top bar + options dropdown
 *   ChatMessageBubble / ChatContextMenu — message rendering & long-press actions
 *   ChatInputBar   — text input, recording waveform, playback, banners
 *   ChatModals     — delete / forward / questionnaire / bottom sheets
 *
 * Upload logic lives in hooks/use-s3-upload.ts (XHR-based, S3 presigned POST).
 */

import { PRIMARY_COLOR } from "@/constants/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Box, FlatList, Text, VStack } from "@gluestack-ui/themed";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { Audio } from "expo-av";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, KeyboardAvoidingView, PanResponder, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInputBar } from "@/components/chat/ChatInputBar";
import { ChatContextMenu, ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import { ChatModals } from "@/components/chat/ChatModals";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { useS3Upload } from "@/hooks/use-s3-upload";
import { getAuthUser } from "@/lib/auth-store";
import { queryKeys, useMessagesQuery, type ChatMessage as ApiChatMessage, type ChatConversation, type ChatMember, useBlockMutation, useReportMutation, useConversationQuery, useUnblockMutation, useChatListQuery, useJoinGroupMutation, useLeaveGroupMutation, useCreateMeetupMutation } from "@/lib/queries";
import { emitDeleteMessage, emitEditMessage, emitSendMessage, emitTyping } from "@/lib/socket";

import { MessageType, type ChatListItem, type ChatMessage, type SheetType } from "@/types/chat.types";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Helpers ────────────────────────────────────────────────────────────────

function getFlattenedMessages(msgs: ChatMessage[]): ChatListItem[] {
  const flattened: ChatListItem[] = [];
  let lastDate = "";
  msgs.forEach((m) => {
    const date = new Date(m.createdAt).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
    if (date !== lastDate) {
      if (lastDate !== "") flattened.push({ title: lastDate, isHeader: true, id: `header-${lastDate}` });
      lastDate = date;
    }
    flattened.push(m);
  });
  if (lastDate !== "") flattened.push({ title: lastDate, isHeader: true, id: `header-${lastDate}` });
  return flattened;
}

function EmptyChatState({ name }: { name: string }) {
  return (
    <Box flex={1} justifyContent="center" alignItems="center" px="$10">
      <VStack alignItems="center" space="md">
        <Box
          w={80}
          h={80}
          borderRadius={40}
          bg="#FCEFEF"
          justifyContent="center"
          alignItems="center"
          mb="$2"
        >
          <MaterialIcons name="chat-bubble-outline" size={40} color={PRIMARY_COLOR} />
        </Box>
        <Text fontSize={18} fontWeight="$600" color="#1A1A1A" textAlign="center">
          No Messages Yet
        </Text>
        <Text fontSize={14} color="#999999" textAlign="center" numberOfLines={2}>
          Say hi to {name}! Start a conversation and get to know each other better.
        </Text>
      </VStack>
    </Box>
  );
}

function ChatLoadingSkeleton() {
  return (
    <Box flex={1} py="$5" px="$5">
      <VStack space="xl">
        <Box w="60%" h={40} bg="#F5F5F5" borderRadius={15} alignSelf="flex-start" opacity={0.6} />
        <Box w="70%" h={40} bg="#FCEFEF" borderRadius={15} alignSelf="flex-end" opacity={0.6} />
        <Box w="40%" h={40} bg="#F5F5F5" borderRadius={15} alignSelf="flex-start" opacity={0.6} />
        <Box w="80%" h={40} bg="#FCEFEF" borderRadius={15} alignSelf="flex-end" opacity={0.6} />
        <Box w="50%" h={40} bg="#F5F5F5" borderRadius={15} alignSelf="flex-start" opacity={0.6} />
      </VStack>
    </Box>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function ChatConversationScreen() {
  const {
    name = "Chat",
    id: chatId = "0",
    isGroup: isGroupParam,
    avatar: avatarParam,
    recipientId: recipientIdParam,
    isOnline: isOnlineParam,
    isLiked: isLikedParam,
    lastSeen: lastSeenParam,
  } = useLocalSearchParams<{
    name: string; id: string; isGroup: string; avatar: string;
    recipientId: string; isOnline: string; isLiked: string; lastSeen: string;
  }>();

  const router = useRouter();
  const queryClient = useQueryClient();

  const isGroup = isGroupParam === "1";
  const currentUserId = getAuthUser()?.id ?? "";
  const compatKey = `compat_dismissed_${chatId}`;
  const joinedKey = `group_joined_${chatId}`;

  // ── Conversation data (blocked status etc) ──────────────────────────────────
  const { data: conversationData } = useConversationQuery(chatId);
  const { data: chatListData } = useChatListQuery();
  
  const conversation = useMemo<ChatConversation | null>(() => {
    if (conversationData) return conversationData;
    // Fallback search in chat list cache
    if (chatListData?.pages) {
      for (const page of chatListData.pages) {
        const found = page.result.find((c: ChatConversation) => c.id === chatId);
        if (found) return found;
      }
    }
    return null;
  }, [conversationData, chatListData, chatId]);

  const isBlocked = conversation?.isBlocked;
  const blockedMe = conversation?.blockedMe;
  const isMember = isGroup ? (conversation?.isMember ?? false) : true; 

  // ── Message state ──────────────────────────────────────────────────────────
  const { data: messagesData, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isLoading: isMessagesLoading } = useMessagesQuery(chatId);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const apiMessages: ChatMessage[] = useMemo(() => {
    if (!messagesData?.pages) return [];
    const allApiMsgs: ApiChatMessage[] = messagesData.pages.flatMap((page: any) => page.result || []);
    return allApiMsgs.map((m) => {
      const mappedType = m.type === "voice" ? MessageType.AUDIO :
        m.type === "pdf" ? MessageType.FILE :
          m.type as MessageType;
      return {
        id: m.id,
        text: m.content || undefined,
        sent: m.senderId === currentUserId,
        createdAt: m.createdAt,
        time: new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        read: m.isRead,
        sender: isGroup ? m.sender?.fullName : undefined,
        replyTo: m.replyTo ? { id: m.replyTo.id, text: m.replyTo.content, sender: m.replyTo.sender?.fullName } : undefined,
        deleted: m.isDeleted,
        type: mappedType,
        mediaUrl: m.mediaUrl || undefined,
        edited: m.updatedAt !== m.createdAt,
        meetup: m.meetup ? {
          title: m.meetup.title,
          location: m.meetup.location,
          date: m.meetup.date,
          time: m.meetup.time,
        } : undefined,
      };
    });
  }, [messagesData, currentUserId, isGroup]);

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Combine local optimistic messages with API messages
  const messages = useMemo(() => {
    // Only show local messages that haven't appeared in apiMessages yet
    // AND filter out any messages that we've optimistically deleted
    const filteredLocal = localMessages.filter(
      (local) => !apiMessages.some((api) => api.id === local.id) && !deletedIds.has(local.id)
    );
    const filteredApi = apiMessages.filter((api) => !deletedIds.has(api.id));

    return [...filteredLocal, ...filteredApi];
  }, [localMessages, apiMessages, deletedIds]);

  const addOptimisticMessage = (data: Partial<ChatMessage>) => {
    const tempId = `local-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: tempId, sent: true, time: "Now",
      createdAt: new Date().toISOString(), read: false, ...data,
    };
    if (replyingTo) newMsg.replyTo = { id: replyingTo.id, text: replyingTo.text, sender: replyingTo.sender };
    setLocalMessages((prev) => [newMsg, ...prev]);
    return tempId;
  };

  const updateMessageId = useCallback((tempId: string, realId: string) => {
    setLocalMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, id: realId } : m));
  }, []);

  // ── Socket ─────────────────────────────────────────────────────────────────
  const { typingUser, isRecipientOnline } = useChatSocket(chatId);
  const isOnline = isRecipientOnline ?? isOnlineParam === "1";
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [message, setMessage] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [showCompatibility, setShowCompatibility] = useState(false);
  const [isLiked, setIsLiked] = useState(isLikedParam === "1");
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const flatListRef = useRef<any>(null);

  // Message actions
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [contextMsg, setContextMsg] = useState<ChatMessage | null>(null);
  const [deleteMsg, setDeleteMsg] = useState<ChatMessage | null>(null);
  const [forwardMsg, setForwardMsg] = useState<ChatMessage | null>(null);
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);

  // ── Recording ──────────────────────────────────────────────────────────────
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [playbackSound, setPlaybackSound] = useState<Audio.Sound | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformAnim = useRef(Array.from({ length: 20 }, () => new Animated.Value(0.3))).current;
  const recordDotAnim = useRef(new Animated.Value(1)).current;

  // ── Upload ─────────────────────────────────────────────────────────────────
  const { upload, isUploading } = useS3Upload();

  // ── Questionnaire sheet ────────────────────────────────────────────────────
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaireStep, setQuestionnaireStep] = useState<"question" | "success">("question");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // ── Generic bottom sheets ──────────────────────────────────────────────────
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
  const closeSheetRef = useRef<() => void>(() => { });

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(compatKey).then((val) => {
      if (val !== "1") setShowCompatibility(true);
    });
  }, [compatKey]);

  useEffect(() => {
    if (!isGroup || !conversationData || conversationData.isMember) return;
    setTimeout(() => openSheet("joinGroup"), 500);
  }, [isGroup, conversationData?.isMember]);

  // ── Sheet helpers ──────────────────────────────────────────────────────────
  const openSheet = useCallback((type: SheetType) => {
    setActiveSheet(type);
    setReportStep("form"); setReportText("");
    setMeetupStep("form"); setMeetupTitle(""); setMeetupLocation("");
    setMeetupDate(null); setMeetupTime(null);
    setShowDatePicker(false); setShowTimePicker(false);
    Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  }, [sheetAnim]);

  const closeSheet = useCallback(() => {
    Animated.timing(sheetAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true })
      .start(() => {
        setActiveSheet(null);
        setReportStep("form"); setReportText("");
        setMeetupStep("form"); setMeetupTitle(""); setMeetupLocation("");
        setMeetupDate(null); setMeetupTime(null);
        setShowDatePicker(false); setShowTimePicker(false);
      });
  }, [sheetAnim]);

  closeSheetRef.current = closeSheet;

  const sheetPanResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
    onPanResponderMove: (_, g) => { if (g.dy > 0) sheetAnim.setValue(g.dy); },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 100 || g.vy > 0.5) closeSheetRef.current();
      else Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    },
  })).current;

  // ── Questionnaire helpers ──────────────────────────────────────────────────
  const openQuestionnaire = () => {
    setQuestionnaireStep("question"); setSelectedOptions([]); setShowQuestionnaire(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  };

  const closeQuestionnaire = () => {
    Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true })
      .start(() => { setShowQuestionnaire(false); setSelectedOptions([]); });
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
    onPanResponderMove: (_, g) => { if (g.dy > 0) slideAnim.setValue(g.dy); },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 100 || g.vy > 0.5) closeQuestionnaire();
      else Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    },
  })).current;

  const inputBarPanResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10,
    onPanResponderRelease: (_, g) => { if (g.dy < -30 || g.vy < -0.3) openQuestionnaire(); },
  })).current;

  // ── Waveform animation ─────────────────────────────────────────────────────
  const startWaveformAnimation = () => {
    const animations = waveformAnim.map((val) =>
      Animated.loop(Animated.sequence([
        Animated.timing(val, { toValue: 0.2 + Math.random() * 0.8, duration: 200 + Math.random() * 300, useNativeDriver: true }),
        Animated.timing(val, { toValue: 0.2 + Math.random() * 0.5, duration: 200 + Math.random() * 300, useNativeDriver: true }),
      ]))
    );
    const dotBlink = Animated.loop(Animated.sequence([
      Animated.timing(recordDotAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(recordDotAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]));
    Animated.parallel([...animations, dotBlink]).start();
  };

  const stopWaveformAnimation = () => {
    waveformAnim.forEach((val) => { val.stopAnimation(); val.setValue(0.3); });
    recordDotAnim.stopAnimation(); recordDotAnim.setValue(1);
  };

  // ── Recording handlers ─────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      setRecordedUri(null); setRecordingSeconds(0);
      if (playbackSound) { await playbackSound.unloadAsync().catch(() => { }); setPlaybackSound(null); }
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") { console.error("Mic permission denied"); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      if (recording) { await recording.stopAndUnloadAsync().catch(() => { }); setRecording(null); }
      const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(newRecording); setIsRecording(true);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
      startWaveformAnimation();
    } catch (err: any) {
      console.error("Failed to start recording:", err?.message ?? err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    stopWaveformAnimation(); setIsRecording(false);
    try {
      const status = await recording.getStatusAsync();
      if (status.isRecording || status.canRecord) await recording.stopAndUnloadAsync();
    } catch (err) { console.warn("Recording already stopped:", err); }
    const uri = recording.getURI();
    setRecording(null);
    if (uri) setRecordedUri(uri);
  };

  const cancelRecording = async () => {
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    stopWaveformAnimation(); setIsRecording(false);
    if (recording) { try { await recording.stopAndUnloadAsync(); } catch { } setRecording(null); }
    setRecordingSeconds(0);
  };

  const cancelVoiceNote = async () => {
    if (playbackSound) { await playbackSound.unloadAsync().catch(() => { }); setPlaybackSound(null); }
    setRecordedUri(null); setRecordingSeconds(0); setIsPlayingBack(false);
  };

  const togglePlayback = async () => {
    if (!recordedUri) return;
    if (playbackSound) {
      if (isPlayingBack) { await playbackSound.pauseAsync(); setIsPlayingBack(false); }
      else { await playbackSound.playAsync(); setIsPlayingBack(true); }
    } else {
      const { sound } = await Audio.Sound.createAsync({ uri: recordedUri }, { shouldPlay: true }, (status) => {
        if (status.isLoaded && status.didJustFinish) setIsPlayingBack(false);
      });
      setPlaybackSound(sound); setIsPlayingBack(true);
    }
  };

  const sendVoiceNote = async () => {
    if (!recordedUri) return;
    if (playbackSound) { await playbackSound.unloadAsync().catch(() => { }); setPlaybackSound(null); }
    setIsPlayingBack(false);
    const uri = recordedUri; setRecordedUri(null); setRecordingSeconds(0);
    const result = await upload(uri, `voice_note_${Date.now()}.m4a`, "audio/m4a");
    if (result) {
      const tempId = addOptimisticMessage({ type: MessageType.AUDIO, mediaUrl: result.fileUrl });
      emitSendMessage(
        { conversationId: chatId, type: MessageType.AUDIO, mediaUrl: result.fileUrl },
        (res) => {
          const realId = res?.id || res?.data?.id || res?.result?.id;
          if (realId) updateMessageId(tempId, realId);
        }
      );
    }
  };

  // ── Media upload helpers ───────────────────────────────────────────────────
  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0].uri) {
      const { uri } = result.assets[0];
      const fileName = `chat_image_${Date.now()}.jpg`;
      const res = await upload(uri, fileName, "image/jpeg");
      if (res) {
        const tempId = addOptimisticMessage({ type: MessageType.IMAGE, mediaUrl: res.fileUrl });
        emitSendMessage(
          { conversationId: chatId, type: MessageType.IMAGE, mediaUrl: res.fileUrl },
          (resSync) => {
            const realId = resSync?.id || resSync?.data?.id || resSync?.result?.id;
            if (realId) updateMessageId(tempId, realId);
          }
        );
      }
    }
  };

  const handleFilePick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
    if (!result.canceled && result.assets[0].uri) {
      const { uri, name: fileName } = result.assets[0];
      const res = await upload(uri, fileName, "application/pdf");
      if (res) {
        const tempId = addOptimisticMessage({ type: MessageType.FILE, mediaUrl: res.fileUrl });
        emitSendMessage(
          { conversationId: chatId, type: MessageType.FILE, mediaUrl: res.fileUrl },
          (resSync) => {
            const realId = resSync?.id || resSync?.data?.id || resSync?.result?.id;
            if (realId) updateMessageId(tempId, realId);
          }
        );
      }
    }
  };

  const blockMutation = useBlockMutation();
  const unblockMutation = useUnblockMutation();
  const reportMutation = useReportMutation();
  const joinGroupMutation = useJoinGroupMutation();
  const leaveGroupMutation = useLeaveGroupMutation();
  const meetupMutation = useCreateMeetupMutation();

  const handleJoinGroup = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await joinGroupMutation.mutateAsync(chatId);
      closeSheet();
    } catch (err) {
      console.error("Failed to join group:", err);
    }
  };

  const handleCreateMeetup = async (data: { title: string; location: string; date: Date; time: Date }) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const formattedDate = data.date.toISOString().split("T")[0]; // YYYY-MM-DD
      const formattedTime = data.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }); // HH:mm
      
      await meetupMutation.mutateAsync({
        conversationId: chatId,
        title: data.title,
        location: data.location,
        date: formattedDate,
        time: formattedTime,
      });
      
      // Success is indicated by showing a success state or just closing the modal
      setMeetupStep("success");
      // Optionally stay on success screen for a bit then close
      setTimeout(() => {
        closeSheet();
      }, 1500);
    } catch (err) {
      console.error("Failed to create meetup:", err);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await leaveGroupMutation.mutateAsync(chatId);
      closeSheet();
      router.back();
    } catch (err) {
      console.error("Failed to leave group:", err);
    }
  };

  const handleBlock = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await blockMutation.mutateAsync(recipientIdParam || "");
      // Success is handled by mutation's onSuccess (invalidating chats)
      // Navigate back to chat list
      setTimeout(() => {
        closeSheet();
        router.back();
      }, 500);
    } catch (err) {
      console.error("Failed to block user:", err);
    }
  };

  const handleUnblock = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await unblockMutation.mutateAsync(recipientIdParam || "");
      // Success will refetch conversation via query invalidation
    } catch (err) {
      console.error("Failed to unblock user:", err);
    }
  };

  const handleReport = async (reason: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await reportMutation.mutateAsync({
        targetId: isGroup ? chatId : (recipientIdParam || ""),
        targetType: isGroup ? "group" : "user",
        reason,
      });
      setReportStep("success");
      // Optionally navigate back after a delay
      setTimeout(() => {
        router.push("/chats"); // explicitly go back to list
      }, 2000);
    } catch (err) {
      console.error("Failed to report user/group:", err);
    }
  };

  // ── Chat actions ───────────────────────────────────────────────────────────
  const handleSend = () => {
    if (!message.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (editingMsg) {
      emitEditMessage(editingMsg.id, message.trim());
      setLocalMessages((prev) => prev.map((m) => m.id === editingMsg.id ? { ...m, text: message.trim(), edited: true } : m));
      setMessage(""); setEditingMsg(null); return;
    }
    const tempId = addOptimisticMessage({ text: message.trim(), type: MessageType.TEXT });
    emitSendMessage(
      { conversationId: chatId, content: message.trim(), replyToId: replyingTo?.id, type: MessageType.TEXT },
      (res) => {
        const realId = res?.id || res?.data?.id || res?.result?.id;
        if (realId) updateMessageId(tempId, realId);
      }
    );
    setMessage(""); setReplyingTo(null);
    emitTyping(chatId, false);
  };

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

  const handleDeleteForMe = async (msg: ChatMessage) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsDeleting(true);
      
      const mid = msg.id;
      if (!mid.startsWith("local-")) {
        // We wrap it in a promise if socket emit doesn't provide one, 
        // to show loading for a short while
        await new Promise(resolve => {
          emitDeleteMessage(mid, "me");
          setTimeout(resolve, 500); // minimum loading feel
        });
      }
      
      setDeletedIds((prev) => new Set(prev).add(mid));
      setLocalMessages((prev) => prev.filter((m) => m.id !== mid));
      
      // Update Chat List cache
      queryClient.setQueryData(queryKeys.chats(), (old: any) => {
        if (!old?.chats) return old;
        return {
          ...old,
          chats: old.chats.map((c: ChatConversation) => (
            c.id === chatId && c.lastMessage?.id === mid
              ? { ...c, lastMessage: { ...c.lastMessage, isDeleted: true } }
              : c
          ))
        };
      });
      
      setDeleteMsg(null);
    } finally {
      setIsDeleting(false);
    }
  };
 
  const handleDeleteForEveryone = async (msg: ChatMessage) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsDeleting(true);
      
      const mid = msg.id;
      if (!mid.startsWith("local-")) {
        await new Promise(resolve => {
          emitDeleteMessage(mid, "everyone");
          setTimeout(resolve, 500); 
        });
      }
 
      setDeletedIds((prev) => new Set(prev).add(mid));
      setLocalMessages((prev) => prev.map((m) => m.id === mid ? { ...m, text: "This message was deleted", deleted: true, replyTo: undefined, edited: false } : m));
      
      // Update Chat List cache
      queryClient.setQueryData(queryKeys.chats(), (old: any) => {
        if (!old?.chats) return old;
        return {
          ...old,
          chats: old.chats.map((c: ChatConversation) => (
            c.id === chatId && c.lastMessage?.id === mid
              ? { ...c, lastMessage: { ...c.lastMessage, isDeleted: true } }
              : c
          ))
        };
      });
      
      setDeleteMsg(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const dismissCompatibility = useCallback(() => {
    setShowCompatibility(false);
    AsyncStorage.setItem(compatKey, "1");
  }, [compatKey]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Box flex={1}>
          {/* Header */}
          <ChatHeader
            name={name}
            avatar={avatarParam}
            isOnline={isOnline}
            isGroup={isGroup}
            isLiked={isLiked}
            setIsLiked={setIsLiked}
            recipientIdParam={recipientIdParam}
            lastSeen={lastSeenParam}
            showOptions={showOptions}
            setShowOptions={setShowOptions}
            openSheet={openSheet}
            isBlocked={!!isBlocked}
            onUnblock={handleUnblock}
            isUnblocking={unblockMutation.isPending}
            isMember={isMember}
          />

          {/* Upload Status Overlay */}
          {isUploading && (
            <Box position="absolute" top={10} left={0} right={0} alignItems="center" zIndex={100} pointerEvents="none">
              <Box bg="rgba(0,0,0,0.7)" px="$3" py="$1.5" borderRadius={20} flexDirection="row" alignItems="center">
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text color="#FFFFFF" fontSize={12} fontWeight="$medium">Uploading...</Text>
              </Box>
            </Box>
          )}

          {/* Message List */}
          {isMessagesLoading ? (
            <ChatLoadingSkeleton />
          ) : (
            <FlatList
              ref={flatListRef}
              data={getFlattenedMessages(messages)}
              inverted={messages.length > 0}
              keyExtractor={(item: any) => item.id}
              onEndReached={() => hasNextPage && fetchNextPage()}
              onEndReachedThreshold={0.5}
              ListHeaderComponent={isFetchingNextPage ? (
                <Box py="$3" alignItems="center">
                  <Text fontSize={12} color="#999999">Loading older messages...</Text>
                </Box>
              ) : null}
              ListEmptyComponent={<EmptyChatState name={name} />}
              renderItem={({ item }) => {
                const msg = item as ChatListItem;
                if ("isHeader" in msg) {
                  return (
                    <Box alignItems="center" py="$4">
                      <Box bg="#F0F0F0" px="$3" py="$1" borderRadius={12}>
                        <Text fontSize={11} color="#666666" fontWeight="$medium">{msg.title}</Text>
                      </Box>
                    </Box>
                  );
                }
                return (
                  <ChatMessageBubble
                    msg={msg}
                    isGroup={isGroup}
                    conversationPartnerName={name}
                    onLongPress={setContextMsg}
                    onImagePress={setFullScreenImage}
                  />
                );
              }}
              contentContainerStyle={{ flexGrow: 1, paddingVertical: 16 }}
              style={{ flex: 1 }}
            />
          )}

          {/* Input Bar (with banners + recording) */}
          <ChatInputBar
            message={message}
            onChangeText={handleTextChange}
            onSend={handleSend}
            onImagePick={handleImagePick}
            onFilePick={handleFilePick}
            isUploading={isUploading}
            isRecording={isRecording}
            recordedUri={recordedUri}
            recordingSeconds={recordingSeconds}
            isPlayingBack={isPlayingBack}
            waveformAnim={waveformAnim}
            recordDotAnim={recordDotAnim}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onCancelRecording={cancelRecording}
            onCancelVoiceNote={cancelVoiceNote}
            onTogglePlayback={togglePlayback}
            onSendVoiceNote={sendVoiceNote}
            editingMsg={editingMsg}
            onCancelEdit={() => { setEditingMsg(null); setMessage(""); }}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            typingUser={typingUser}
            showCompatibility={showCompatibility}
            onDismissCompatibility={dismissCompatibility}
            isGroup={isGroup}
            isMember={isMember}
            inputBarPanResponder={inputBarPanResponder}
            conversationPartnerName={name}
            isBlocked={isBlocked}
            blockedMe={blockedMe}
            onUnblock={handleUnblock}
            isUnblocking={unblockMutation.isPending}
          />
        </Box>
      </KeyboardAvoidingView>

      {/* Context Menu (long-press actions) */}
      {contextMsg && !contextMsg.deleted && (
        <ChatContextMenu
          msg={contextMsg}
          onClose={() => setContextMsg(null)}
          onReply={() => { setReplyingTo(contextMsg); setContextMsg(null); }}
          onCopy={async () => { await Clipboard.setStringAsync(contextMsg?.text || ""); setContextMsg(null); }}
          onEdit={() => { setEditingMsg(contextMsg); setMessage(contextMsg?.text || ""); setContextMsg(null); }}
          onForward={() => { setForwardMsg(contextMsg); setContextMsg(null); }}
          onDelete={() => { setDeleteMsg(contextMsg); setContextMsg(null); }}
        />
      )}

      {/* All modals (delete, forward, questionnaire, sheets) */}
      <ChatModals
        name={name}
        isGroup={isGroup}
        fullScreenImage={fullScreenImage}
        onCloseFullScreenImage={() => setFullScreenImage(null)}
        deleteMsg={deleteMsg}
        onCloseDeleteMsg={() => setDeleteMsg(null)}
        onDeleteForMe={handleDeleteForMe}
        onDeleteForEveryone={handleDeleteForEveryone}
        forwardMsg={forwardMsg}
        onCloseForwardMsg={() => setForwardMsg(null)}
        showQuestionnaire={showQuestionnaire}
        questionnaireStep={questionnaireStep}
        setQuestionnaireStep={setQuestionnaireStep}
        selectedOptions={selectedOptions}
        toggleOption={(opt) => setSelectedOptions((prev) => prev.includes(opt) ? [] : [opt])}
        onSubmitQuestionnaire={() => setQuestionnaireStep("success")}
        onCloseQuestionnaire={closeQuestionnaire}
        slideAnim={slideAnim}
        panResponder={panResponder}
        activeSheet={activeSheet}
        onCloseSheet={closeSheet}
        reportStep={reportStep}
        setReportStep={setReportStep}
        reportText={reportText}
        setReportText={setReportText}
        meetupStep={meetupStep}
        setMeetupStep={setMeetupStep}
        meetupTitle={meetupTitle}
        setMeetupTitle={setMeetupTitle}
        meetupLocation={meetupLocation}
        setMeetupLocation={setMeetupLocation}
        meetupDate={meetupDate}
        setMeetupDate={setMeetupDate}
        meetupTime={meetupTime}
        setMeetupTime={setMeetupTime}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        showTimePicker={showTimePicker}
        setShowTimePicker={setShowTimePicker}
        sheetAnim={sheetAnim}
        sheetPanResponder={sheetPanResponder}
        onBlock={handleBlock}
        onReport={handleReport}
        isBlocking={blockMutation.isPending}
        isUnblocking={unblockMutation.isPending}
        isReporting={reportMutation.isPending}
        isDeleting={isDeleting}
        onLeaveGroup={handleLeaveGroup}
        isLeavingGroup={leaveGroupMutation.isPending}
        groupImage={conversation?.image}
        groupDescription={conversation?.description}
        totalMembers={conversation?.totalMembers}
        membersNames={conversation?.members?.map((m: ChatMember) => m.name)}
        membersAvatars={conversation?.members?.map((m: ChatMember) => m.avatar || "")}
        isMember={isMember}
        onJoinGroup={handleJoinGroup}
        isJoiningGroup={joinGroupMutation.isPending}
        onCreateMeetup={handleCreateMeetup}
        isCreatingMeetup={meetupMutation.isPending}
      />
    </SafeAreaView>
  );
}
