import { PRIMARY_COLOR } from "@/constants/theme";
import { type ChatMessage, MessageType } from "@/types/chat.types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Box, HStack, Pressable, Text, VStack } from "@gluestack-ui/themed";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { MeetupBubbleIcon } from "@/components/ui/chat-icons";
import { Linking, TouchableWithoutFeedback } from "react-native";
import { VoiceNotePlayer } from "./VoiceNotePlayer";

interface ChatMessageBubbleProps {
  msg: ChatMessage;
  isGroup: boolean;
  conversationPartnerName: string;
  onLongPress: (msg: ChatMessage) => void;
  onImagePress: (url: string) => void;
  onReplyPress: (id: string | undefined) => void;
}

export function ChatMessageBubble({
  msg,
  isGroup,
  conversationPartnerName,
  onLongPress,
  onImagePress,
  onReplyPress,
}: ChatMessageBubbleProps) {
  return (
    <Pressable
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress(msg);
      }}
      delayLongPress={300}
    >
      <Box alignItems={msg.sent ? "flex-end" : "flex-start"} mb="$3" px="$4">
        {/* Group sender name */}
        {isGroup && !msg.sent && msg.sender && (
          <HStack alignItems="center" space="xs" mb="$1" ml="$1">
            <Box w={20} h={20} borderRadius={10} bg="#D0C4D8" justifyContent="center" alignItems="center" overflow="hidden">
              <MaterialIcons name="person" size={12} color="#FFFFFF" />
            </Box>
            <Text fontSize={11} color="#999999">-{msg.sender}</Text>
          </HStack>
        )}

        {/* Bubble */}
        <Box
          maxWidth="80%"
          bg={msg.deleted ? "transparent" : msg.sent ? PRIMARY_COLOR : "#E6E5EB"}
          borderRadius={18}
          borderBottomRightRadius={msg.sent ? 4 : 18}
          borderBottomLeftRadius={msg.sent ? 18 : 4}
          overflow="hidden"
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
              {msg.type === MessageType.MEETUP && msg.meetup && (
                <Box bg="#E86A7A" borderRadius={18} overflow="hidden" flexDirection="row">
                  <Box w={6} bg="#B73041" opacity={0.6} />
                  <HStack px="$4" py="$4" space="md" alignItems="center" flex={1}>
                    <Box bg="rgba(255,255,255,0.15)" p="$1.5" borderRadius={10} alignItems="center" justifyContent="center">
                      <MeetupBubbleIcon size={34} color="white" />
                    </Box>
                    <VStack flex={1}>
                      <Text fontSize={16} fontWeight="$bold" color="#FFFFFF" numberOfLines={1}>
                        {msg.meetup.title}
                      </Text>
                      <Text fontSize={13} color="#FFFFFF" mt="$1" opacity={0.9}>
                        {(() => {
                          const date = new Date(msg.meetup.date);
                          const day = date.getDate();
                          const month = date.toLocaleDateString("en-GB", { month: "short" });
                          const year = date.getFullYear();
                          const suffix = ["th", "st", "nd", "rd"][(day % 10 > 3 || Math.floor((day % 100) / 10) === 1) ? 0 : day % 10];
                          return `${day}${suffix} ${month}. ${year}`;
                        })()} • {msg.meetup.time.toLowerCase()}
                      </Text>
                      <Text fontSize={13} color="#FFFFFF" mt="$1" opacity={0.8} numberOfLines={1}>
                        {msg.meetup.location}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              )}

              {/* Text */}
              {msg.text && (
                <Box px="$4" py="$2.5">
                  <Text fontSize={15} color={msg.sent ? "#FFFFFF" : "#1A1A1A"}>{msg.text}</Text>
                </Box>
              )}

              {/* Time + Read status */}
              <HStack justifyContent={msg.edited ? "space-between" : "flex-end"} alignItems="center" px="$3" pb="$1.5">
                {msg.edited && (
                  <Text fontSize={10} fontStyle="italic" color={msg.sent ? "rgba(255,255,255,0.6)" : "#999999"}>edited</Text>
                )}
                <HStack alignItems="center" space="xs">
                  <Text fontSize={10} color={msg.sent ? "rgba(255,255,255,0.7)" : "#999999"}>{msg.time}</Text>
                  {msg.sent && !isGroup && (
                    <MaterialIcons name="done-all" size={12} color={msg.read ? "#53BDEB" : "rgba(255,255,255,0.5)"} />
                  )}
                </HStack>
              </HStack>
            </>
          )}
        </Box>
      </Box>
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
