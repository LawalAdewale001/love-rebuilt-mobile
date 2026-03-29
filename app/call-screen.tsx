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
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CALLER_IMAGE =
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&crop=top";
const SELF_IMAGE =
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop&crop=top";
const VIDEO_BG =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=1200&fit=crop&crop=face";

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function CallScreen() {
  const router = useRouter();
  const { name = "Patricia", type = "voice" } = useLocalSearchParams<{
    name: string;
    type: string;
  }>();
  const isVideo = type === "video";

  const [speakerOn, setSpeakerOn] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const controlsSlide = useRef(new Animated.Value(80)).current;
  const pipScale = useRef(new Animated.Value(0)).current;

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(controlsSlide, {
        toValue: 0,
        tension: 50,
        friction: 10,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    if (isVideo) {
      Animated.spring(pipScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        delay: 500,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  // Pulse animation for voice call starburst
  useEffect(() => {
    if (isVideo) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isVideo]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEndCall = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => router.back());
  }, []);

  const toggleSpeaker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSpeakerOn((v) => !v);
  };

  const toggleMic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMicMuted((v) => !v);
  };

  // ── Controls Row (shared between voice & video) ──
  const controls = (
    <Animated.View
      style={{
        transform: [{ translateY: controlsSlide }],
        opacity: fadeAnim,
      }}
    >
      <HStack justifyContent="center" space="xl" px="$8">
        <Pressable onPress={toggleSpeaker}>
          <SpeakerIcon size={58} active={speakerOn} />
        </Pressable>
        <Pressable onPress={toggleMic}>
          <MicMuteIcon size={58} active={micMuted} />
        </Pressable>
        <Pressable onPress={handleEndCall}>
          <EndCallIcon size={58} />
        </Pressable>
      </HStack>
    </Animated.View>
  );

  // ── Video Call ──
  if (isVideo) {
    return (
      <Animated.View
        style={{ flex: 1, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
      >
        <StatusBar barStyle="light-content" />
        <Image
          source={{ uri: VIDEO_BG }}
          style={{ position: "absolute", width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
          contentFit="cover"
        />
        {/* Dark overlay for readability */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0,0,0,0.15)"
        />

        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <VStack flex={1} justifyContent="flex-end" pb="$8">
            {/* PIP self view */}
            <Animated.View
              style={{
                position: "absolute",
                bottom: 140,
                right: 20,
                transform: [{ scale: pipScale }],
                borderRadius: 12,
                overflow: "hidden",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 8,
              }}
            >
              <Image
                source={{ uri: SELF_IMAGE }}
                style={{ width: 100, height: 140, borderRadius: 12 }}
                contentFit="cover"
              />
            </Animated.View>

            {controls}
          </VStack>
        </SafeAreaView>
      </Animated.View>
    );
  }

  // ── Voice Call ──
  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: PRIMARY_COLOR,
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <VStack flex={1} alignItems="center">
          {/* Name & timer */}
          <Animated.View
            style={{ alignItems: "center", marginTop: 16, opacity: fadeAnim }}
          >
            <Text fontSize={22} fontWeight="$bold" color="#FFFFFF">
              {name}
            </Text>
            <Text fontSize={14} color="rgba(255,255,255,0.8)" mt="$1">
              {formatTime(elapsed)}
            </Text>
          </Animated.View>

          {/* Starburst avatar with pulse */}
          <Box flex={1} justifyContent="center" alignItems="center">
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <SingleStarburstFrame
                size={220}
                imageUri={CALLER_IMAGE}
              />
              {/* Audio wave overlay */}
              <Box position="absolute" bottom={15} right={60}>
                <AudioWaveIcon size={36} />
              </Box>
            </Animated.View>
          </Box>

          {/* Controls */}
          <Box mb="$6">{controls}</Box>
        </VStack>
      </SafeAreaView>
    </Animated.View>
  );
}
