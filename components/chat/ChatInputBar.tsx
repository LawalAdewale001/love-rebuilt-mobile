import { CameraIcon, MicrophoneIcon, SendIcon } from "@/components/ui/chat-icons";
import { PRIMARY_COLOR } from "@/constants/theme";
import type { ChatMessage } from "@/types/chat.types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Box, HStack, Pressable, ScrollView, Text } from "@gluestack-ui/themed";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, PanResponder, PanResponderInstance, TextInput } from "react-native";
import * as Haptics from "expo-haptics";
import { ActivityIndicator } from "react-native";


const COMPATIBILITY_QUESTIONS = [
  "What are your financial values?",
  "What is Parenting style?",
  "How do you handle conflict?",
  "What are your love languages?",
];

interface ChatInputBarProps {
  // Text input
  message: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  // Media
  onImagePick: () => void;
  onFilePick: () => void;
  isUploading: boolean;
  // Recording
  isRecording: boolean;
  recordedUri: string | null;
  recordingSeconds: number;
  isPlayingBack: boolean;
  waveformAnim: Animated.Value[];
  recordDotAnim: Animated.Value;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  onCancelVoiceNote: () => void;
  onTogglePlayback: () => void;
  onSendVoiceNote: () => void;
  // Context banners
  editingMsg: ChatMessage | null;
  onCancelEdit: () => void;
  replyingTo: ChatMessage | null;
  onCancelReply: () => void;
  typingUser: string | null;
  showCompatibility: boolean;
  onDismissCompatibility: () => void;
  // Sheet handle (private chats only)
  isGroup: boolean;
  inputBarPanResponder: PanResponderInstance;
  conversationPartnerName: string;
  isBlocked?: boolean;
  blockedMe?: boolean;
  onUnblock?: () => void;
  isUnblocking?: boolean;
}

