import { Audio, AVPlaybackStatus } from "expo-av";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Box, HStack, Pressable, Text, VStack } from "@gluestack-ui/themed";
import { memo, useEffect, useRef, useState } from "react";
import { PRIMARY_COLOR } from "@/constants/theme";

interface VoiceNotePlayerProps {
  uri: string;
  sent: boolean;
}

function VoiceNotePlayerComponent({ uri, sent }: VoiceNotePlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    soundRef.current = sound;
    return () => {
      // Unload on a microtask to avoid calling ExoPlayer.release() from
      // its own status-callback thread (pool-N), which crashes on Android.
      const toUnload = soundRef.current;
      if (toUnload) Promise.resolve().then(() => toUnload.unloadAsync().catch(() => {}));
    };
  }, [sound]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      if (status.didJustFinish) {
        // Reset UI — do NOT call stopAsync/unloadAsync here; this callback
        // runs on ExoPlayer's internal thread and calling ExoPlayer methods
        // from it throws IllegalStateException on Android.
        setIsPlaying(false);
        setPosition(0);
      } else {
        setIsPlaying(status.isPlaying);
      }
    }
  };

  const playPause = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } else {
      setIsLoading(true);
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
      }
    }
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
