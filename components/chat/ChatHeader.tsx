import React from "react";
import {
  CallOptionIcon,
  VideoCallOptionIcon,
  PlanMeetupOptionIcon,
  BlockOptionIcon,
  ReportOptionIcon,
  LeaveGroupOptionIcon,
  HeartIcon,
} from "@/components/ui/chat-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Box, HStack, Pressable, Text, VStack } from "@gluestack-ui/themed";
import { Image } from "expo-image";
import { useRef } from "react";
import { ActivityIndicator, Animated } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useInteractionMutation } from "@/lib/queries";
import { PRIMARY_COLOR } from "@/constants/theme";
import type { SheetType } from "@/types/chat.types";

type OptionItem = {
  label: string;
  appendName: boolean;
  Icon: React.ComponentType<{ size: number }>;
  sheet: SheetType;
  callType: string | null;
};

const PRIVATE_OPTIONS_MENU: OptionItem[] = [
  { label: "Call", appendName: true, Icon: CallOptionIcon, sheet: null, callType: "voice" },
  { label: "Video Call", appendName: true, Icon: VideoCallOptionIcon, sheet: null, callType: "video" },
  { label: "Plan a meetup", appendName: false, Icon: PlanMeetupOptionIcon, sheet: "planMeetup", callType: null },
  { label: "Block", appendName: false, Icon: BlockOptionIcon, sheet: "block", callType: null },
  { label: "Report", appendName: false, Icon: ReportOptionIcon, sheet: "report", callType: null },
];

const GROUP_OPTIONS_MENU: OptionItem[] = [
  { label: "Leave Group", appendName: false, Icon: LeaveGroupOptionIcon, sheet: "leave", callType: null },
  { label: "Report Group", appendName: false, Icon: ReportOptionIcon, sheet: "report", callType: null },
];

interface ChatHeaderProps {
  name: string;
  avatar?: string;
  isOnline: boolean;
  isGroup: boolean;
  isLiked: boolean;
  setIsLiked: (v: boolean) => void;
  recipientIdParam?: string;
  lastSeen?: string;
  isUploading?: boolean;
  showOptions: boolean;
  setShowOptions: (v: boolean) => void;
  openSheet: (type: SheetType) => void;
  isBlocked: boolean;
  onUnblock: () => void;
  isUnblocking?: boolean;
  isMember?: boolean;
  chatId: string;
}

