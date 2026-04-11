/**
 * CallScreen — active call UI for both voice and video calls.
 *
 * mode = "outgoing"
 *   Phase 1 "calling":  Plays ringtone. Waits for call:accepted via socket.
 *                        Does NOT join Agora yet (so no mic is active).
 *   Phase 2 "connected": call:accepted received → joins Agora → timer starts
 *                         when onUserJoined fires (both sides in channel).
 *
 * mode = "incoming"
 *   Receiver already accepted in IncomingCallScreen.
 *   Joins Agora immediately. Timer starts when caller's onUserJoined fires.
 */

import {
  AudioWaveIcon,
  EndCallIcon,
  MicMuteIcon,
  SingleStarburstFrame,
  SpeakerIcon,
} from "@/components/ui/chat-icons";
import { PRIMARY_COLOR } from "@/constants/theme";
import { Box, HStack, Pressable, Text, VStack } from "@gluestack-ui/themed";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, StatusBar, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RtcSurfaceView } from "react-native-agora";
import { useCallTokenQuery } from "@/lib/queries";
import { useAgoraRTC } from "@/hooks/use-agora-rtc";
import { Audio } from "expo-av";
import { getSocket, emitCallInvite, emitCallHangup } from "@/lib/socket";
import { getAuthUser } from "@/lib/auth-store";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CALLER_PLACEHOLDER =
  "https://ui-avatars.com/api/?background=EFEFEF&color=999999&size=256&name=User";

// Same ringtone for both outgoing (caller hears) and incoming (receiver hears)
const RINGTONE = require("@/assets/audio/ringtone.mp3");

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type CallPhase = "calling" | "connected" | "declined" | "timeout";

