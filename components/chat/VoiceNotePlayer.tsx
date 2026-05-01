import { Audio, AVPlaybackStatus } from "expo-av";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Box, HStack, Pressable, Text, VStack } from "@gluestack-ui/themed";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { PRIMARY_COLOR } from "@/constants/theme";

interface VoiceNotePlayerProps {
  uri: string;
  sent: boolean;
  durationMs?: number;
}

function VoiceNotePlayerComponent({ uri, sent, durationMs }: VoiceNotePlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(durationMs ?? 0);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const loadingRef = useRef(false);
  // Tracks whether playback reached the end so we know to replay from start
  const didFinishRef = useRef(false);

  useEffect(() => {
    soundRef.current = sound;
    return () => {
      // Unload on a microtask to avoid calling ExoPlayer.release() from
      // its own status-callback thread (pool-N), which crashes on Android.
      const toUnload = soundRef.current;
      if (toUnload) Promise.resolve().then(() => toUnload.unloadAsync().catch(() => {}));
    };
  }, [sound]);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      if (status.durationMillis) setDuration(status.durationMillis);
      if (status.didJustFinish) {
        // Reset UI — do NOT call stopAsync/unloadAsync here; this callback
        // runs on ExoPlayer's internal thread and calling ExoPlayer methods
        // from it throws IllegalStateException on Android.
        didFinishRef.current = true;
        setIsPlaying(false);
        setPosition(0);
      } else {
        setIsPlaying(status.isPlaying);
      }
    }
  }, []);

  // Preload audio silently as soon as the bubble renders.
  // After load, read duration explicitly via getStatusAsync() — the status
  // callback alone doesn't always fire with durationMillis on first load.
  useEffect(() => {
    if (!uri) return;
    let mounted = true;
    loadingRef.current = true;

    Audio.Sound.createAsync(
      { uri },
      { shouldPlay: false },
      onPlaybackStatusUpdate
    )
      .then(async ({ sound: preloaded }) => {
        if (!mounted) {
          preloaded.unloadAsync().catch(() => {});
          return;
        }
        // Explicitly fetch duration from metadata right after load
        try {
          const status = await preloaded.getStatusAsync();
          if (status.isLoaded && status.durationMillis) {
            setDuration(status.durationMillis);
          }
        } catch {}
        setSound(preloaded);
      })
      .catch(() => {})
      .finally(() => { loadingRef.current = false; });

    return () => { mounted = false; };
  }, [uri, onPlaybackStatusUpdate]);

  const playPause = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else if (didFinishRef.current || position === 0) {
        // Replay from start after finishing, or on first tap
        didFinishRef.current = false;
        await sound.replayAsync();
      } else {
        // Resume from paused position
        await sound.playAsync();
      }
    } else if (!loadingRef.current) {
      // Preload failed — retry on demand
      setIsLoading(true);
      loadingRef.current = true;
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
      } catch (e) {
        console.error("Failed to load sound", e);
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    }
    // If loadingRef is true: preload still in flight — tap is ignored (< 1s window)
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? position / duration : 0;

  return (
    <Box
      bg={sent ? "rgba(255,255,255,0.1)" : "#F2F2F2"}
      borderRadius={12}
      p="$2"
      minWidth={180}
    >
      <HStack alignItems="center" space="xs">
        <Pressable
          onPress={playPause}
          w={32} h={32} borderRadius={16}
          bg={sent ? "#FFFFFF" : PRIMARY_COLOR}
          justifyContent="center" alignItems="center"
        >
          {isLoading ? (
            <MaterialIcons name="hourglass-empty" size={18} color={sent ? PRIMARY_COLOR : "#FFFFFF"} />
          ) : (
            <MaterialIcons
              name={isPlaying ? "pause" : "play-arrow"}
              size={20}
              color={sent ? PRIMARY_COLOR : "#FFFFFF"}
            />
          )}
        </Pressable>

        <VStack flex={1} space="xs" justifyContent="center">
          <Box h={4} bg={sent ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.05)"} borderRadius={2} mx="$1">
            <Box
              h="100%"
              w={`${progress * 100}%`}
              bg={sent ? "#FFFFFF" : PRIMARY_COLOR}
              borderRadius={2}
            />
          </Box>
          <HStack justifyContent="space-between" px="$1">
            <Text fontSize={10} color={sent ? "#FFFFFF" : "#999999"}>{formatTime(position)}</Text>
            <Text fontSize={10} color={sent ? "#FFFFFF" : "#999999"}>{formatTime(duration)}</Text>
          </HStack>
        </VStack>
      </HStack>
    </Box>
  );
}

export const VoiceNotePlayer = memo(VoiceNotePlayerComponent);
