import { useEffect, useRef, useState, useCallback } from 'react';
import { Audio } from 'expo-av';
import createAgoraRtcEngine, {
  ChannelProfileType,
  ClientRoleType,
  RtcConnection,
  RtcStats,
  UserOfflineReasonType,
  IRtcEngineEx
} from 'react-native-agora';

const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || '0390cd9052974a819289eca519074070'; // Replace with your actual App ID

export type AgoraRTCProps = {
  channelName: string;
  token: string;
  uid: number | string;
  isVideo: boolean;
  onTokenError?: () => void;
};

export function useAgoraRTC({ channelName, token, uid, isVideo, onTokenError }: AgoraRTCProps) {
  const engine = useRef<IRtcEngineEx | null>(null);
  const prevToken = useRef<string>(token);
  const [joined, setJoined] = useState(false);
  const [localUid, setLocalUid] = useState<number>(0);
  const [remoteUsers, setRemoteUsers] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const init = useCallback(async () => {
    try {
      if (engine.current) {
        if (prevToken.current !== token && token) {
          console.log('[Agora] Token updated, renewing/re-joining...');
          if (joined) {
            engine.current.renewToken(token);
          } else {
             // Re-join if not yet joined
             if (typeof uid === 'string') {
              engine.current.joinChannelWithUserAccount(token, channelName, uid, {
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                publishCameraTrack: isVideo,
                publishMicrophoneTrack: true,
              });
            } else {
              engine.current.joinChannel(token, channelName, uid, {
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                publishCameraTrack: isVideo,
                publishMicrophoneTrack: true,
              });
            }
          }
          prevToken.current = token;
        }
        return;
      }

      engine.current = createAgoraRtcEngine() as IRtcEngineEx;
      engine.current.initialize({
        appId: AGORA_APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });

      engine.current.registerEventHandler({
        onJoinChannelSuccess: (connection: RtcConnection, elapsed: number) => {
          console.log('[Agora] Joined channel:', connection.channelId, 'as UID:', connection.localUid);
          setLocalUid(connection.localUid || 0);
          setJoined(true);
        },
        onUserJoined: (connection: RtcConnection, remoteUid: number, elapsed: number) => {
          console.log('[Agora] Remote user joined:', remoteUid);
          setRemoteUsers((prev) => [...new Set([...prev, remoteUid])]);
        },
        onUserOffline: (connection: RtcConnection, remoteUid: number, reason: UserOfflineReasonType) => {
          console.log('[Agora] Remote user offline:', remoteUid);
          setRemoteUsers((prev) => prev.filter((id) => id !== remoteUid));
        },
        onLeaveChannel: (connection: RtcConnection, stats: RtcStats) => {
          console.log('[Agora] Left channel');
          setJoined(false);
          setRemoteUsers([]);
          setLocalUid(0);
        },
        onTokenPrivilegeWillExpire: (connection: RtcConnection, token: string) => {
          console.warn('[Agora] Token will expire soon');
          onTokenError?.();
        },
        onRequestToken: (connection: RtcConnection) => {
          console.warn('[Agora] Token expired, request new token');
          onTokenError?.();
        },
        onError: (err: number, msg: string) => {
          const errorType = err === 110 ? "TOKEN_EXPIRED (110)" : err;
          console.error(`[Agora] Error: ${errorType}`, msg);
          if (err === 110) onTokenError?.();
        },
      });

      // Audio must be enabled for all call types (including video)
      engine.current.enableAudio();

      if (isVideo) {
        engine.current.enableVideo();
        engine.current.enableLocalVideo(true);
        engine.current.startPreview();
      }

      engine.current.setEnableSpeakerphone(isSpeakerOn);

      console.log('[Agora] Joining:', { 
        channel: channelName, 
        uid: uid, 
        type: typeof uid,
        token: token ? 'PRESENT' : 'MISSING' 
      });

      if (typeof uid === 'string') {
        engine.current.joinChannelWithUserAccount(token, channelName, uid, {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          publishCameraTrack: isVideo,
          publishMicrophoneTrack: true,
        });
      } else {
        engine.current.joinChannel(token, channelName, uid, {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          publishCameraTrack: isVideo,
          publishMicrophoneTrack: true,
        });
      }
      
      prevToken.current = token;
    } catch (e) {
      console.error('[Agora] Initialization failed:', e);
    }
  }, [channelName, isVideo, token, uid, isSpeakerOn, joined, onTokenError]);

  const leave = useCallback(() => {
    const eng = engine.current;
    engine.current = null; // Clear ref first so no further calls land on it
    setJoined(false);
    setRemoteUsers([]);
    setLocalUid(0);

    if (eng) {
      try { eng.muteLocalAudioStream(true); } catch { }
      if (isVideo) { try { eng.muteLocalVideoStream(true); } catch { } }
      try { eng.leaveChannel(); } catch { }
      // Brief delay so leaveChannel can complete before release + audio reset
      setTimeout(() => {
        try { eng.release(); } catch { }
        Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: false,
          shouldDuckAndroid: false,
          staysActiveInBackground: false,
          playThroughEarpieceAndroid: false,
        }).catch(() => {});
      }, 300);
    } else {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        shouldDuckAndroid: false,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
      }).catch(() => {});
    }
  }, [isVideo]);

  const toggleMute = useCallback(() => {
    if (engine.current) {
      engine.current.muteLocalAudioStream(!isMuted);
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const toggleSpeaker = useCallback(() => {
    if (engine.current) {
      engine.current.setEnableSpeakerphone(!isSpeakerOn);
      setIsSpeakerOn(!isSpeakerOn);
    }
  }, [isSpeakerOn]);

  useEffect(() => {
    if (channelName && token && uid !== undefined) {
      init();
    }
    return () => {
    };
  }, [channelName, init, token, uid]);

  return {
    joined,
    localUid,
    remoteUsers,
    isMuted,
    isSpeakerOn,
    toggleMute,
    toggleSpeaker,
    leave,
    engine: engine.current,
  };
}
