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
import { Animated } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useInteractionMutation } from "@/lib/queries";
import { PRIMARY_COLOR } from "@/constants/theme";
import type { SheetType } from "@/types/chat.types";

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

          <VStack flex={1}>
            <Text fontSize={17} fontWeight="$bold" color="#1A1A1A" numberOfLines={1} ellipsizeMode="tail">
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
          <Pressable onPress={() => setShowOptions(!showOptions)} disabled={isUploading}>
            <MaterialIcons name="more-vert" size={24} color={isUploading ? "#BDBDBD" : "#1A1A1A"} />
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
                  router.push({ pathname: "/call-screen", params: { name, type: option.callType } });
                } else if (option.sheet) {
                  openSheet(option.sheet);
                }
              }}
              px="$4"
              py="$3"
            >
              <HStack alignItems="center" space="md">
                {option.icon}
                <Text fontSize={14} color="#1A1A1A" numberOfLines={1} ellipsizeMode="tail" flex={1}>
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
          top={0} left={0} right={0} bottom={0}
          zIndex={99}
          onPress={() => setShowOptions(false)}
        />
      )}
    </>
  );
}
