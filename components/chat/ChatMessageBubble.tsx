import { PRIMARY_COLOR } from "@/constants/theme";
import { type ChatMessage, MessageType } from "@/types/chat.types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Box, HStack, Pressable, Text, VStack } from "@gluestack-ui/themed";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { MeetupBubbleIcon } from "@/components/ui/chat-icons";
import { Dimensions, Linking, TouchableWithoutFeedback } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
import { VoiceNotePlayer } from "./VoiceNotePlayer";

const GROUP_COLORS = [
  "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ec4899", "#a855f7", "#14b8a6",
  "#f97316", "#ef4444", "#6366f1", "#22c55e",
];
function getSenderColor(senderId: string): string {
  let hash = 0;
  for (const ch of senderId) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return GROUP_COLORS[hash % GROUP_COLORS.length];
}

interface ChatMessageBubbleProps {
  msg: ChatMessage;
  isGroup: boolean;
  conversationPartnerName: string;
  onLongPress: (msg: ChatMessage) => void;
  onImagePress: (url: string) => void;
  onReplyPress: (id: string | undefined) => void;
  showAvatar?: boolean;
  showSenderName?: boolean;
}

export function ChatMessageBubble({
  msg,
  isGroup,
  conversationPartnerName,
  onLongPress,
  onImagePress,
  onReplyPress,
  showAvatar = false,
  showSenderName = false,
}: ChatMessageBubbleProps) {
  const senderColor = isGroup && !msg.sent && msg.senderId
    ? getSenderColor(msg.senderId)
    : "#8b5cf6";
  const senderInitial = msg.sender?.charAt(0).toUpperCase() ?? "?";

  return (
    <Pressable
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress(msg);
      }}
      delayLongPress={300}
    >
      {/* WhatsApp-style row: avatar on left for group messages from others */}
      <HStack
        alignItems="flex-end"
        mb="$1"
        px="$4"
        justifyContent={msg.sent ? "flex-end" : "flex-start"}
      >
        {/* Avatar slot — always reserve width so bubbles stay aligned */}
        {isGroup && !msg.sent && (
          <Box w={28} h={28} mr="$1.5" mb="$0.5" flexShrink={0}>
            {showAvatar && (
              msg.senderAvatar ? (
                <Image
                  source={{ uri: msg.senderAvatar }}
                  style={{ width: 28, height: 28, borderRadius: 14 }}
                  contentFit="cover"
                />
              ) : (
                <Box
                  w={28} h={28} borderRadius={14}
                  justifyContent="center" alignItems="center"
                  style={{ backgroundColor: senderColor }}
                >
                  <Text fontSize={12} fontWeight="$bold" color="#FFFFFF">{senderInitial}</Text>
                </Box>
              )
            )}
          </Box>
        )}

        {/* Sender name + bubble */}
        <VStack style={{ maxWidth: isGroup && !msg.sent ? SCREEN_WIDTH * 0.72 : SCREEN_WIDTH * 0.80 }}>
          {showSenderName && msg.sender && (
            <Text
              fontSize={11}
              fontWeight="$bold"
              mb="$0.5"
              ml="$1"
              style={{ color: senderColor }}
            >
              {msg.sender}
            </Text>
          )}
          <Box
            bg={msg.deleted ? "transparent" : msg.sent ? PRIMARY_COLOR : "#E6E5EB"}
            borderRadius={18}
            borderBottomRightRadius={msg.sent ? 4 : 18}
            borderBottomLeftRadius={msg.sent ? 18 : 4}
            overflow="hidden"
            opacity={msg.sent && msg.id.startsWith("local-") ? 0.7 : 1}
            {...(msg.deleted && { borderWidth: 1, borderColor: "#D0D0D0" })}
          >
          {msg.deleted ? (
            <HStack px="$4" py="$3" alignItems="center" space="xs">
              <MaterialIcons name="block" size={14} color="#999999" />
              <Text fontSize={14} color="#999999" fontStyle="italic">This message was deleted</Text>
            </HStack>
          ) : (
            <>
              {/* Reply preview */}
              {msg.replyTo && (
                <Pressable onPress={() => onReplyPress(msg.replyTo?.id)}>
                  <Box bg={msg.sent ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.06)"} mx="$2" mt="$2" borderRadius={10} px="$3" py="$2">
                    <Box borderLeftWidth={3} borderLeftColor={msg.sent ? "#FFFFFF" : PRIMARY_COLOR} pl="$2">
                      <Text fontSize={11} fontWeight="$bold" color={msg.sent ? "#FFFFFF" : PRIMARY_COLOR}>
                        {msg.replyTo.sender || conversationPartnerName}
                      </Text>
                      {msg.replyTo.type === MessageType.IMAGE ? (
                        <HStack space="xs" alignItems="center">
                          <MaterialIcons name="image" size={12} color={msg.sent ? "rgba(255,255,255,0.8)" : "#666666"} />
                          <Text fontSize={11} color={msg.sent ? "rgba(255,255,255,0.8)" : "#666666"}>Photo</Text>
                        </HStack>
                      ) : msg.replyTo.type === MessageType.AUDIO ? (
                         <HStack space="xs" alignItems="center">
                          <MaterialIcons name="mic" size={12} color={msg.sent ? "rgba(255,255,255,0.8)" : "#666666"} />
                          <Text fontSize={11} color={msg.sent ? "rgba(255,255,255,0.8)" : "#666666"}>Voice Note</Text>
                        </HStack>
                      ) : (
                        <Text fontSize={11} color={msg.sent ? "rgba(255,255,255,0.8)" : "#666666"} numberOfLines={1}>
                          {msg.replyTo.text || "Message"}
                        </Text>
                      )}
                    </Box>
                  </Box>
                </Pressable>
              )}


              {/* Image */}
              {msg.type === MessageType.IMAGE && msg.mediaUrl && (
                <Pressable onPress={() => onImagePress(msg.mediaUrl!)}>
                  <Image
                    source={{ uri: msg.mediaUrl }}
                    style={{ width: 200, height: 200, borderRadius: 12, margin: 4 }}
                    contentFit="cover"
                  />
                </Pressable>
              )}

              {/* Audio */}
              {msg.type === MessageType.AUDIO && msg.mediaUrl && (
                <Box w={200} px="$2" py="$1">
                  <VoiceNotePlayer uri={msg.mediaUrl} sent={msg.sent} />
                </Box>
              )}

              {/* PDF / File */}
              {msg.type === MessageType.FILE && msg.mediaUrl && (
                <Pressable onPress={() => Linking.openURL(msg.mediaUrl!)}>
                  <HStack px="$4" py="$3" alignItems="center" space="sm">
                    <MaterialIcons name="picture-as-pdf" size={24} color={msg.sent ? "#FFFFFF" : "#E53935"} />
                    <Text fontSize={14} color={msg.sent ? "#FFFFFF" : "#1A1A1A"} flex={1} numberOfLines={1}>
                      {msg.mediaUrl.split("/").pop() || "Document"}
                    </Text>
                  </HStack>
                </Pressable>
              )}

              {/* Video */}
              {msg.type === MessageType.VIDEO && msg.mediaUrl && (
                <Pressable onPress={() => Linking.openURL(msg.mediaUrl!)}>
                  <Box w={200} h={120} bg="#000000" borderRadius={12} margin={4} justifyContent="center" alignItems="center">
                    <MaterialIcons name="play-circle-filled" size={48} color="#FFFFFF" />
                  </Box>
                </Pressable>
              )}

              {/* Meetup */}
              {msg.type === MessageType.MEETUP && msg.meetup && (() => {
                // Sent = coral brand colors; Received = gray/neutral so it reads like a normal received bubble
                const meetupBg = msg.sent ? "#E86A7A" : "#D4C8D8";
                const accentBar = msg.sent ? "#B73041" : "#8B6B8F";
                const textColor = msg.sent ? "#FFFFFF" : "#1A1A1A";
                const subTextColor = msg.sent ? "rgba(255,255,255,0.85)" : "#555555";
                const iconBg = msg.sent ? "rgba(255,255,255,0.15)" : "rgba(90,42,84,0.12)";
                return (
                  <Box bg={meetupBg} borderRadius={18} overflow="hidden" flexDirection="row">
                    <Box w={6} bg={accentBar} opacity={0.6} />
                    <HStack px="$4" py="$4" space="md" alignItems="center" flex={1}>
                      <Box bg={iconBg} p="$1.5" borderRadius={10} alignItems="center" justifyContent="center">
                        <MeetupBubbleIcon size={34} color={msg.sent ? "white" : "#5A2A54"} />
                      </Box>
                      <VStack flex={1}>
                        <Text fontSize={16} fontWeight="$bold" color={textColor} numberOfLines={1}>
                          {msg.meetup.title}
                        </Text>
                        <Text fontSize={13} color={subTextColor} mt="$1">
                          {(() => {
                            const date = new Date(msg.meetup.date);
                            const day = date.getDate();
                            const month = date.toLocaleDateString("en-GB", { month: "short" });
                            const year = date.getFullYear();
                            const suffix = ["th", "st", "nd", "rd"][(day % 10 > 3 || Math.floor((day % 100) / 10) === 1) ? 0 : day % 10];
                            return `${day}${suffix} ${month}. ${year}`;
                          })()} • {msg.meetup.time.toLowerCase()}
                        </Text>
                        <Text fontSize={13} color={subTextColor} mt="$1" numberOfLines={1}>
                          {msg.meetup.location}
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>
                );
              })()}

              {/* Missed Call */}
              {msg.type === MessageType.MISSED_CALL && (
                <HStack px="$4" py="$3" alignItems="center" space="sm">
                  <MaterialIcons
                    name="call-missed"
                    size={18}
                    color={msg.sent ? "rgba(255,255,255,0.9)" : "#FF3B30"}
                  />
                  <Text fontSize={14} color={msg.sent ? "rgba(255,255,255,0.9)" : "#1A1A1A"} fontStyle="italic">
                    {msg.text || "Missed call"}
                  </Text>
                </HStack>
              )}

              {/* Text */}
              {msg.text && msg.type !== MessageType.MISSED_CALL && (
                <Box px="$4" py="$2.5">
                  <Text fontSize={15} color={msg.sent ? "#FFFFFF" : "#1A1A1A"}>{msg.text}</Text>
                </Box>
              )}

              {/* Time + Read status — always right-aligned; "edited" sits inline with the time */}
              {(() => {
                const isPending = msg.sent && msg.id.startsWith("local-");
                return (
                  <HStack justifyContent="flex-end" alignItems="center" px="$3" pb="$1.5" space="sm">
                    {!isPending && msg.edited && msg.type !== MessageType.MEETUP && msg.type !== MessageType.MISSED_CALL && (
                      <Text fontSize={10} fontStyle="italic" color={msg.sent ? "rgba(255,255,255,0.6)" : "#999999"}>edited</Text>
                    )}
                    <HStack alignItems="center" space="xs">
                      <Text fontSize={10} color={msg.sent ? "rgba(255,255,255,0.7)" : "#999999"}>
                        {isPending ? "Sending..." : msg.time}
                      </Text>
                      {msg.sent && !isGroup && (
                        isPending ? (
                          <MaterialIcons name="access-time" size={11} color="rgba(255,255,255,0.5)" />
                        ) : (
                          <MaterialIcons name="done-all" size={12} color={msg.read ? "#53BDEB" : "rgba(255,255,255,0.5)"} />
                        )
                      )}
                    </HStack>
                  </HStack>
                );
              })()}
            </>
          )}
          </Box>
        </VStack>
      </HStack>
    </Pressable>
  );
}

