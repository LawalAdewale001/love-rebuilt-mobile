import { Audio, AVPlaybackStatus } from "expo-av";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Box, HStack, Pressable, Text } from "@gluestack-ui/themed";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, View } from "react-native";
import { PRIMARY_COLOR } from "@/constants/theme";

interface VoiceNotePlayerProps {
  uri: string;
  sent: boolean;
  durationMs?: number;
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function VoiceNotePlayerComponent({ uri, sent, durationMs }: VoiceNotePlayerProps) {
  const [isLoading, setIsLoading]   = useState(false);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [posSec,    setPosSec]      = useState(0);
  const [durSec,    setDurSec]      = useState(Math.round((durationMs ?? 0) / 1000));

  const soundRef      = useRef<Audio.Sound | null>(null);
  const posRef        = useRef(0);          // exact ms, no re-renders
  const durRef        = useRef(durationMs ?? 0);
  const finishedRef   = useRef(false);
  const trackWidthRef = useRef(0);
  const progressAnim  = useRef(new Animated.Value(0)).current;

  // ── Unload on unmount ──────────────────────────────────────────────────────
  useEffect(() => () => { soundRef.current?.unloadAsync().catch(() => {}); }, []);

  // ── Position text — 1 re-render/sec while playing ─────────────────────────
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => setPosSec(Math.floor(posRef.current / 1000)), 1000);
    return () => clearInterval(id);
  }, [isPlaying]);

  // ── Native playback callback — touches state ONLY on finish ───────────────
  const onStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    const pos = status.positionMillis;
    const dur = status.durationMillis ?? durRef.current;

    // Update refs (no re-renders)
    posRef.current = pos;
    if (dur > durRef.current) {
      durRef.current = dur;
      setDurSec(Math.round(dur / 1000)); // fires once when duration becomes known
    }

    // Drive progress bar via Animated — zero React re-renders
    if (dur > 0 && trackWidthRef.current > 0) {
      progressAnim.setValue((pos / dur) * trackWidthRef.current);
    }

    // Finish — setState only here (rare, can't loop)
    if (status.didJustFinish) {
      finishedRef.current = true;
      posRef.current = 0;
      progressAnim.setValue(0);
      setPosSec(0);
      setIsPlaying(false);
    }
  }, [progressAnim]);

  // ── Core play / pause ──────────────────────────────────────────────────────
  const playPause = useCallback(async () => {
    if (isLoading) return;

    // ── First tap: load & start ──────────────────────────────────────────────
    if (!soundRef.current) {
      setIsLoading(true);
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true, progressUpdateIntervalMillis: 100 },
          onStatus
        );
        soundRef.current = sound;
        // Grab duration immediately if available
        const st = await sound.getStatusAsync();
        if (st.isLoaded && st.durationMillis) {
          durRef.current = st.durationMillis;
          setDurSec(Math.round(st.durationMillis / 1000));
        }
        setIsPlaying(true);
      } catch (e) {
        console.error("[VoiceNote] load error:", e);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const snd = soundRef.current;

    // ── Pause ────────────────────────────────────────────────────────────────
    if (isPlaying) {
      setIsPlaying(false);
      await snd.pauseAsync().catch(() => {});
      return;
    }

    // ── Play / Replay ────────────────────────────────────────────────────────
    finishedRef.current = false;
    try {
      // If finished (pos was reset to 0) or user is at start, seek to 0 first
      await snd.setPositionAsync(posRef.current);
      await snd.playAsync();
      setIsPlaying(true);
    } catch (e) {
      console.error("[VoiceNote] play error:", e);
      // Sound in bad state — drop it so next tap does a fresh load
      soundRef.current = null;
      posRef.current = 0;
      progressAnim.setValue(0);
      setPosSec(0);
    }
  }, [isLoading, isPlaying, uri, onStatus, progressAnim]);

  // ── Colors ─────────────────────────────────────────────────────────────────
  const iconColor  = sent ? PRIMARY_COLOR : "#FFFFFF";
  const trackColor = sent ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.08)";
  const fillColor  = sent ? "#FFFFFF" : PRIMARY_COLOR;
  const buttonBg   = sent ? "#FFFFFF" : PRIMARY_COLOR;
  const timeColor  = sent ? "#FFFFFF" : "#999999";

  return (
    <Box bg={sent ? "rgba(255,255,255,0.1)" : "#F2F2F2"} borderRadius={12} p="$2" minWidth={180}>
      <HStack alignItems="center" space="xs">

        {/* Play / Pause button */}
        <Pressable
          onPress={playPause}
          w={32} h={32} borderRadius={16}
          bg={buttonBg}
          justifyContent="center" alignItems="center"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={iconColor} />
          ) : (
            <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={20} color={iconColor} />
          )}
        </Pressable>

        {/* Track + timestamps */}
        <Box flex={1} px="$1">
          <View
            style={{ height: 4, backgroundColor: trackColor, borderRadius: 2, marginBottom: 4 }}
            onLayout={e => { trackWidthRef.current = e.nativeEvent.layout.width; }}
          >
            <Animated.View
              style={{ height: "100%", width: progressAnim, backgroundColor: fillColor, borderRadius: 2 }}
            />
          </View>
          <HStack justifyContent="space-between">
            <Text fontSize={10} color={timeColor}>{fmt(posSec * 1000)}</Text>
            <Text fontSize={10} color={timeColor}>{durSec > 0 ? fmt(durSec * 1000) : "--:--"}</Text>
          </HStack>
        </Box>

      </HStack>
    </Box>
  );
}

export const VoiceNotePlayer = memo(VoiceNotePlayerComponent);