export function ChatHeader({
  name,
  avatar,
  isOnline,
  isGroup,
  isLiked,
  setIsLiked,
  recipientIdParam,
  lastSeen,
  isUploading,
  showOptions,
  setShowOptions,
  openSheet,
  isBlocked,
  onUnblock,
  isUnblocking,
  isMember = true,
  chatId,
}: ChatHeaderProps) {
  const router = useRouter();
  const likeScale = useRef(new Animated.Value(1)).current;
  const interactionMutation = useInteractionMutation();

  const formatLastSeen = (dateStr?: string) => {
    if (!dateStr) return "Offline";
    const date = new Date(dateStr);
    const now = new Date();
    
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (isToday) return `Last seen ${time}`;
    if (isYesterday) return `Last seen Yesterday`;
    return `Last seen ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
  };

  const handleLikePress = () => {
    const newLiked = !isLiked;
    Haptics.impactAsync(newLiked ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(likeScale, { toValue: 1.4, useNativeDriver: true, speed: 50, bounciness: 12 }),
      Animated.spring(likeScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
    ]).start();
    setIsLiked(newLiked);
    if (recipientIdParam) {
      interactionMutation.mutate(
        { receiverId: recipientIdParam, type: newLiked ? "like" : "dislike" },
        { onError: () => setIsLiked(!newLiked) }
      );
    }
  };

  return (
    <>
      <HStack
        px="$4"
        py="$3"
        alignItems="center"
        justifyContent="space-between"
        borderBottomWidth={1}
        borderBottomColor="#F4F3F2"
        opacity={isUploading ? 0.6 : 1}
      >
        <HStack alignItems="center" space="sm" flex={1}>
          <Pressable
            onPress={() => router.back()}
            disabled={isUploading}
            w={36} h={36} borderRadius={18} bg="#F5F5F5"
            justifyContent="center" alignItems="center"
          >
            <MaterialIcons name="arrow-back" size={20} color={isUploading ? "#999999" : "#1A1A1A"} />
          </Pressable>

          {avatar ? (
            <Box w={36} h={36} borderRadius={18} overflow="hidden">
              <Image source={{ uri: avatar }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            </Box>
          ) : (
            <Box w={36} h={36} borderRadius={18} bg="#F0C4C8" justifyContent="center" alignItems="center">
              <MaterialIcons name="person" size={20} color={PRIMARY_COLOR} />
            </Box>
          )}

          <VStack flex={1} mr="$2">
            <Text fontSize={17} fontWeight="$600" color="#1A1A1A" numberOfLines={1} ellipsizeMode="tail">
              {name}
            </Text>
            {!isGroup && (
              <HStack alignItems="center" space="xs">
                <Box w={8} h={8} borderRadius={4} bg={isOnline ? "#5A2A54" : "#BDBDBD"} />
                <Text fontSize={12} color={isOnline ? "#5A2A54" : "#999999"}>
                  {isOnline ? "Online" : formatLastSeen(lastSeen)}
                </Text>
              </HStack>
            )}
          </VStack>
        </HStack>

        <HStack alignItems="center" space="md">
          {!isGroup && recipientIdParam && (
            <Pressable onPress={handleLikePress} disabled={isUploading}>
              <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                <HeartIcon size={28} isLiked={isLiked} />
              </Animated.View>
            </Pressable>
          )}
          {isGroup && !isMember ? (
            <Pressable 
              bg={PRIMARY_COLOR} 
              px="$4" 
              py="$2" 
              borderRadius="$full" 
              onPress={() => openSheet("joinGroup")}
              sx={{
                ":hover": { opacity: 0.8 },
                ":active": { opacity: 0.7 },
              }}
            >
              <Text color="#FFFFFF" fontSize={14} fontWeight="$bold">Join</Text>
            </Pressable>
          ) : (
            <Pressable 
              onPress={() => setShowOptions(!showOptions)} 
              disabled={isUploading || isUnblocking}
              bg="transparent"
              p="$2"
              borderRadius="$full"
              hitSlop={15}
            >
              <MaterialIcons 
                name="more-vert" 
                size={26} 
                color={(isUploading || isUnblocking) ? "#BDBDBD" : "#1A1A1A"} 
              />
            </Pressable>
          )}
        </HStack>
      </HStack>

      {/* Options Dropdown — backdrop lives in the parent screen at screen level */}
      {showOptions && (
        <Box
          position="absolute"
          top={70}
          right={16}
          bg="#FFFFFF"
          borderRadius={12}
          py="$1"
          zIndex={100}
          shadowColor="#000000"
          shadowOffset={{ width: 0, height: 4 }}
          shadowOpacity={0.12}
          shadowRadius={12}
          elevation={8}
          minWidth={220}
        >
          {(isGroup ? GROUP_OPTIONS_MENU : PRIVATE_OPTIONS_MENU).map((option, index) => {
            const isLast = index === (isGroup ? GROUP_OPTIONS_MENU : PRIVATE_OPTIONS_MENU).length - 1;
            const label =
              option.label === "Block"
                ? isBlocked ? (isUnblocking ? "Unblocking..." : "Unblock") : "Block"
                : option.label;
            return (
              <Pressable
                key={option.label}
                onPress={() => {
                  setShowOptions(false);
                  // Small delay so the dropdown closes cleanly before navigating/opening sheet
                  setTimeout(() => {
                    if (option.callType) {
                      router.push({
                        pathname: "/call-screen",
                        params: {
                          name,
                          type: option.callType,
                          chatId,
                          avatar,
                          mode: "outgoing",
                          recipientId: recipientIdParam,
                        },
                      });
                    } else if (option.label === "Block" || option.label === "Unblock") {
                      isBlocked ? onUnblock() : openSheet("block");
                    } else if (option.sheet) {
                      openSheet(option.sheet);
                    }
                  }, 80);
                }}
                px="$5"
                py="$3.5"
                borderBottomWidth={isLast ? 0 : 1}
                borderBottomColor="#F5F5F5"
              >
                <HStack alignItems="center" space="md" opacity={(isUploading || isUnblocking) ? 0.5 : 1}>
                  {option.label === "Block" && isBlocked && isUnblocking ? (
                    <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                  ) : (
                    <option.Icon size={22} />
                  )}
                  <Text fontSize={15} color="#1A1A1A" fontWeight="$medium">
                    {label}{option.appendName ? ` ${name}` : ""}
                  </Text>
                </HStack>
              </Pressable>
            );
          })}
        </Box>
      )}
    </>
  );
}