export function ChatInputBar({
  message,
  onChangeText,
  onSend,
  onImagePick,
  onFilePick,
  isUploading,
  isRecording,
  recordedUri,
  recordingSeconds,
  isPlayingBack,
  waveformAnim,
  recordDotAnim,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  onCancelVoiceNote,
  onTogglePlayback,
  onSendVoiceNote,
  editingMsg,
  onCancelEdit,
  replyingTo,
  onCancelReply,
  typingUser,
  showCompatibility,
  onDismissCompatibility,
  isGroup,
  inputBarPanResponder,
  conversationPartnerName,
  isBlocked,
  blockedMe,
  onUnblock,
  isUnblocking,
}: ChatInputBarProps) {
  const formatTime = (secs: number) =>
    `${Math.floor(secs / 60).toString().padStart(2, "0")}:${(secs % 60).toString().padStart(2, "0")}`;

  const swipeX = useRef(new Animated.Value(0)).current;
  const [isCancelled, setIsCancelled] = useState(false);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
    onPanResponderMove: (_, g) => {
      if (g.dx < 0) {
        swipeX.setValue(g.dx);
        setIsCancelled(g.dx < -80);
      }
    },
    onPanResponderRelease: (_, g) => {
      if (g.dx < -80) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        onCancelRecording();
      }
      Animated.spring(swipeX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 7
      }).start();
      setIsCancelled(false);
    },
    onPanResponderTerminate: () => {
      swipeX.setValue(0);
      setIsCancelled(false);
    }
  }), [onCancelRecording]);

  useEffect(() => {
    if (!isRecording) {
      swipeX.setValue(0);
      setIsCancelled(false);
    }
  }, [isRecording]);

  return (
    <>
      {/* Compatibility Questions Bar */}
      {showCompatibility && (
        <Box borderTopWidth={1} borderTopColor="#F4F3F2">
          <HStack px="$4" py="$2" alignItems="center" justifyContent="space-between">
            <Text fontSize={13} fontWeight="$semibold" color="#1A1A1A">
              Deeper Compatibility Questions
            </Text>
            <Pressable onPress={onDismissCompatibility}>
              <MaterialIcons name="cancel" size={20} color="#999999" />
            </Pressable>
          </HStack>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}
          >
            {COMPATIBILITY_QUESTIONS.map((question) => (
              <Pressable
                key={question}
                borderWidth={1} borderColor="#E0E0E0" borderRadius={20}
                px="$3" py="$2"
                onPress={() => onChangeText(question)}
              >
                <Text fontSize={12} color="#1A1A1A">{question}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Box>
      )}

      {/* Editing Banner */}
      {editingMsg && (
        <Box bg="#E8F5E9" borderTopWidth={1} borderTopColor="#C8E6C9" px="$4" py="$2">
          <HStack alignItems="center" justifyContent="space-between">
            <HStack flex={1} alignItems="center" space="sm">
              <MaterialIcons name="edit" size={16} color="#4CAF50" />
              <Box flex={1}>
                <Text fontSize={12} fontWeight="$bold" color="#4CAF50">Editing message</Text>
                <Text fontSize={13} color="#666666" numberOfLines={1}>{editingMsg.text}</Text>
              </Box>
            </HStack>
            <Pressable onPress={onCancelEdit} p="$1">
              <MaterialIcons name="close" size={18} color="#999999" />
            </Pressable>
          </HStack>
        </Box>
      )}

      {/* Reply Preview Banner */}
      {replyingTo && !editingMsg && (
        <Box bg="#F5F5F5" borderTopWidth={1} borderTopColor="#F4F3F2" px="$4" py="$2">
          <HStack alignItems="center" justifyContent="space-between">
            <Box flex={1} borderLeftWidth={3} borderLeftColor={PRIMARY_COLOR} pl="$2">
              <Text fontSize={12} fontWeight="$bold" color={PRIMARY_COLOR}>
                {replyingTo.sender || (replyingTo.sent ? "You" : conversationPartnerName)}
              </Text>
              <Text fontSize={13} color="#666666" numberOfLines={1}>{replyingTo.text}</Text>
            </Box>
            <Pressable onPress={onCancelReply} p="$1">
              <MaterialIcons name="close" size={18} color="#999999" />
            </Pressable>
          </HStack>
        </Box>
      )}

      {/* Typing Indicator */}
      {typingUser && (
        <Box px="$5" py="$1" bg="#FFFFFF">
          <Text fontSize={12} color="#999999" fontStyle="italic">{typingUser} is typing...</Text>
        </Box>
      )}

      {/* Input Bar */}
      <Box bg="#FFFFFF" borderTopWidth={1} borderTopColor="#F4F3F2">

        {/* ── Normal Input ── */}
        {!isRecording && !recordedUri && !isBlocked && !blockedMe && (
          <HStack px="$4" py="$2" alignItems="center" space="sm">
            <Pressable w={36} h={36} justifyContent="center" alignItems="center"
              onPress={onImagePick} disabled={isUploading}
            >
              <CameraIcon size={24} color={isUploading ? "#CCCCCC" : "#1A1A1A"} />
            </Pressable>

            <Box flex={1} bg="#F5F5F5" borderRadius={22} borderWidth={1} borderColor="#E0E0E0"
              minHeight={40} maxHeight={100} justifyContent="center"
              opacity={isUploading ? 0.6 : 1}
            >
              <HStack alignItems="flex-end">
                <TextInput
                  placeholder="Message..."
                  placeholderTextColor="#999999"
                  style={{ fontSize: 14, color: "#1A1A1A", flex: 1, paddingHorizontal: 16, paddingVertical: 8, maxHeight: 90 }}
                  value={message}
                  onChangeText={onChangeText}
                  editable={!isUploading}
                  multiline
                  blurOnSubmit={false}
                />
                <Pressable
                  pr="$3"
                  pb="$2.5"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onStartRecording();
                  }}
                  onLongPress={onFilePick}
                  disabled={isUploading}
                >
                  <MicrophoneIcon size={18} color={isUploading ? "#CCCCCC" : PRIMARY_COLOR} />
                </Pressable>
              </HStack>
            </Box>

            <Pressable w={40} h={40} bg={isUploading ? "#CCCCCC" : PRIMARY_COLOR}
              borderRadius={20}
              justifyContent="center" alignItems="center" 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onSend();
              }} 
              disabled={isUploading}
            >
              {isUploading ? (
                <MaterialIcons name="hourglass-empty" size={18} color="#FFFFFF" />
              ) : (
                <SendIcon size={18} color="#FFFFFF" />
              )}
            </Pressable>
          </HStack>
        )}

        {/* ── Blocked Banner ── */}
        {(isBlocked || blockedMe) && (
          <Box px="$4" py="$3" alignItems="center" justifyContent="center">
            <Pressable
              onPress={isBlocked && !isUnblocking ? onUnblock : undefined}
              bg="#F5F5F5"
              px="$6"
              py="$1.5"
              borderRadius={12}
              w="100%"
              minHeight={44}
              alignItems="center"
              justifyContent="center"
              disabled={isUnblocking}
            >
              {isUnblocking ? (
                <ActivityIndicator size="small" color={PRIMARY_COLOR} />
              ) : (
                <Text fontSize={14} color="#666666" textAlign="center">
                  {isBlocked 
                    ? "You blocked this contact. Tap to unblock." 
                    : "You cannot message this contact."}
                </Text>
              )}
            </Pressable>
          </Box>
        )}

        {/* ── Recording Waveform with Swipe-to-Cancel ── */}
        {isRecording && (
          <HStack px="$4" py="$2" alignItems="center" space="sm" minHeight={56}>
            <Animated.View style={{ transform: [{ translateX: swipeX }] }}>
              <Box {...panResponder.panHandlers} w={44} h={44} bg="#E53935" borderRadius={22}
                justifyContent="center" alignItems="center"
              >
                <MaterialIcons name="mic" size={24} color="#FFFFFF" />
              </Box>
            </Animated.View>

            <Box flex={1} bg="#FFF0F0" borderRadius={22} borderWidth={1} borderColor="#FFCDD2"
              height={44} overflow="hidden" justifyContent="center" px="$3"
            >
              <HStack alignItems="center" space="xs">
                <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#E53935", opacity: recordDotAnim }} />
                <Text fontSize={12} color="#E53935" fontWeight="$medium">{formatTime(recordingSeconds)}</Text>
                <Box flex={1} alignItems="center">
                  <Text fontSize={13} color={isCancelled ? "#E53935" : "#999999"}>
                    Recording...
                  </Text>
                </Box>
              </HStack>
            </Box>

            <Pressable w={44} h={44} bg="#F5F5F5" borderRadius={22}
              borderWidth={1} borderColor="#E0E0E0"
              justifyContent="center" alignItems="center"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onStopRecording();
              }}
            >
              <MaterialIcons name="stop" size={22} color="#E53935" />
            </Pressable>
          </HStack>
        )}

        {/* ── Post-recording Playback ── */}
        {!isRecording && recordedUri && (
          <HStack px="$4" py="$2" alignItems="center" space="sm" minHeight={56}>
            <Pressable w={36} h={36} justifyContent="center" alignItems="center" 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onCancelVoiceNote();
              }} 
              disabled={isUploading}
            >
              <MaterialIcons name="delete" size={22} color={isUploading ? "#CCCCCC" : "#E53935"} />
            </Pressable>

            <Box flex={1} bg="#F5F5F5" borderRadius={22} borderWidth={1} borderColor="#E0E0E0"
              height={44} overflow="hidden" justifyContent="center" px="$2"
              opacity={isUploading ? 0.6 : 1}
            >
              <HStack alignItems="center" space="sm">
                <Pressable w={32} h={32} justifyContent="center" alignItems="center" onPress={onTogglePlayback} disabled={isUploading}>
                  <MaterialIcons name={isPlayingBack ? "pause" : "play-arrow"} size={24} color={isUploading ? "#CCCCCC" : PRIMARY_COLOR} />
                </Pressable>
                <HStack flex={1} alignItems="center" justifyContent="space-between" mx="$1">
                  {Array.from({ length: 14 }, (_, i) => (
                    <Box key={i} w={3} borderRadius={2}
                      bg={isPlayingBack ? PRIMARY_COLOR : "#CCCCCC"}
                      style={{ height: 4 + (Math.sin(i * 0.8) * 10 + 10) }}
                    />
                  ))}
                </HStack>
                <Text fontSize={11} color="#666666">{formatTime(recordingSeconds)}</Text>
              </HStack>
            </Box>

            <Pressable w={44} h={44} bg={isUploading ? "#CCCCCC" : PRIMARY_COLOR}
              borderRadius={22} justifyContent="center" alignItems="center"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onSendVoiceNote();
              }} 
              disabled={isUploading}
            >
              {isUploading
                ? <MaterialIcons name="hourglass-empty" size={20} color="#FFFFFF" />
                : <SendIcon size={18} color="#FFFFFF" />
              }
            </Pressable>
          </HStack>
        )}

        {/* Swipe-up handle (private chats only) */}
        {!isGroup && (
          <Box {...inputBarPanResponder.panHandlers} alignItems="center" pb="$2" pt="$1">
            <Box w={40} h={4} borderRadius={2} bg="#E0E0E0" />
          </Box>
        )}
      </Box>
    </>
  );
}
