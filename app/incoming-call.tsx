/**
 * IncomingCallScreen — shown on the receiver's device when someone calls them.
 *
 * Plays a WhatsApp-like ringtone and presents Accept / Decline buttons.
 * Accepting emits call:accept and navigates to call-screen (incoming mode).
 * Declining emits call:reject and goes back.
 */

import { PRIMARY_COLOR } from "@/constants/theme";
import { SingleStarburstFrame } from "@/components/ui/chat-icons";
import { Box, HStack, Pressable, Text, VStack } from "@gluestack-ui/themed";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Animated, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { emitCallAccept, emitCallReject } from "@/lib/socket";

// Incoming ringtone — same file used on both caller and receiver sides
const RINGTONE = require("@/assets/audio/ringtone.mp3");

const CALLER_PLACEHOLDER =
  "https://ui-avatars.com/api/?background=EFEFEF&color=999999&size=256&name=User";

export default function IncomingCallScreen() {
  const router = useRouter();
  const {
    callerName = "Unknown",
    callerAvatar = "",
    callerId = "",
    channelName = "",
    isVideo: isVideoParam = "false",
  } = useLocalSearchParams<{
    callerName: string;
    callerAvatar: string;
    callerId: string;
    channelName: string;
    isVideo: string;
  }>();

  const isVideo = isVideoParam === "true";
  const avatarUri = callerAvatar || CALLER_PLACEHOLDER;

  // ── Animations ──────────────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const acceptScale = useRef(new Animated.Value(1)).current;
  const declineScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();

    // Gentle pulse on the avatar while ringing
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // ── Ringtone ─────────────────────────────────────────────────────────────────
  const ringtoneRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let active = true;

    const start = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          staysActiveInBackground: true,
          playThroughEarpieceAndroid: false,
        });
        const { sound } = await Audio.Sound.createAsync(
          RINGTONE,
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        if (!active) {
          sound.unloadAsync();
          return;
        }
        ringtoneRef.current = sound;
      } catch (e) {
        console.warn("[IncomingCall] Ringtone error:", e);
      }
    };

    start();

    return () => {
      active = false;
      ringtoneRef.current?.stopAsync().then(() => ringtoneRef.current?.unloadAsync());
      ringtoneRef.current = null;
    };
  }, []);

  const stopRingtone = useCallback(async () => {
    if (ringtoneRef.current) {
      try {
        await ringtoneRef.current.stopAsync();
        await ringtoneRef.current.unloadAsync();
        ringtoneRef.current = null;
      } catch {}
    }
  }, []);

  // ── Accept ───────────────────────────────────────────────────────────────────
  const handleAccept = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(acceptScale, { toValue: 0.9, useNativeDriver: true, speed: 50 }).start();
    await stopRingtone();
    emitCallAccept(callerId, channelName);
    router.replace({
      pathname: "/call-screen",
      params: {
        name: callerName,
        avatar: callerAvatar,
        type: isVideo ? "video" : "voice",
        chatId: channelName,
        mode: "incoming",
        callerId,
      },
    });
  }, [callerId, channelName, callerName, callerAvatar, isVideo, stopRingtone]);

  // ── Decline ──────────────────────────────────────────────────────────────────
  const handleDecline = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.spring(declineScale, { toValue: 0.9, useNativeDriver: true, speed: 50 }).start();
    await stopRingtone();
    emitCallReject(callerId);
    router.back();
  }, [callerId, stopRingtone]);

  return (
    <Animated.View style={{ flex: 1, backgroundColor: "#1A1A2E", opacity: fadeAnim }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <VStack flex={1} alignItems="center" justifyContent="space-between" py="$8">

          {/* Top — caller info */}
          <VStack alignItems="center" space="sm" mt="$6">
            <Text fontSize={13} color="rgba(255,255,255,0.6)" letterSpacing={1.5}>
              {isVideo ? "INCOMING VIDEO CALL" : "INCOMING VOICE CALL"}
            </Text>
            <Text fontSize={28} fontWeight="$bold" color="#FFFFFF" mt="$2">
              {callerName}
            </Text>
          </VStack>

          {/* Middle — pulsing avatar */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <SingleStarburstFrame size={220} imageUri={avatarUri} />
          </Animated.View>

          {/* Bottom — accept / decline */}
          <VStack alignItems="center" space="xl" w="100%" px="$10">
            {/* Labels */}
            <HStack w="100%" justifyContent="space-around" px="$6">
              <Text fontSize={12} color="rgba(255,255,255,0.5)">Decline</Text>
              <Text fontSize={12} color="rgba(255,255,255,0.5)">Accept</Text>
            </HStack>

            <HStack w="100%" justifyContent="space-around" px="$6">
              {/* Decline */}
              <Animated.View style={{ transform: [{ scale: declineScale }] }}>
                <Pressable
                  onPress={handleDecline}
                  w={72}
                  h={72}
                  borderRadius={36}
                  bg="#FF3B30"
                  justifyContent="center"
                  alignItems="center"
                  sx={{ ":active": { opacity: 0.8 } } as any}
                >
                  <MaterialIcons name="call-end" size={32} color="#FFFFFF" />
                </Pressable>
              </Animated.View>

              {/* Accept */}
              <Animated.View style={{ transform: [{ scale: acceptScale }] }}>
                <Pressable
                  onPress={handleAccept}
                  w={72}
                  h={72}
                  borderRadius={36}
                  bg="#34C759"
                  justifyContent="center"
                  alignItems="center"
                  sx={{ ":active": { opacity: 0.8 } } as any}
                >
                  <MaterialIcons
                    name={isVideo ? "videocam" : "call"}
                    size={32}
                    color="#FFFFFF"
                  />
                </Pressable>
              </Animated.View>
            </HStack>
          </VStack>
        </VStack>
      </SafeAreaView>
    </Animated.View>
  );
}
