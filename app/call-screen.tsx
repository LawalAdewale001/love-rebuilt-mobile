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
import { RtcSurfaceView } from 'react-native-agora';
import { useCallTokenQuery } from "@/lib/queries";
import { useAgoraRTC } from "@/hooks/use-agora-rtc";
import { Audio } from "expo-av";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CALLER_IMAGE =
  "https://ui-avatars.com/api/?background=EFEFEF&color=999999&size=256&name=User";

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function CallScreen() {
  const router = useRouter();
  const { name = "Patricia", type = "voice", chatId = "", avatar = "" } = useLocalSearchParams<{
    name: string;
    type: string;
    chatId: string;
    avatar: string;
  }>();
  const isVideo = type === "video";

  const callerImage = avatar || CALLER_IMAGE;

  // Voice/Video Call Permissions
  useEffect(() => {
    (async () => {
      const { status: micStatus } = await Audio.requestPermissionsAsync();
      if (micStatus !== 'granted') {
        Alert.alert('Permission needed', 'Microphone permission is required for calls.');
        router.back();
      }

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          staysActiveInBackground: true,
          playThroughEarpieceAndroid: false, // Default to speaker for waiting
        });
      } catch (error) {
        console.warn("[Audio] Failed to set audio mode", error);
      }
    })();
  }, []);

  // Fetch Token
  const { 
    data: callData, 
    isLoading: isTokenLoading, 
    error: tokenError,
    refetch: refetchToken 
  } = useCallTokenQuery(chatId);

  // Agora Hook
  const { 
    joined, 
    remoteUsers, 
    isMuted, 
    isSpeakerOn, 
    toggleMute, 
    toggleSpeaker, 
    leave 
  } = useAgoraRTC({
    channelName: callData?.channelName || chatId,
    token: callData?.token || '',
    uid: callData?.uid ?? 0,
    isVideo,
    onTokenError: () => {
      console.log("[Agora] Token expired or about to expire, refetching...");
      refetchToken();
    }
  });

  useEffect(() => {
    if (callData) {
      console.log("[Agora] Token API Response:", {
          token: callData.token ? "PRESENT (starts with " + callData.token.substring(0, 10) + "...)" : "MISSING",
          uid: callData.uid,
          channelName: callData.channelName,
          chatId: chatId
      });
      if (callData.token) {
        console.log("[Agora] Channel:", callData.channelName);
      }
    }
  }, [callData, chatId]);

  const [elapsed, setElapsed] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const controlsSlide = useRef(new Animated.Value(80)).current;
  const pipScale = useRef(new Animated.Value(0)).current;
  
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);

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

  // Timer starts when BOTH users have joined
  useEffect(() => {
    if (!joined || remoteUsers.length === 0) return;
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [joined, remoteUsers.length]);

  const handleEndCall = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    leave();
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
  }, [leave]);

  // Ringtone / Timeout logic
  const ringtoneRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let timeoutId: any;

    const startRingtone = async () => {
      try {
        if (!ringtoneRef.current) {
          console.log("[Audio] Initializing ringtone...");
          
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            staysActiveInBackground: true,
            playThroughEarpieceAndroid: false,
          });

          const { sound } = await Audio.Sound.createAsync(
            { uri: 'https://codeskulptor-demos.commondatastorage.googleapis.com/descent/background%20music.mp3' },
            { shouldPlay: true, isLooping: true, volume: 1.0 }
          );
          ringtoneRef.current = sound;
          console.log("[Audio] Ringtone playing...");
        }
      } catch (error) {
         console.error("[Audio] Error starting ringtone:", error);
      }
    };

    const stopRingtone = async () => {
      if (ringtoneRef.current) {
        try {
          console.log("[Audio] Stopping ringtone.");
          await ringtoneRef.current.stopAsync();
          await ringtoneRef.current.unloadAsync();
          ringtoneRef.current = null;
        } catch (e) {
          console.warn("[Audio] Error stopping ringtone:", e);
        }
      }
    };

    if (remoteUsers.length === 0) {
      startRingtone();
      // 60s timeout for no response
      timeoutId = setTimeout(() => {
        setShowUnavailableModal(true);
      }, 60000);
    } else {
      stopRingtone();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      stopRingtone();
    };
  }, [remoteUsers.length, name, handleEndCall]);


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

  const UnavailableModal = () => (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0,0,0,0.7)"
      zIndex={100}
      justifyContent="center"
      alignItems="center"
      px="$10"
    >
      <VStack
        bg="#FFFFFF"
        w="100%"
        p="$8"
        borderRadius={24}
        space="lg"
        alignItems="center"
        shadowColor="#000"
        shadowOffset={{ width: 0, height: 10 }}
        shadowOpacity={0.15}
        shadowRadius={20}
        elevation={10}
      >
        <Box
          w={70}
          h={70}
          borderRadius={35}
          bg="#FCEFEF"
          justifyContent="center"
          alignItems="center"
          mb="$2"
        >
          <Text fontSize={32}>🕒</Text>
        </Box>
        
        <VStack space="xs" alignItems="center">
          <Text fontSize={20} fontWeight="$bold" color="#111111" textAlign="center">
            Unavailable
          </Text>
          <Text fontSize={15} color="#666666" textAlign="center" lineHeight={22}>
            {name} didn't answer the call. Would you like to try again later?
          </Text>
        </VStack>

        <Pressable 
          onPress={handleEndCall}
          w="100%"
          bg={PRIMARY_COLOR}
          py="$3.5"
          borderRadius={14}
          mt="$4"
          sx={{
            ":active": {
              opacity: 0.8
            }
          } as any}
        >
          <Text color="#FFFFFF" textAlign="center" fontWeight="$bold" fontSize={16}>
            OK
          </Text>
        </Pressable>
      </VStack>
    </Box>
  );

  // ── Video Call ──
  if (isVideo) {
    return (
      <Animated.View
        style={{ flex: 1, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
      >
        <StatusBar barStyle="light-content" />
        
        {/* Remote Video (Main View) */}
        {remoteUsers.length > 0 ? (
          <RtcSurfaceView
            canvas={{ uid: remoteUsers[0] }}
            style={{ position: "absolute", width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
          />
        ) : (
          <Box position="absolute" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} bg="#000" justifyContent="center" alignItems="center">
             <Text color="#FFFFFF">Waiting for {name} to join...</Text>
          </Box>
        )}

        {/* Dark overlay for readability */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0,0,0,0.15)"
          pointerEvents="none"
        />

        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <VStack flex={1} justifyContent="flex-end" pb="$8">
            <Box position="absolute" top={60} left={0} right={0} alignItems="center">
                <Text color="#FFFFFF" fontSize={22} fontWeight="$bold">{name}</Text>
                <Text color="rgba(255,255,255,0.8)">{joined ? formatTime(elapsed) : 'Connecting...'}</Text>
            </Box>

            {/* PIP self view (Local Video) */}
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
                width: 100,
                height: 140,
                backgroundColor: '#333'
              }}
            >
              <RtcSurfaceView
                canvas={{ uid: 0 }} // uid 0 is local
                style={{ width: '100%', height: '100%' }}
              />
            </Animated.View>

            {controls}
          </VStack>
        </SafeAreaView>
        {showUnavailableModal && <UnavailableModal />}
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
              {!joined ? 'Connecting...' : formatTime(elapsed)}
            </Text>
          </Animated.View>

          {/* Starburst avatar with pulse */}
          <Box flex={1} justifyContent="center" alignItems="center">
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <SingleStarburstFrame
                size={220}
                imageUri={callerImage}
              />
              {/* Audio wave overlay */}
              {joined && remoteUsers.length > 0 && (
                <Box position="absolute" bottom={15} right={60}>
                    <AudioWaveIcon size={36} />
                </Box>
              )}
            </Animated.View>
            {!joined && <ActivityIndicator color="#FFFFFF" style={{ marginTop: 20 }} />}
          </Box>

          {/* Controls */}
          <Box mb="$6">{controls}</Box>
        </VStack>

        {showUnavailableModal && <UnavailableModal />}
      </SafeAreaView>
    </Animated.View>
  );
}