export default function CallScreen() {
  const router = useRouter();
  const {
    name = "User",
    type = "voice",
    chatId = "",
    avatar = "",
    mode = "outgoing",
    recipientId = "",
    callerId = "",
  } = useLocalSearchParams<{
    name: string;
    type: string;
    chatId: string;
    avatar: string;
    mode: string;
    recipientId: string;
    callerId: string;
  }>();

  const isVideo = type === "video";
  const isOutgoing = mode === "outgoing";
  const otherUserId = isOutgoing ? recipientId : callerId;

  const callerImage = avatar || CALLER_PLACEHOLDER;
  const currentUser = getAuthUser();

  // ── Phase ────────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<CallPhase>("calling");

  // For outgoing calls: don't join Agora until the receiver has accepted.
  // This ensures the microphone is not active during the ringing phase.
  const [callAccepted, setCallAccepted] = useState(!isOutgoing);

  // ── Permissions ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Microphone permission is required for calls.");
        router.back();
        return;
      }
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          staysActiveInBackground: true,
          playThroughEarpieceAndroid: false,
        });
      } catch { }
    })();
  }, []);

  // ── Token ────────────────────────────────────────────────────────────────────
  const { data: callData, isLoading: isTokenLoading, error: tokenError, refetch: refetchToken } =
    useCallTokenQuery(chatId);

  // Only pass a real token to Agora once the call has been accepted.
  // For incoming calls callAccepted starts as true so Agora joins immediately.
  const agoraToken = callAccepted ? (callData?.token || "") : "";

  // ── Agora ────────────────────────────────────────────────────────────────────
  const { joined, remoteUsers, isMuted, isSpeakerOn, toggleMute, toggleSpeaker, leave } =
    useAgoraRTC({
      channelName: callData?.channelName || chatId,
      token: agoraToken,
      uid: callData?.uid ?? 0,
      isVideo,
      onTokenError: () => refetchToken(),
    });

  // ── Timer — starts only when remote user joins (both sides connected) ────────
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (remoteUsers.length === 0) return;
    setPhase("connected");
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [remoteUsers.length]);

  // ── Animations ───────────────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const controlsSlide = useRef(new Animated.Value(80)).current;
  const pipScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.spring(controlsSlide, { toValue: 0, tension: 50, friction: 10, delay: 200, useNativeDriver: true }),
    ]).start();
    if (isVideo) {
      Animated.spring(pipScale, { toValue: 1, tension: 50, friction: 8, delay: 500, useNativeDriver: true }).start();
    }
  }, []);

  useEffect(() => {
    if (isVideo) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isVideo]);

  // ── End call ─────────────────────────────────────────────────────────────────
  const handleEndCall = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (otherUserId && chatId) {
      emitCallHangup(otherUserId, chatId);
    }
    leave();
    // Ensure audio mode is fully reset so the mic stops immediately
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false,
      shouldDuckAndroid: false,
      staysActiveInBackground: false,
      playThroughEarpieceAndroid: false,
    }).catch(() => { });
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 250, useNativeDriver: true }),
    ]).start(() => router.back());
  }, [leave, otherUserId, chatId]);

  // ── Outgoing ringtone + call invite ─────────────────────────────────────────
  const ringtoneRef = useRef<Audio.Sound | null>(null);
  const inviteSentRef = useRef(false);

  const stopRingtone = useCallback(async () => {
    if (ringtoneRef.current) {
      try {
        await ringtoneRef.current.stopAsync();
        await ringtoneRef.current.unloadAsync();
      } catch { }
      ringtoneRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOutgoing) return;
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const startRing = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          RINGTONE,
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        if (!active) { sound.unloadAsync(); return; }
        ringtoneRef.current = sound;
      } catch (e) {
        console.warn("[CallScreen] Outgoing ring error:", e);
      }
    };

    // Emit invite once the token is ready (invite includes channelName for Agora)
    if (callData?.token && recipientId && !inviteSentRef.current) {
      inviteSentRef.current = true;
      emitCallInvite({
        receiverId: recipientId,
        channelName: chatId,
        isVideo,
        info: {
          callerName: currentUser?.fullName || "Someone",
          callerAvatar: currentUser?.avatar || "",
        },
      });
    }

    if (phase === "calling") {
      startRing();
      timeoutId = setTimeout(() => {
        setPhase("timeout");
        emitCallHangup(otherUserId, chatId);
      }, 60000);
    } else {
      stopRingtone();
    }

    return () => {
      active = false;
      clearTimeout(timeoutId);
      stopRingtone();
    };
  }, [isOutgoing, phase, callData?.token, recipientId]);

  // ── Socket listeners (outgoing: accepted / rejected / hung up) ───────────────
  useEffect(() => {
    if (!isOutgoing) return;
    const socket = getSocket();
    if (!socket) return;

    const onAccepted = () => {
      stopRingtone();
      setCallAccepted(true); // Unlock Agora → mic + audio start NOW
    };

    const onRejected = () => {
      stopRingtone();
      setPhase("declined");
    };

    const onHangedUp = () => {
      stopRingtone();
      leave();
      router.back();
    };

    socket.on("call:accepted", onAccepted);
    socket.on("call:rejected", onRejected);
    socket.on("call:hanged-up", onHangedUp);

    return () => {
      socket.off("call:accepted", onAccepted);
      socket.off("call:rejected", onRejected);
      socket.off("call:hanged-up", onHangedUp);
    };
  }, [isOutgoing, stopRingtone, leave]);

  // ── Incoming: listen for hangup from caller ──────────────────────────────────
  useEffect(() => {
    if (isOutgoing) return;
    const socket = getSocket();
    if (!socket) return;

    const onHangedUp = () => {
      leave();
      router.back();
    };

    socket.on("call:hanged-up", onHangedUp);
    return () => {
      socket.off("call:hanged-up", onHangedUp);
    }
  }, [isOutgoing, leave]);


  // ── Status label ─────────────────────────────────────────────────────────────
  const statusLabel = () => {
    if (phase === "connected") return formatTime(elapsed);
    if (phase === "declined") return "Declined";
    if (phase === "timeout") return "No answer";
    if (isOutgoing) return "Calling...";
    return "Connecting...";
  };

  // ── Controls row ─────────────────────────────────────────────────────────────
  const controls = (
    <Animated.View style={{ transform: [{ translateY: controlsSlide }], opacity: fadeAnim }}>
      <HStack justifyContent="center" space="xl" px="$8">
        <Pressable onPress={toggleSpeaker}>
          <SpeakerIcon size={58} active={isSpeakerOn} />
        </Pressable>
        <Pressable onPress={toggleMute}>
          <MicMuteIcon size={58} active={isMuted} />
        </Pressable>
        <Pressable onPress={handleEndCall}>
          <EndCallIcon size={58} />
        </Pressable>
      </HStack>
    </Animated.View>
  );

  // ── Ended overlay ─────────────────────────────────────────────────────────────
  const EndedOverlay = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <Box
      position="absolute" top={0} left={0} right={0} bottom={0}
      bg="rgba(0,0,0,0.7)" zIndex={100} justifyContent="center" alignItems="center" px="$10"
    >
      <VStack
        bg="#FFFFFF" w="100%" p="$8" borderRadius={24} space="lg" alignItems="center"
        shadowColor="#000" shadowOffset={{ width: 0, height: 10 }}
        shadowOpacity={0.15} shadowRadius={20} elevation={10}
      >
        <Box w={70} h={70} borderRadius={35} bg="#FCEFEF" justifyContent="center" alignItems="center" mb="$2">
          <Text fontSize={32}>{phase === "declined" ? "📵" : "🕒"}</Text>
        </Box>
        <VStack space="xs" alignItems="center">
          <Text fontSize={20} fontWeight="$bold" color="#111111" textAlign="center">{title}</Text>
          <Text fontSize={15} color="#666666" textAlign="center" lineHeight={22}>{subtitle}</Text>
        </VStack>
        <Pressable
          onPress={handleEndCall} w="100%" bg={PRIMARY_COLOR} py="$3.5"
          borderRadius={14} mt="$4" sx={{ ":active": { opacity: 0.8 } } as any}
        >
          <Text color="#FFFFFF" textAlign="center" fontWeight="$bold" fontSize={16}>OK</Text>
        </Pressable>
      </VStack>
    </Box>
  );

  // ── Loading / error ───────────────────────────────────────────────────────────
  if (isTokenLoading) {
    return (
      <Box flex={1} bg={PRIMARY_COLOR} justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text color="#FFFFFF" mt="$4">Connecting...</Text>
      </Box>
    );
  }

  if (tokenError) {
    return (
      <Box flex={1} bg={PRIMARY_COLOR} justifyContent="center" alignItems="center" px="$10">
        <Text color="#FFFFFF" textAlign="center" mb="$4">Failed to initialize call. Please try again.</Text>
        <Pressable onPress={() => router.back()} bg="#FFFFFF" px="$6" py="$2" borderRadius={8}>
          <Text color={PRIMARY_COLOR} fontWeight="$bold">Go Back</Text>
        </Pressable>
      </Box>
    );
  }

  // ── Video call ────────────────────────────────────────────────────────────────
  if (isVideo) {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <StatusBar barStyle="light-content" />

        {remoteUsers.length > 0 ? (
          <RtcSurfaceView
            canvas={{ uid: remoteUsers[0] }}
            style={{ position: "absolute", width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
          />
        ) : (
          <Box position="absolute" width={SCREEN_WIDTH} height={SCREEN_HEIGHT}
            bg="#000" justifyContent="center" alignItems="center">
            <Text color="#FFFFFF">{isOutgoing ? `Calling ${name}...` : `Waiting for ${name}...`}</Text>
          </Box>
        )}

        <Box position="absolute" top={0} left={0} right={0} bottom={0}
          bg="rgba(0,0,0,0.15)" pointerEvents="none" />

        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <VStack flex={1} justifyContent="flex-end" pb="$8">
            <Box position="absolute" top={60} left={0} right={0} alignItems="center">
              <Text color="#FFFFFF" fontSize={22} fontWeight="$bold">{name}</Text>
              <Text color="rgba(255,255,255,0.8)">{statusLabel()}</Text>
            </Box>

            {/* PIP self-view */}
            {callAccepted && (
              <Animated.View
                style={{
                  position: "absolute", bottom: 140, right: 20,
                  transform: [{ scale: pipScale }],
                  borderRadius: 12, overflow: "hidden",
                  shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
                  width: 100, height: 140, backgroundColor: "#333",
                }}
              >
                <RtcSurfaceView canvas={{ uid: 0 }} style={{ width: "100%", height: "100%" }} />
              </Animated.View>
            )}

            {controls}
          </VStack>
        </SafeAreaView>

        {phase === "declined" && <EndedOverlay title="Call Declined" subtitle={`${name} declined the call.`} />}
        {phase === "timeout" && <EndedOverlay title="No Answer" subtitle={`${name} didn't answer the call.`} />}
      </Animated.View>
    );
  }

  // ── Voice call ────────────────────────────────────────────────────────────────
  return (
    <Animated.View
      style={{ flex: 1, backgroundColor: PRIMARY_COLOR, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <VStack flex={1} alignItems="center">

          {/* Name & status */}
          <Animated.View style={{ alignItems: "center", marginTop: 16, opacity: fadeAnim }}>
            <Text fontSize={22} fontWeight="$bold" color="#FFFFFF">{name}</Text>
            <Text fontSize={14} color="rgba(255,255,255,0.8)" mt="$1">{statusLabel()}</Text>
          </Animated.View>

          {/* Starburst avatar */}
          <Box flex={1} justifyContent="center" alignItems="center">
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <SingleStarburstFrame size={220} imageUri={callerImage} />
              {phase === "connected" && remoteUsers.length > 0 && (
                <Box position="absolute" bottom={15} right={60}>
                  <AudioWaveIcon size={36} />
                </Box>
              )}
            </Animated.View>
            {phase === "calling" && isOutgoing && (
              <ActivityIndicator color="#FFFFFF" style={{ marginTop: 20 }} />
            )}
          </Box>

          {/* Controls */}
          <Box mb="$6">{controls}</Box>
        </VStack>

        {phase === "declined" && <EndedOverlay title="Call Declined" subtitle={`${name} declined the call.`} />}
        {phase === "timeout" && <EndedOverlay title="No Answer" subtitle={`${name} didn't answer the call.`} />}
      </SafeAreaView>
    </Animated.View>
  );
}
