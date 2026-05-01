import { Audio, AVPlaybackStatus } from "expo-av";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Box, HStack, Pressable, Text, VStack } from "@gluestack-ui/themed";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator } from "react-native";
import { PRIMARY_COLOR } from "@/constants/theme";

interface VoiceNotePlayerProps {
  uri: string;
  sent: boolean;
  durationMs?: number;
}

function VoiceNotePlayerComponent({ uri, sent, durationMs }: VoiceNotePlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(durationMs ?? 0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const didFinishRef = useRef(false);

  useEffect(() => {
    soundRef.current = sound;
    return () => {
      const toUnload = soundRef.current;
      if (toUnload) Promise.resolve().then(() => toUnload.unloadAsync().catch(() => {}));
    };
  }, [sound]);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPosition(status.positionMillis);
    if (status.durationMillis) setDuration(status.durationMillis);
    if (status.didJustFinish) {
      didFinishRef.current = true;
      setIsPlaying(false);
      setPosition(0);
    } else {
      setIsPlaying(status.isPlaying);
    }
  }, []);

  const playPause = async () => {
    // Already loaded — just play/pause/replay
    if (sound) {
      if (isPlaying) {
        setIsPlaying(false);
        await sound.pauseAsync();
      } else if (didFinishRef.current || position === 0) {
        didFinishRef.current = false;
        setIsPlaying(true);
        await sound.replayAsync();
      } else {
        setIsPlaying(true);
        await sound.playAsync();
      }
      return;
    }

    // Load on first tap
    setIsLoading(true);
    try {
      const { sound: loaded } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, progressUpdateIntervalMillis: 100 },
        onPlaybackStatusUpdate
      );
      try {
        const status = await loaded.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          setDuration(status.durationMillis);
        }
      } catch {}
      setSound(loaded);
    } catch (e) {
      console.error("Failed to load voice note", e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? position / duration : 0;
  const iconColor = sent ? PRIMARY_COLOR : "#FFFFFF";
  const trackColor = sent ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.05)";
  const fillColor = sent ? "#FFFFFF" : PRIMARY_COLOR;
  const buttonBg = sent ? "#FFFFFF" : PRIMARY_COLOR;
  const timeColor = sent ? "#FFFFFF" : "#999999";

  return (
    <Box
      bg={sent ? "rgba(255,255,255,0.1)" : "#F2F2F2"}
      borderRadius={12}
      p="$2"
      minWidth={180}
    >
      <HStack alignItems="center" space="xs">
        <Pressable
          onPress={isLoading ? undefined : playPause}
          w={32} h={32} borderRadius={16}
          bg={buttonBg}
          justifyContent="center" alignItems="center"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={iconColor} />
          ) : (
            <MaterialIcons
              name={isPlaying ? "pause" : "play-arrow"}
              size={20}
              color={iconColor}
            />
          )}
        </Pressable>

        <VStack flex={1} space="xs" justifyContent="center">
          <Box h={4} bg={trackColor} borderRadius={2} mx="$1">
            <Box
              h="100%"
              w={`${progress * 100}%`}
              bg={fillColor}
              borderRadius={2}
            />
          </Box>
          <HStack justifyContent="space-between" px="$1">
            <Text fontSize={10} color={timeColor}>{formatTime(position)}</Text>
            <Text fontSize={10} color={timeColor}>
              {duration > 0 ? formatTime(duration) : "--:--"}
            </Text>
          </HStack>
        </VStack>
      </HStack>
    </Box>
  );
}

export const VoiceNotePlayer = memo(VoiceNotePlayerComponent);