// ── Context Action Bar (WhatsApp-style) ─────────────────────────────────────

interface ChatContextMenuProps {
  msg: ChatMessage;
  onClose: () => void;
  onReply: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ChatContextMenu({ msg, onClose, onReply, onCopy, onEdit, onDelete }: ChatContextMenuProps) {
  return (
    <Box position="absolute" top={0} left={0} right={0} bottom={0} zIndex={200}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Box flex={1} bg="rgba(0,0,0,0.15)">
          <Box bg="#FFFFFF" pt="$12" pb="$3" px="$4"
            shadowColor="#000000" shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.1} shadowRadius={4} elevation={5}
          >
            <HStack justifyContent="space-around" alignItems="center">
              <Pressable alignItems="center" onPress={onReply} px="$3" py="$1">
                <MaterialIcons name="reply" size={22} color="#1A1A1A" />
                <Text fontSize={11} color="#1A1A1A" mt="$0.5">Reply</Text>
              </Pressable>
 
              <Pressable alignItems="center" onPress={onCopy} px="$3" py="$1">
                <MaterialIcons name="content-copy" size={22} color="#1A1A1A" />
                <Text fontSize={11} color="#1A1A1A" mt="$0.5">Copy</Text>
              </Pressable>
 
              {msg.sent && (
                <Pressable alignItems="center" onPress={onEdit} px="$3" py="$1">
                  <MaterialIcons name="edit" size={22} color="#1A1A1A" />
                  <Text fontSize={11} color="#1A1A1A" mt="$0.5">Edit</Text>
                </Pressable>
              )}
 
              <Pressable alignItems="center" onPress={onDelete} px="$3" py="$1">
                <MaterialIcons name="delete-outline" size={22} color="#1A1A1A" />
                <Text fontSize={11} color="#1A1A1A" mt="$0.5">Delete</Text>
              </Pressable>
            </HStack>
          </Box>
        </Box>
      </TouchableWithoutFeedback>
    </Box>
  );
}
