import { getAccessToken } from "../../../lib/authToken";
import './RoomPage.scss'
import './themse/Themes.scss'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { AiTwotoneSetting } from "react-icons/ai";
import { BsEmojiLaughing, BsFillPeopleFill, BsFillShareFill, BsMicFill, BsMicMuteFill, BsReplyFill, BsPeopleFill } from "react-icons/bs";
import { IoChatbubblesSharp, IoChevronBack, IoClose, IoExitOutline } from "react-icons/io5";
import { FaArrowRight, FaCheck } from "react-icons/fa6";
import { TbSticker, TbMovieOff, TbPlayerPlayFilled, TbX } from "react-icons/tb";

import SettingsModal, { DEFAULT_SUBTITLE_SETTINGS, type SubtitleSettings } from "./settingsModal/SettingsModal";
import ChatMessage from "./ChatMessage";
import EmojiPicker from "./EmojiePicker";
import UsersModal from "./usersModal/UsersModal";
import MediaTypeModal from "./mediaTypeModal/MediaTypeModal";
import ArchiveModal, { type SelectedArchiveMedia } from "./archiveModal/ArchiveModal";
import InviteModal from "./inviteModal/InviteModal";
import VideoPlayer from "./videoPlayer.tsx/VideoPlayer";
import { archiveApi } from "../../../apiCalls/archiveApi";

import {
  getRoom,
  getTurnCredentials,
  getRoomAnnouncements,
  getSharedRoomSubtitles,
  leaveRoom,
  sendRoomMessage,
  uploadRoomMedia,
  editRoomMessage,
  kickRoomMember,
  updateRoomMemberRole,
  type ConnectionStatus,
  type RoomMessageResponse,
  type RoomReactionResponse,
  type RoomResponse,
  type RoomArchiveMediaState,
  type RoomSocketUserPresence,
  type RoomAnnouncement,
  type RoomAnnouncementsResponse,
} from "../../../apiCalls/roomApi";
import { useAuth } from "../../../context/AuthContext";
import AnimatedParticle from '../../../components/animatedParticle/AnimatedParticle';
import { useConfirmationModal } from '../../../context/ConfirmModalContext/ConfirmaModalContext';
import { useAppViewport } from '../../../hooks/useAppViewPort';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PiUserSoundFill } from "react-icons/pi";

type ClientSocketEvent =
  | {
    type: "chat_message";
    payload: { content: string; replying_to?: string | null };
  }
  | {
    type: "reaction";
    payload: {
      emoji: string;
    };
  }
  | {
    type: "voice_offer";
    payload: any;
  }
  | {
    type: "voice_answer";
    payload: any;
  }
  | {
    type: "voice_ice";
    payload: any;
  }
  | {
    type: "voice_state";
    payload: {
      user_id: string;
      enabled: boolean;
    };
  }
  | {
    type: "sync_playback";
    payload: {
      action: "play" | "pause" | "seek" | "sync" | "load";
      playback_time: number;
      currently_playing?: string | null;
      currently_playing_media?: RoomArchiveMediaState | null;
      is_playing: boolean;
      user_id: string;
      upload_id?: string;
      subtitles?: { id: string; filename: string; cues: { start: number; end: number; text: string }[] }[];
      currently_playing_subtitles?: string | null;
    };
  }
  | {
    type: "update_settings";
    payload: {
      is_public?: boolean;
      media_control_permission?: "admin" | "everyone";
    };
  };

type ServerSocketEvent =
  | {
    type: "chat_message";
    payload: RoomMessageResponse;
  }
  | {
    type: "chat_message_updated";
    payload: RoomMessageResponse;
  }
  | {
    type: "member_status";
    payload: {
      user_id: string;
      status: ConnectionStatus;
    };
  }
  | {
    type: "user_joined";
    payload: RoomSocketUserPresence;
  }
  | {
    type: "user_left";
    payload: RoomSocketUserPresence;
  }
  | {
    type: "reaction";
    payload: RoomReactionResponse;
  }
  | {
    type: "user_kicked";
    payload: { user_id: string };
  }
  | {
    type: "update_role";
    payload: { user_id: string; role: "admin" | "member" };
  }
  | {
    type: "sync_playback";
    payload: {
      action: "play" | "pause" | "seek" | "sync" | "load";
      playback_time: number;
      currently_playing?: string | null;
      currently_playing_media?: RoomArchiveMediaState | null;
      is_playing: boolean;
      user_id: string;
      upload_id?: string;
      subtitles?: { id: string; filename: string; cues: { start: number; end: number; text: string }[] }[];
      currently_playing_subtitles?: string | null;
    };
  }
  | {
    type: "admin_chat_message";
    payload: { id: string; content: string; created_at: string };
  }
  | { type: "voice_offer"; payload: any }
  | { type: "voice_answer"; payload: any }
  | { type: "voice_ice"; payload: any }
  | { type: "voice_state"; payload: { user_id: string; enabled: boolean } }
  | {
    type: "update_settings";
    payload: {
      is_public?: boolean;
      media_control_permission?: "admin" | "everyone";
    };
  }
  | {
    type: "error";
    payload: { message: string };
  }
  | {
    type: "room_announcement";
    payload: {
      action: "upsert" | "remove";
      announcement?: RoomAnnouncement;
      id?: string;
    };
  };

const CHAT_WIDTH_STORAGE_KEY = "cinema-room-chat-width";
const DEFAULT_CHAT_WIDTH = 345;
const MIN_CHAT_WIDTH = 275;

const ROOM_SOUND_STORAGE_KEY = "cinema-room-sound-volumes";

const ROOM_SOUND_SOURCES = {
  userJoined: "/roomSound/selfJoin.wav",
  otherUserJoined: "/roomSound/userJoin.wav",
  otherUserLeft: "/roomSound/userExit.wav",
  newChatMessage: "/roomSound/message.wav",
  adminAnnouncement: "/roomSound/adminBroadcast.wav",
} as const;

type RoomSoundKey = keyof typeof ROOM_SOUND_SOURCES;
type RoomSoundVolumes = Record<RoomSoundKey, number>;

const DEFAULT_ROOM_SOUND_VOLUMES: RoomSoundVolumes = {
  userJoined: 5,
  otherUserJoined: 5,
  otherUserLeft: 5,
  newChatMessage: 5,
  adminAnnouncement: 5,
};

const getStoredRoomSoundVolumes = (): RoomSoundVolumes => {
  if (typeof window === "undefined") return DEFAULT_ROOM_SOUND_VOLUMES;

  try {
    const stored = JSON.parse(window.localStorage.getItem(ROOM_SOUND_STORAGE_KEY) ?? "null");
    if (!stored || typeof stored !== "object") return DEFAULT_ROOM_SOUND_VOLUMES;

    return (Object.keys(DEFAULT_ROOM_SOUND_VOLUMES) as RoomSoundKey[]).reduce((result, key) => {
      const value = Number(stored[key]);
      result[key] = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : DEFAULT_ROOM_SOUND_VOLUMES[key];
      return result;
    }, {} as RoomSoundVolumes);
  } catch {
    return DEFAULT_ROOM_SOUND_VOLUMES;
  }
};

function buildWsUrl(baseUrl: string, roomId: string, token?: string, stealthAdmin = false) {
  const url = new URL(baseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = url.pathname.replace(/\/$/, "") + `/rooms/${roomId}/ws`;
  if (token) url.searchParams.set("token", token);
  if (stealthAdmin) url.searchParams.set("admin", "1");
  return url.toString();
}

const getStoredChatWidth = () => {
  if (typeof window === "undefined") return DEFAULT_CHAT_WIDTH;

  try {
    const stored = Number(window.localStorage.getItem(CHAT_WIDTH_STORAGE_KEY));
    return Number.isFinite(stored) && stored > 0 ? stored : DEFAULT_CHAT_WIDTH;
  } catch {
    return DEFAULT_CHAT_WIDTH;
  }
};

const RoomPage = () => {
  const { id: roomId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isStealthAdmin = searchParams.get("admin") === "1";
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { openConfirmation } = useConfirmationModal();

  // Keeps the layout locked to one screen while mobile keyboards open and close.
  useAppViewport();

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [usersModalOpen, setUsersModalOpen] = useState(false);
  const [mediaTypeModalOpen, setMediaTypeModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [reactionDrawerOpen, setReactionDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>(DEFAULT_SUBTITLE_SETTINGS);

  const [currentQuality, setCurrentQuality] = useState("quality");
  const [currentId, setCurrentId] = useState('')
  const [link, setLink] = useState("");
  // The link input is locked until the user picks "پخش با لینک" in the media type modal.
  const [linkModeEnabled, setLinkModeEnabled] = useState(false);
  // What the video element actually plays. Only updated on submit / archive pick.
  const [playbackSrc, setPlaybackSrc] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<SelectedArchiveMedia | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string, message: string }>({ id: "", message: "" });
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [connectionLost, setConnectionLost] = useState(false);
  const [roomState, setRoomState] = useState<RoomResponse | null>(null);
  const [systemMessages, setSystemMessages] = useState<Array<{
    id: string;
    user_id: string;
    user_name: string;
    kind: "joined" | "left";
    created_at: string;
  }>>([]);
  const [hiddenAnnouncementIds, setHiddenAnnouncementIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [chatWidth, setChatWidth] = useState(getStoredChatWidth);
  const chatResizeRef = useRef<{ active: boolean; startX: number; startWidth: number }>({
    active: false,
    startX: 0,
    startWidth: 345,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [customSubtitleTracks, setCustomSubtitleTracks] = useState<{ id: string; filename: string; cues: { start: number; end: number; text: string }[] }[]>([]);
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);
  const [currentSubtitleUrl, setCurrentSubtitleUrl] = useState<string | null>(null);
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, ConnectionStatus>>({});
  const currentTimeRef = useRef(0);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const viewportBaseHeightRef = useRef<number | null>(null);
  const previousKeyboardOpenRef = useRef(false);
  const intentionalSocketCloseRef = useRef(false);
  const roomSoundAudioRef = useRef<Partial<Record<RoomSoundKey, HTMLAudioElement>>>({});
  const userJoinSoundPlayedRef = useRef(false);

  useEffect(() => {
    setHiddenAnnouncementIds(new Set());
    userJoinSoundPlayedRef.current = false;
  }, [roomId]);

  const scrollChatToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    window.requestAnimationFrame(() => {
      chatBottomRef.current?.scrollIntoView({ behavior, block: "end" });
    });
  }, []);

  const [roomSoundVolumes, setRoomSoundVolumes] = useState<RoomSoundVolumes>(getStoredRoomSoundVolumes);
  const roomSoundVolumesRef = useRef<RoomSoundVolumes>(roomSoundVolumes);

  useEffect(() => {
    roomSoundVolumesRef.current = roomSoundVolumes;
    try {
      window.localStorage.setItem(ROOM_SOUND_STORAGE_KEY, JSON.stringify(roomSoundVolumes));
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  }, [roomSoundVolumes]);

  const playRoomSound = useCallback((key: RoomSoundKey) => {
    const volume = roomSoundVolumesRef.current[key];
    if (volume <= 0 || typeof window === "undefined") return;

    let audio = roomSoundAudioRef.current[key];
    if (!audio) {
      audio = new Audio(ROOM_SOUND_SOURCES[key]);
      audio.preload = "auto";
      roomSoundAudioRef.current[key] = audio;
    }

    audio.volume = Math.min(1, Math.max(0, volume / 100));
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Browsers may block playback until the user has interacted with the page.
    });
  }, []);

  useEffect(() => {
    return () => {
      (Object.values(roomSoundAudioRef.current) as HTMLAudioElement[]).forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      roomSoundAudioRef.current = {};
    };
  }, []);

  const clampChatWidth = useCallback((width: number) => {
    const maxWidth = Math.max(
      MIN_CHAT_WIDTH,
      Math.floor(window.innerWidth * 0.5),
    );
    return Math.min(maxWidth, Math.max(MIN_CHAT_WIDTH, width));
  }, []);

  useEffect(() => {
    const clampedWidth = clampChatWidth(chatWidth);
    if (clampedWidth !== chatWidth) {
      setChatWidth(clampedWidth);
      return;
    }

    try {
      window.localStorage.setItem(
        CHAT_WIDTH_STORAGE_KEY,
        String(Math.round(chatWidth)),
      );
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  }, [chatWidth, clampChatWidth]);

  const handleChatResizeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (window.innerWidth <= 980) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    chatResizeRef.current = {
      active: true,
      startX: event.clientX,
      startWidth: chatWidth,
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  };

  const handleChatResizeMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!chatResizeRef.current.active || window.innerWidth <= 980) return;

    // The page is RTL, so dragging the resize handle to the left should
    // make the chat wider and dragging it to the right should make it narrower.
    const delta = event.clientX - chatResizeRef.current.startX;
    setChatWidth(clampChatWidth(chatResizeRef.current.startWidth + delta));
  };

  const handleChatResizeEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!chatResizeRef.current.active) return;

    chatResizeRef.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  };

  useEffect(() => {
    const handleViewportResize = () => {
      if (window.innerWidth <= 980) return;
      setChatWidth((current) => clampChatWidth(current));
    };

    window.addEventListener("resize", handleViewportResize);
    return () => {
      window.removeEventListener("resize", handleViewportResize);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [clampChatWidth]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    // A reduced visual viewport is only a keyboard signal when the chat textarea
    // is actually focused. Without this guard, rotating the phone or focusing
    // the video/link input can look exactly like a keyboard opening.
    const isChatInputFocused = () => document.activeElement === messageInputRef.current;

    viewportBaseHeightRef.current = viewport.height;

    const resetViewportBaseline = () => {
      // Orientation changes can produce a large visualViewport resize even
      // though no keyboard opened. Re-baseline after the browser settles.
      window.requestAnimationFrame(() => {
        viewportBaseHeightRef.current = viewport.height;
        previousKeyboardOpenRef.current = false;
        setIsKeyboardOpen(false);
      });
    };

    const updateKeyboardState = () => {
      const currentHeight = viewport.height;

      if (!isChatInputFocused()) {
        viewportBaseHeightRef.current = currentHeight;
        previousKeyboardOpenRef.current = false;
        setIsKeyboardOpen(false);
        return;
      }

      const baseHeight = viewportBaseHeightRef.current ?? currentHeight;
      const keyboardOpen = baseHeight - currentHeight > 150;

      if (!keyboardOpen) {
        // Keep the largest observed height as the keyboard-free baseline.
        viewportBaseHeightRef.current = Math.max(
          viewportBaseHeightRef.current ?? currentHeight,
          currentHeight,
        );
      }

      setIsKeyboardOpen(keyboardOpen);

      if (keyboardOpen && !previousKeyboardOpenRef.current) {
        window.requestAnimationFrame(() => {
          scrollChatToBottom("smooth");
        });
      }

      previousKeyboardOpenRef.current = keyboardOpen;
    };

    updateKeyboardState();
    viewport.addEventListener("resize", updateKeyboardState);
    viewport.addEventListener("scroll", updateKeyboardState);
    window.addEventListener("orientationchange", resetViewportBaseline);

    // focusin/focusout catches the transition into/out of the chat input even
    // when the browser does not emit a visualViewport resize event.
    const handleFocusChange = () => {
      window.requestAnimationFrame(updateKeyboardState);
    };
    document.addEventListener("focusin", handleFocusChange);
    document.addEventListener("focusout", handleFocusChange);

    return () => {
      viewport.removeEventListener("resize", updateKeyboardState);
      viewport.removeEventListener("scroll", updateKeyboardState);
      window.removeEventListener("orientationchange", resetViewportBaseline);
      document.removeEventListener("focusin", handleFocusChange);
      document.removeEventListener("focusout", handleFocusChange);
    };
  }, [scrollChatToBottom]);

  // ========== Start Reaction Particles ===========

  const reactionParticleIdRef = useRef(0);
  const reactionTriggerRef = useRef<HTMLButtonElement | null>(null);
  interface ParticleData {
    id: number;
    emoji: string;
    x: number;
    y: number;
  }

  const spawnReactionParticles = (emoji: string, originElement?: HTMLElement) => {
    const rect = originElement?.getBoundingClientRect() ?? reactionTriggerRef.current?.getBoundingClientRect();
    const startX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const startY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

    const newParticles: ParticleData[] = Array.from({ length: 10 }).map(() => ({
      id: reactionParticleIdRef.current++,
      emoji,
      // small random offset around the origin so the burst reads as an
      // organic cluster instead of ten particles stacked on one pixel
      x: startX + (Math.random() - 0.5) * 18,
      y: startY + (Math.random() - 0.5) * 18,
    }));

    setParticles((prev) => [...prev, ...newParticles]);
  };

  const handleReactionClick = (e: React.MouseEvent<HTMLButtonElement>, emoji: string) => {
    sendSocketEvent({
      type: "reaction",
      payload: { emoji },
    });
    spawnReactionParticles(emoji, e.currentTarget);
  };

  const removeParticle = (idToRemove: number) => {
    setParticles((prev) => prev.filter((p) => p.id !== idToRemove));
  };

  // ========== End Reaction Particles ===========


  const socketRef = useRef<WebSocket | null>(null);
  const syncIntervalRef = useRef<number | null>(null);

  // --- Voice chat state & refs ---
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const voiceEnabledRef = useRef<boolean>(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const turnCredentialsRef = useRef<{
    urls: string[];
    username: string;
    credential: string;
    expires_at: number;
  } | null>(null);
  const turnRefreshTimerRef = useRef<number | null>(null);
  const peersRef = useRef<Map<string, {
    pc: RTCPeerConnection;
    pendingIce: RTCIceCandidateInit[];
    remoteDescSet: boolean;
    isInitiator: boolean;
    offerSent: boolean;
    makingOffer: boolean;
    addedLocalTracks: boolean;
    reconnectTimer: number | null;
  }>>(new Map());
  const audioElsRef = useRef<Record<string, HTMLAudioElement>>({});

  const [remoteVoiceEnabled, setRemoteVoiceEnabled] = useState<Record<string, boolean>>({});
  const remoteVoiceEnabledRef = useRef<Record<string, boolean>>({});

  const voiceLog = (message: string, details?: unknown) => {
    if (details === undefined) {
      console.log(`[voice] ${message}`);
    } else {
      console.log(`[voice] ${message}`, details);
    }
  };

  const voiceWarn = (message: string, details?: unknown) => {
    if (details === undefined) {
      console.warn(`[voice] ${message}`);
    } else {
      console.warn(`[voice] ${message}`, details);
    }
  };

  const voiceError = (message: string, details?: unknown) => {
    if (details === undefined) {
      console.error(`[voice] ${message}`);
    } else {
      console.error(`[voice] ${message}`, details);
    }
  };

  const describeLocalAudio = () => {
    const stream = localStreamRef.current;
    if (!stream) return null;

    return stream.getAudioTracks().map((track) => ({
      id: track.id,
      label: track.label,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState,
      settings: track.getSettings(),
    }));
  };

  const logPeerAudioState = async (remoteId: string, pc: RTCPeerConnection) => {
    const senders = pc.getSenders()
      .filter((sender) => sender.track?.kind === "audio")
      .map((sender) => ({
        trackId: sender.track?.id,
        enabled: sender.track?.enabled,
        muted: sender.track?.muted,
        readyState: sender.track?.readyState,
        kind: sender.track?.kind,
      }));

    const receivers = pc.getReceivers()
      .filter((receiver) => receiver.track?.kind === "audio")
      .map((receiver) => ({
        trackId: receiver.track?.id,
        enabled: receiver.track?.enabled,
        muted: receiver.track?.muted,
        readyState: receiver.track?.readyState,
        kind: receiver.track?.kind,
      }));

    let selectedCandidatePair: Record<string, unknown> | null = null;
    try {
      const stats = await pc.getStats();
      stats.forEach((report) => {
        if (
          report.type === "candidate-pair" &&
          (report.state === "succeeded" || report.nominated)
        ) {
          selectedCandidatePair = {
            state: report.state,
            nominated: report.nominated,
            bytesSent: report.bytesSent,
            bytesReceived: report.bytesReceived,
            currentRoundTripTime: report.currentRoundTripTime,
            localCandidateId: report.localCandidateId,
            remoteCandidateId: report.remoteCandidateId,
          };
        }
      });
    } catch (e) {
      voiceWarn(`getStats failed for ${remoteId}`, e);
    }

    voiceLog(`peer audio diagnostics for ${remoteId}`, {
      connectionState: pc.connectionState,
      iceConnectionState: pc.iceConnectionState,
      signalingState: pc.signalingState,
      iceGatheringState: pc.iceGatheringState,
      localAudioTracks: describeLocalAudio(),
      senders,
      receivers,
      selectedCandidatePair,
    });
  };

  const buildIceServers = (): RTCIceServer[] => {
    const servers: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
    ];

    const turn = turnCredentialsRef.current;
    if (turn) {
      servers.push({
        urls: turn.urls,
        username: turn.username,
        credential: turn.credential,
      });
    }

    return servers;
  };

  const refreshTurnCredentials = async (): Promise<boolean> => {
    try {
      const credentials = await getTurnCredentials();
      turnCredentialsRef.current = credentials;
      voiceLog("TURN credentials refreshed", { expiresAt: credentials.expires_at });
      return true;
    } catch (e) {
      voiceWarn("TURN credential refresh failed", e);
      return false;
    }
  };

  const scheduleTurnCredentialsRefresh = () => {
    if (turnRefreshTimerRef.current !== null) {
      window.clearTimeout(turnRefreshTimerRef.current);
      turnRefreshTimerRef.current = null;
    }

    const expiresAt = turnCredentialsRef.current?.expires_at;
    if (!expiresAt || !voiceEnabledRef.current) return;

    const refreshInMs = Math.max(30_000, (expiresAt - Math.floor(Date.now() / 1000) - 120) * 1000);
    turnRefreshTimerRef.current = window.setTimeout(async () => {
      turnRefreshTimerRef.current = null;
      if (!voiceEnabledRef.current) return;
      await refreshTurnCredentials();
      scheduleTurnCredentialsRefresh();
    }, refreshInMs);
  };


  const localUserIdRef = useRef<string>(user?.id ?? "");
  useEffect(() => { localUserIdRef.current = user?.id ?? ""; }, [user?.id]);

  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);
  useEffect(() => { remoteVoiceEnabledRef.current = remoteVoiceEnabled; }, [remoteVoiceEnabled]);

  useEffect(() => {
    voiceLog("voice UI state", {
      voiceEnabled,
      isMicMuted,
      localTracks: describeLocalAudio(),
    });
  }, [voiceEnabled, isMicMuted]);

  const createAudioElementFor = (remoteId: string, stream: MediaStream) => {
    voiceLog(`attaching remote stream for ${remoteId}`, {
      streamId: stream.id,
      active: stream.active,
      audioTracks: stream.getAudioTracks().map((track) => ({
        id: track.id,
        label: track.label,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
      })),
    });

    let el = audioElsRef.current[remoteId];
    if (!el) {
      el = document.createElement("audio");
      el.autoplay = true;
      // @ts-ignore
      el.playsInline = true;
      el.muted = false;
      el.volume = 1;
      el.style.display = "none";
      el.dataset.remoteUserId = remoteId;

      el.addEventListener("playing", () => {
        voiceLog(`remote audio element playing for ${remoteId}`, {
          paused: el?.paused,
          muted: el?.muted,
          volume: el?.volume,
          readyState: el?.readyState,
          networkState: el?.networkState,
        });
      });

      el.addEventListener("pause", () => {
        voiceWarn(`remote audio element paused for ${remoteId}`);
      });

      el.addEventListener("error", () => {
        voiceError(`remote audio element error for ${remoteId}`, el?.error);
      });

      audioElsRef.current[remoteId] = el;
      document.body.appendChild(el);
    }

    try {
      el.srcObject = stream;
      voiceLog(`remote stream attached to audio element for ${remoteId}`, {
        paused: el.paused,
        muted: el.muted,
        volume: el.volume,
        readyState: el.readyState,
      });

      el.play()
        .then(() => {
          voiceLog(`playing remote audio for ${remoteId}`, {
            paused: el?.paused,
            readyState: el?.readyState,
            muted: el?.muted,
            volume: el?.volume,
          });
        })
        .catch((e) => {
          voiceWarn(`remote audio play() failed for ${remoteId}`, {
            error: e,
            paused: el?.paused,
            readyState: el?.readyState,
            muted: el?.muted,
          });
        });
    } catch (e) {
      voiceError(`could not attach remote stream for ${remoteId}`, e);
    }
  };

  const removeAudioElementFor = (remoteId: string) => {
    const el = audioElsRef.current[remoteId];
    if (el) {
      try {
        el.pause();
        // @ts-ignore
        el.srcObject = null;
      } catch { }
      if (el.parentNode) el.parentNode.removeChild(el);
      delete audioElsRef.current[remoteId];
      console.log("voice: removed audio element for", remoteId);
    }
  };

  const closePeer = (remoteId: string) => {
    const meta = peersRef.current.get(remoteId);
    if (!meta) {
      removeAudioElementFor(remoteId);
      return;
    }

    if (meta.reconnectTimer !== null) {
      window.clearTimeout(meta.reconnectTimer);
      meta.reconnectTimer = null;
    }

    try {
      meta.pc.close();
    } catch (e) {
      console.warn("voice: failed to close peer", remoteId, e);
    }

    // IMPORTANT: sender tracks belong to the shared local MediaStream.
    // Never stop them here; doing so would mute every remaining peer connection.
    peersRef.current.delete(remoteId);
    removeAudioElementFor(remoteId);
  };

  const makeOffer = async (
    remoteId: string,
    meta: NonNullable<ReturnType<typeof ensurePeer>>,
  ) => {
    if (!voiceEnabledRef.current || !meta.isInitiator || meta.makingOffer) return;
    if (meta.pc.signalingState !== "stable") return;

    try {
      meta.makingOffer = true;
      const offer = await meta.pc.createOffer();
      if (!voiceEnabledRef.current) return;
      await meta.pc.setLocalDescription(offer);
      meta.offerSent = true;

      sendSocketEvent({
        type: "voice_offer",
        payload: {
          to: remoteId,
          from: localUserIdRef.current,
          sdp: meta.pc.localDescription,
        },
      });
    } catch (e) {
      console.error("voice: create/send offer failed", remoteId, e);
    } finally {
      meta.makingOffer = false;
    }
  };

  const schedulePeerReconnect = (remoteId: string, delayMs = 1000) => {
    if (!voiceEnabledRef.current) return;

    const existing = peersRef.current.get(remoteId);
    if (existing?.reconnectTimer !== null && existing?.reconnectTimer !== undefined) {
      return;
    }

    const remoteStillEnabled = remoteVoiceEnabledRef.current[remoteId];
    if (!remoteStillEnabled) return;

    const timer = window.setTimeout(async () => {
      const current = peersRef.current.get(remoteId);
      if (current?.reconnectTimer !== timer) return;
      current.reconnectTimer = null;

      closePeer(remoteId);

      if (!voiceEnabledRef.current || !remoteVoiceEnabledRef.current[remoteId]) return;

      const meta = ensurePeer(remoteId);
      if (!meta) return;
      await makeOffer(remoteId, meta);
    }, delayMs);

    if (existing) {
      existing.reconnectTimer = timer;
    }
  };

  const ensurePeer = (remoteId: string) => {
    const existing = peersRef.current.get(remoteId);
    if (existing) return existing;

    const localUserId = localUserIdRef.current;
    if (!localUserId || !remoteId || localUserId === remoteId) return null;

    // Deterministic initiator: exactly one side creates offers.
    const isInitiator = localUserId > remoteId;

    console.log("voice: creating peer", { remoteId, isInitiator });

    const pc = new RTCPeerConnection({ iceServers: buildIceServers() });
    const meta = {
      pc,
      pendingIce: [] as RTCIceCandidateInit[],
      remoteDescSet: false,
      isInitiator,
      offerSent: false,
      makingOffer: false,
      addedLocalTracks: false,
      reconnectTimer: null as number | null,
    };

    pc.onicecandidate = (ev) => {
      if (!ev.candidate || pc.connectionState === "closed") return;

      sendSocketEvent({
        type: "voice_ice",
        payload: {
          to: remoteId,
          from: localUserIdRef.current,
          candidate: ev.candidate.toJSON(),
        },
      });
    };

    pc.ontrack = (ev) => {
      const [stream] = ev.streams;
      const [track] = ev.track ? [ev.track] : [];

      voiceLog(`remote track received from ${remoteId}`, {
        kind: track?.kind,
        id: track?.id,
        label: track?.label,
        enabled: track?.enabled,
        muted: track?.muted,
        readyState: track?.readyState,
        streamIds: ev.streams.map((s) => s.id),
      });

      if (track) {
        track.onunmute = () => {
          voiceLog(`remote audio track unmuted for ${remoteId}`, {
            id: track.id,
            readyState: track.readyState,
          });
        };
        track.onmute = () => {
          voiceWarn(`remote audio track muted for ${remoteId}`, {
            id: track.id,
            readyState: track.readyState,
          });
        };
        track.onended = () => {
          voiceWarn(`remote audio track ended for ${remoteId}`, {
            id: track.id,
          });
        };
      }

      if (stream) {
        createAudioElementFor(remoteId, stream);
      } else if (track) {
        const fallbackStream = new MediaStream([track]);
        createAudioElementFor(remoteId, fallbackStream);
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      voiceLog(`connectionState for ${remoteId}: ${state}`, {
        signalingState: pc.signalingState,
        iceConnectionState: pc.iceConnectionState,
        iceGatheringState: pc.iceGatheringState,
      });
      if (state === "connected") {
        void logPeerAudioState(remoteId, pc);
      }

      if (state === "failed") {
        schedulePeerReconnect(remoteId, 250);
      } else if (state === "disconnected") {
        // Let the browser recover briefly before rebuilding the peer.
        schedulePeerReconnect(remoteId, 2000);
      } else if (state === "connected") {
        if (meta.reconnectTimer !== null) {
          window.clearTimeout(meta.reconnectTimer);
          meta.reconnectTimer = null;
        }
      } else if (state === "closed") {
        removeAudioElementFor(remoteId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      voiceLog(`iceConnectionState for ${remoteId}: ${state}`);
      if (state === "connected" || state === "completed") {
        void logPeerAudioState(remoteId, pc);
      }

      if (state === "failed") {
        schedulePeerReconnect(remoteId, 250);
      } else if (state === "disconnected") {
        schedulePeerReconnect(remoteId, 2000);
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log("voice: iceGatheringState for", remoteId, pc.iceGatheringState);
    };

    pc.onsignalingstatechange = () => {
      console.log("voice: signalingState for", remoteId, pc.signalingState);
    };

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        if (track.readyState === "live") {
          pc.addTrack(track, localStreamRef.current!);
        }
      });
      meta.addedLocalTracks = true;
    }

    peersRef.current.set(remoteId, meta);
    return meta;
  };

  const applyQueuedIce = async (remoteId: string) => {
    const meta = peersRef.current.get(remoteId);
    if (!meta) return;
    for (const c of meta.pendingIce) {
      try {
        await meta.pc.addIceCandidate(c);
        console.log("voice: applied queued ICE for", remoteId);
      } catch (e) {
        console.warn("addIceCandidate failed", e);
      }
    }
    meta.pendingIce = [];
  };

  const handleOffer = async (payload: any) => {
    const enabled = voiceEnabledRef.current;
    if (!enabled) {
      console.log("voice: received offer but local voice disabled; ignoring");
      return;
    }
    const from = payload.from as string;
    const to = payload.to as string;
    if (to !== localUserIdRef.current) return;
    console.log("voice: offer received from", from);

    const meta = ensurePeer(from);
    if (!meta) return;

    try {
      if (!payload.sdp?.type || !payload.sdp?.sdp) return;
      if (meta.pc.signalingState !== "stable") return;
      await meta.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      meta.remoteDescSet = true;
      console.log("voice: remote description set for", from);
      await applyQueuedIce(from);

      const ans = await meta.pc.createAnswer();
      await meta.pc.setLocalDescription(ans);
      console.log("voice: answer created for", from);

      sendSocketEvent({ type: "voice_answer", payload: { to: from, from: localUserIdRef.current, sdp: meta.pc.localDescription } });
      console.log("voice: answer sent to", from);
    } catch (e) {
      console.error("handleOffer error", e);
    }
  };

  const handleAnswer = async (payload: any) => {
    const enabled = voiceEnabledRef.current;
    if (!enabled) {
      console.log("voice: received answer but local voice disabled; ignoring");
      return;
    }
    const from = payload.from as string;
    const to = payload.to as string;
    if (to !== localUserIdRef.current) return;
    console.log("voice: answer received from", from);
    const meta = peersRef.current.get(from);
    if (!meta) return;

    try {
      if (!payload.sdp?.type || !payload.sdp?.sdp) {
        voiceWarn(`invalid answer SDP from ${from}`, payload.sdp);
        return;
      }

      if (meta.pc.signalingState !== "have-local-offer") {
        voiceWarn(`ignoring answer from ${from} because signalingState is ${meta.pc.signalingState}`);
        return;
      }

      await meta.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      meta.remoteDescSet = true;
      voiceLog(`remote description set (answer) for ${from}`, {
        signalingState: meta.pc.signalingState,
        connectionState: meta.pc.connectionState,
        iceConnectionState: meta.pc.iceConnectionState,
      });
      void logPeerAudioState(from, meta.pc);
      await applyQueuedIce(from);
    } catch (e) {
      console.error("handleAnswer error", e);
    }
  };

  const handleIce = async (payload: any) => {
    const enabled = voiceEnabledRef.current;
    if (!enabled) {
      console.log("voice: received ICE but local voice disabled; ignoring");
      return;
    }
    const from = payload.from as string;
    const to = payload.to as string;
    if (to !== localUserIdRef.current) return;
    const candidate = payload.candidate as RTCIceCandidateInit;
    console.log("voice: ICE received from", from, candidate);
    const meta = peersRef.current.get(from);
    if (!meta) {
      const newMeta = ensurePeer(from);
      if (!newMeta) return;
      newMeta.pendingIce.push(candidate);
      console.log("voice: queued ICE for new peer", from);
      return;
    }

    if (!meta.remoteDescSet) {
      meta.pendingIce.push(candidate);
      console.log("voice: queued ICE for", from);
      return;
    }

    try {
      await meta.pc.addIceCandidate(candidate);
      console.log("voice: ICE applied for", from);
    } catch (e) {
      console.warn("addIceCandidate failed", e);
    }
  };

  const startVoiceConnections = async () => {
    if (!roomState) return;
    console.log("voice: startVoiceConnections, local enabled?", voiceEnabledRef.current);
    if (!voiceEnabledRef.current) return;

    for (const member of roomState.members) {
      const remoteId = member.user_id;
      if (remoteId === localUserIdRef.current) continue;
      // only connect to members who have voice enabled
      if (!remoteVoiceEnabledRef.current[remoteId]) continue;

      const meta = ensurePeer(remoteId);
      if (!meta) continue;
      // add local tracks if not added
      if (localStreamRef.current && !meta.addedLocalTracks) {
        localStreamRef.current.getAudioTracks().forEach((t) => meta.pc.addTrack(t, localStreamRef.current!));
        meta.addedLocalTracks = true;
        console.log("voice: added local tracks to existing peer", remoteId);
      }

      if (meta.isInitiator && !meta.offerSent && !meta.makingOffer) {
        await makeOffer(remoteId, meta);
      }
    }
  };

  const stopAllVoice = () => {
    Array.from(peersRef.current.keys()).forEach((id: string) => closePeer(id));
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    Object.keys(audioElsRef.current).forEach((id) => removeAudioElementFor(id));
    if (turnRefreshTimerRef.current !== null) {
      window.clearTimeout(turnRefreshTimerRef.current);
      turnRefreshTimerRef.current = null;
    }
  };

  const enableVoice = async () => {
    if (!user?.id) return;
    try {
      await refreshTurnCredentials();

      console.log("voice: acquiring microphone...");
      const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      console.log("voice: microphone acquired");
      localStreamRef.current = s;
      voiceLog("microphone acquired", {
        streamId: s.id,
        active: s.active,
        audioTracks: s.getAudioTracks().map((t) => ({
          id: t.id,
          label: t.label,
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState,
          settings: t.getSettings(),
        })),
      });

      // Joining voice and unmuting are intentionally separate actions.
      // The microphone always starts muted when the user joins.
      s.getAudioTracks().forEach((t) => {
        t.enabled = false;
      });
      setIsMicMuted(true);
      voiceLog("voice joined with local microphone muted", describeLocalAudio());

      // update refs before starting connections
      voiceEnabledRef.current = true;
      setVoiceEnabled(true);
      scheduleTurnCredentialsRefresh();

      // add local tracks to any existing peers
      peersRef.current.forEach((meta, remoteId) => {
        if (!meta.addedLocalTracks && localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach((t) => meta.pc.addTrack(t, localStreamRef.current!));
          meta.addedLocalTracks = true;
          console.log("voice: added local tracks to peer after mic acquisition", remoteId);
        }
      });

      sendSocketEvent({ type: "voice_state", payload: { user_id: localUserIdRef.current, enabled: true } });
      console.log("voice: voice_state enabled sent");
      await startVoiceConnections();
    } catch (e) {
      voiceError("getUserMedia failed", e);
      voiceEnabledRef.current = false;
      setVoiceEnabled(false);
      setIsMicMuted(true);
    }
  };

  const handleJoinVoice = async () => {
    if (voiceEnabledRef.current) return;

    voiceLog("user requested to join voice chat");
    await enableVoice();
  };

  const disableVoice = () => {
    try {
      sendSocketEvent({ type: "voice_state", payload: { user_id: localUserIdRef.current, enabled: false } });
      console.log("voice: voice_state disabled sent");
    } catch { }
    stopAllVoice();
    voiceEnabledRef.current = false;
    setVoiceEnabled(false);
    setIsMicMuted(true);
    voiceLog("voice disabled and local media stopped");
  };

  // toggle mute without tearing down connections
  useEffect(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const enabled = !isMicMuted;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });

    voiceLog(`local microphone ${enabled ? "UNMUTED" : "MUTED"}`, {
      tracks: describeLocalAudio(),
      voiceEnabled: voiceEnabledRef.current,
      peers: Array.from(peersRef.current.entries()).map(([remoteId, meta]) => ({
        remoteId,
        connectionState: meta.pc.connectionState,
        iceConnectionState: meta.pc.iceConnectionState,
        signalingState: meta.pc.signalingState,
      })),
    });

    peersRef.current.forEach((meta, remoteId) => {
      void logPeerAudioState(remoteId, meta.pc);
    });
  }, [isMicMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        disableVoice();
      } catch { }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roomQuery = useQuery({
    queryKey: ["room", roomId],
    enabled: !!roomId,
    queryFn: () => getRoom(roomId!),
  });

  const roomAnnouncementsQuery = useQuery({
    queryKey: ["room-announcements", roomId],
    enabled: !!roomId,
    queryFn: getRoomAnnouncements,
    staleTime: 0,
  });


  useEffect(() => {
    if (!roomQuery.data) return;

    console.log("ROOM QUERY MEMBERS:", roomQuery.data.members);

    setRoomState(roomQuery.data);
    setConnectionLost(false);
    if (!userJoinSoundPlayedRef.current) {
      userJoinSoundPlayedRef.current = true;
      playRoomSound("userJoined");
    }
    setPlaybackSrc(roomQuery.data.currently_playing ?? "");
    setSelectedMedia(roomQuery.data.currently_playing_media ? {
      id: roomQuery.data.currently_playing_media.id,
      title: roomQuery.data.currently_playing_media.title,
      type: roomQuery.data.currently_playing_media.type,
      url: roomQuery.data.currently_playing_media.url,
      quality: roomQuery.data.currently_playing_media.quality,
      softsub: roomQuery.data.currently_playing_media.softsub,
      season: roomQuery.data.currently_playing_media.season ?? null,
      episode: roomQuery.data.currently_playing_media.episode ?? null,
      nextEpisode: roomQuery.data.currently_playing_media.next_episode ? {
        id: roomQuery.data.currently_playing_media.next_episode.id,
        title: roomQuery.data.currently_playing_media.next_episode.title,
        type: roomQuery.data.currently_playing_media.next_episode.type,
        url: roomQuery.data.currently_playing_media.next_episode.url,
        quality: roomQuery.data.currently_playing_media.next_episode.quality,
        softsub: roomQuery.data.currently_playing_media.next_episode.softsub,
        season: roomQuery.data.currently_playing_media.next_episode.season ?? null,
        episode: roomQuery.data.currently_playing_media.next_episode.episode ?? null,
      } : null,
    } : null);
    setCurrentId(roomQuery.data.currently_playing_media?.id ?? "");
    setCurrentQuality(roomQuery.data.currently_playing_media?.quality ?? "quality");
    setCustomSubtitleTracks(roomQuery.data.subtitles ?? []);
    setCurrentSubtitleUrl(roomQuery.data.currently_playing_subtitles ?? null);
    setCurrentTime(roomQuery.data.playback_time ?? 0);
    setIsPlaying(roomQuery.data.is_playing ?? false);
    const statuses: Record<string, ConnectionStatus> = {};

    roomQuery.data.members.forEach((member) => {
      statuses[member.user_id] = "good";
    });

    setConnectionStatuses(statuses);
  }, [roomQuery.data, playRoomSound, user?.id]);

  useEffect(() => {
    if (!currentSubtitleUrl || customSubtitleTracks.length) return;
    let cancelled = false;
    getSharedRoomSubtitles(currentSubtitleUrl)
      .then((tracks) => {
        if (cancelled) return;
        setCustomSubtitleTracks(tracks);
        setRoomState((prev) => prev ? { ...prev, subtitles: tracks } : prev);
      })
      .catch(() => {
        if (!cancelled) setCustomSubtitleTracks([]);
      });
    return () => { cancelled = true; };
  }, [currentSubtitleUrl, customSubtitleTracks.length]);

  const groupedMessages = useMemo(() => {
    const messages = (roomState?.messages ?? []).map((message) => ({
      kind: "message" as const,
      created_at: message.created_at,
      message,
    }));
    const events = systemMessages.map((event) => ({
      kind: "system" as const,
      created_at: event.created_at,
      event,
    }));

    return [...messages, ...events].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }, [roomState?.messages, systemMessages]);

  // Auto-scroll whenever the actual chat timeline changes, including realtime
  // messages and join/leave system events. The explicit send path below also
  // scrolls immediately so the UI does not wait for the socket echo.
  useEffect(() => {
    scrollChatToBottom("smooth");
  }, [groupedMessages, scrollChatToBottom]);

  const isCreator = roomState?.created_by === user?.id;

  const sendSocketEvent = (event: ClientSocketEvent) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      if (
        event.type === "voice_offer" ||
        event.type === "voice_answer" ||
        event.type === "voice_ice" ||
        event.type === "voice_state"
      ) {
        voiceWarn(`cannot send ${event.type}: WebSocket is not open`, {
          readyState: socket?.readyState ?? null,
        });
      }
      return;
    }

    if (
      event.type === "voice_offer" ||
      event.type === "voice_answer" ||
      event.type === "voice_ice" ||
      event.type === "voice_state"
    ) {
      voiceLog(`sending ${event.type}`, event.payload);
    }

    socket.send(JSON.stringify(event));
  };

  useEffect(() => {
    if (!roomId || !user?.id) return;

    const wsBaseUrl = import.meta.env['VITE_WS_BASE_URL'];
    // No realtime backend configured (e.g. local/preview): run in offline mode.
    if (!wsBaseUrl) return;

    const token = getAccessToken() ?? undefined;
    const socket = new WebSocket(buildWsUrl(wsBaseUrl, roomId, token, isStealthAdmin));
    socketRef.current = socket;


    socket.onopen = () => voiceLog("WS OPEN");

    socket.onerror = (e) => voiceError("WS ERROR", e);

    socket.onmessage = async (event) => {
      let parsed: ServerSocketEvent;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        return;
      }

      if (
        parsed.type === "voice_offer" ||
        parsed.type === "voice_answer" ||
        parsed.type === "voice_ice" ||
        parsed.type === "voice_state"
      ) {
        voiceLog(`received ${parsed.type}`, parsed.payload);
      }

      switch (parsed.type) {
        case "room_announcement": {
          queryClient.setQueryData<RoomAnnouncementsResponse>(["room-announcements", roomId], (current) => {
            const announcements = current?.announcements ?? [];

            if (parsed.payload.action === "remove") {
              if (!parsed.payload.id) return current;
              return {
                announcements: announcements.filter((announcement) => announcement.id !== parsed.payload.id),
              };
            }

            const announcement = parsed.payload.announcement;
            if (!announcement) return current;

            const existed = announcements.some((item) => item.id === announcement.id);
            const withoutAnnouncement = announcements.filter((item) => item.id !== announcement.id);
            if (!existed) {
              playRoomSound("adminAnnouncement");
            }
            return { announcements: [announcement, ...withoutAnnouncement] };
          });
          break;
        }

        case "chat_message":
          setRoomState((prev) => {
            if (!prev) return prev;
            if (prev.messages.some((m) => m.id === parsed.payload.id)) return prev;
            return { ...prev, messages: [...prev.messages, parsed.payload].slice(-100) };
          });
          if (parsed.payload.sender_id !== localUserIdRef.current) {
            playRoomSound("newChatMessage");
          }
          break;

        case "admin_chat_message": {
          const adminMessage: RoomMessageResponse = {
            id: parsed.payload.id,
            sender_id: "__website_admin__",
            sender_name: "مدیریت سایت",
            sender_avatar: "",
            replying_to: "",
            content: parsed.payload.content,
            created_at: parsed.payload.created_at,
            updated_at: parsed.payload.created_at,
            edited: false,
            is_admin_sender: true,
          };
          setRoomState((prev) => prev ? { ...prev, messages: [...prev.messages, adminMessage].slice(-100) } : prev);
          // playRoomSound("newChatMessage");
          break;
        }

        case "chat_message_updated":
          setRoomState((prev) =>
            prev
              ? {
                ...prev,
                messages: prev.messages.map((message) =>
                  message.id === parsed.payload.id ? parsed.payload : message,
                ),
              }
              : prev,
          );
          break;

        case "member_status":
          setConnectionStatuses((prev) => ({
            ...prev,
            [parsed.payload.user_id]: parsed.payload.status,
          }));
          break;

        case "user_left": {
          const leavingId = parsed.payload.user_id;
          console.log("voice: user_left for", leavingId);
          if (leavingId !== localUserIdRef.current) {
            playRoomSound("otherUserLeft");
          }
          closePeer(leavingId);
          setRemoteVoiceEnabled((prev) => {
            const copy = { ...prev };
            delete copy[leavingId];
            return copy;
          });
          setSystemMessages((prev) => [
            ...prev,
            {
              id: `left-${leavingId}-${Date.now()}`,
              user_id: leavingId,
              user_name: parsed.payload.name,
              kind: "left",
              created_at: new Date().toISOString(),
            },
          ]);
          refreshRoom();
          break;
        }

        case "user_joined": {
          if (parsed.payload.user_id !== localUserIdRef.current) {
            playRoomSound("otherUserJoined");
          }
          setSystemMessages((prev) => [
            ...prev,
            {
              id: `joined-${parsed.payload.user_id}-${Date.now()}`,
              user_id: parsed.payload.user_id,
              user_name: parsed.payload.name,
              kind: "joined",
              created_at: new Date().toISOString(),
            },
          ]);
          refreshRoom();
          // announce our voice state to the newcomer so they can initiate if needed
          if (voiceEnabledRef.current) {
            try {
              sendSocketEvent({ type: "voice_state", payload: { user_id: localUserIdRef.current, enabled: true } });
              console.log("voice: announced local voice_state to new user");
            } catch (e) {
              console.warn(e);
            }
          }
          break;
        }

        case "reaction":
          if (parsed.payload.user_id !== localUserIdRef.current) {
            spawnReactionParticles(parsed.payload.emoji);
          }
          break;

        case "user_kicked":
          if (parsed.payload.user_id === user?.id) {
            intentionalSocketCloseRef.current = true;
            socket.close();
            navigate("/join-room");
            return;
          }

          refreshRoom();
          break;

        case "update_role":
          setRoomState((prev) =>
            prev
              ? {
                ...prev,
                members: prev.members.map((member) =>
                  member.user_id === parsed.payload.user_id
                    ? { ...member, role: parsed.payload.role }
                    : member,
                ),
              }
              : prev,
          );
          refreshRoom();
          break;

        case "sync_playback": {
          if (parsed.payload.user_id === user.id) break;

          const nextSubtitles = parsed.payload.subtitles ?? [];
          const playbackUpdate: Partial<RoomResponse> = {
            currently_playing: parsed.payload.currently_playing ?? null,
            currently_playing_media: parsed.payload.currently_playing_media ?? null,
            playback_time: Math.round(parsed.payload.playback_time),
            is_playing: parsed.payload.is_playing,
            currently_playing_subtitles: parsed.payload.currently_playing_subtitles ?? null,
          };
          if (parsed.payload.action === "load" || parsed.payload.upload_id) {
            playbackUpdate.subtitles = nextSubtitles;
          }
          setRoomState((prev) =>
            prev
              ? { ...prev, ...playbackUpdate }
              : prev,
          );

          if (typeof parsed.payload.currently_playing === "string") {
            setPlaybackSrc(parsed.payload.currently_playing);
          } else if (parsed.payload.currently_playing === null) {
            setPlaybackSrc("");
          }

          if (parsed.payload.currently_playing_media) {
            const media = parsed.payload.currently_playing_media;
            setCurrentId(media.id);
            setCurrentQuality(media.quality ?? "quality");
            setSelectedMedia({
              id: media.id,
              title: media.title,
              type: media.type,
              url: media.url,
              quality: media.quality,
              softsub: media.softsub,
              season: media.season ?? null,
              episode: media.episode ?? null,
              nextEpisode: media.next_episode ? {
                id: media.next_episode.id,
                title: media.next_episode.title,
                type: media.next_episode.type,
                url: media.next_episode.url,
                quality: media.next_episode.quality,
                softsub: media.next_episode.softsub,
                season: media.next_episode.season ?? null,
                episode: media.next_episode.episode ?? null,
              } : null,
            });
          } else if (parsed.payload.currently_playing_media === null) {
            setCurrentId("");
            setSelectedMedia(null);
          }

          setCurrentSubtitleUrl(parsed.payload.currently_playing_subtitles ?? null);
          if (parsed.payload.action === "load" || parsed.payload.upload_id) {
            setCustomSubtitleTracks(nextSubtitles);
            setCurrentUploadId(parsed.payload.upload_id ?? null);
          }

          setCurrentTime(parsed.payload.playback_time);
          setIsPlaying(parsed.payload.is_playing);
          break;
        }

        case "update_settings":
          setRoomState((prev) =>
            prev
              ? {
                ...prev,
                is_public: parsed.payload.is_public ?? prev.is_public,
                media_control_permission:
                  parsed.payload.media_control_permission ?? prev.media_control_permission,
              }
              : prev,
          );
          break;

        // --- Voice signaling ---
        case "voice_offer":
          // payload: { to, from, sdp }
          // handle only if targeted at us
          // @ts-ignore
          handleOffer(parsed.payload);
          break;

        case "voice_answer":
          // @ts-ignore
          handleAnswer(parsed.payload);
          break;

        case "voice_ice":
          // @ts-ignore
          handleIce(parsed.payload);
          break;

        case "voice_state": {
          const remoteId = parsed.payload.user_id as string;
          const enabled = parsed.payload.enabled as boolean;
          if (remoteId === localUserIdRef.current) break;
          console.log("voice: voice_state from", remoteId, enabled);

          setRemoteVoiceEnabled((prev) => ({ ...prev, [remoteId]: enabled }));

          if (!enabled) {
            // remote disabled -> close peer
            closePeer(remoteId);
            break;
          }

          // remote enabled: if local is participating, initiate connection (if initiator)
          if (voiceEnabledRef.current) {
            const meta = ensurePeer(remoteId);
            if (!meta) break;
            if (localStreamRef.current && !meta.addedLocalTracks) {
              localStreamRef.current.getAudioTracks().forEach((track) => {
                if (track.readyState === "live") meta.pc.addTrack(track, localStreamRef.current!);
              });
              meta.addedLocalTracks = true;
            }
            if (meta.isInitiator && !meta.offerSent && !meta.makingOffer) {
              await makeOffer(remoteId, meta);
            }
          }
          break;
        }

        case "error":
          console.log(parsed.payload.message);
          break;
      }
    };

    socket.onclose = (e) => {
      voiceWarn("WS CLOSED", {
        code: e.code,
        reason: e.reason,
        wasClean: e.wasClean,
      });

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      if (e.code === 4003 || e.code === 4004) {
        intentionalSocketCloseRef.current = true;
        navigate("/join-room");
        return;
      }
      if (!intentionalSocketCloseRef.current) {
        setConnectionLost(true);
      }
    };

    return () => {
      intentionalSocketCloseRef.current = true;
      socket.close();
    };
  }, [roomId, user?.id, isStealthAdmin, playRoomSound]);

  useEffect(() => {
    if (!isCreator) {
      if (syncIntervalRef.current) {
        window.clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      return;
    }

    if (!isPlaying) {
      if (syncIntervalRef.current) {
        window.clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      return;
    }

    syncIntervalRef.current = window.setInterval(() => {
      sendSocketEvent({
        type: "sync_playback",
        payload: {
          action: "sync",
          playback_time: currentTimeRef.current,
          currently_playing: playbackSrc || null,
          is_playing: true,
          user_id: user?.id ? user.id : "",
          upload_id: currentUploadId ?? undefined,
          subtitles: currentUploadId ? customSubtitleTracks : undefined,
          currently_playing_subtitles: currentSubtitleUrl,
        },
      });
    }, 30000);

    return () => {
      if (syncIntervalRef.current) {
        window.clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [isCreator, isPlaying, currentTime, playbackSrc, currentUploadId, currentSubtitleUrl, customSubtitleTracks, user?.id]);

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => sendRoomMessage(roomId!, content, replyingTo.id),
    onSuccess: () => {
      setMessageText("");
      setReplyingTo({ message: "", id: "" });
      scrollChatToBottom("smooth");
      playRoomSound("newChatMessage");
    },
  });

  const editMessageMutation = useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      editRoomMessage(roomId!, messageId, content),
    onSuccess: (updatedMessage) => {
      setRoomState((prev) =>
        prev
          ? {
            ...prev,
            messages: prev.messages.map((message) =>
              message.id === updatedMessage.id ? updatedMessage : message,
            ),
          }
          : prev,
      );
      setMessageText("");
      setEditingMessageId(null);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveRoom(roomId!),
    onSuccess: () => {
      intentionalSocketCloseRef.current = true;
      socketRef.current?.close();
      navigate("/join-room");
    },
  });

  const refreshRoom = async () => {
    const result = await roomQuery.refetch();

    console.log("REFRESH ROOM:", result.data?.members);

    if (result.data) {
      setRoomState(result.data);
    }
  };

  const updateRoleMutation = useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "member";
    }) => updateRoomMemberRole(roomId!, userId, role),
    onSuccess: () => {
      refreshRoom();
    },
  });

  const kickMemberMutation = useMutation({
    mutationFn: (userId: string) => kickRoomMember(roomId!, userId),
    onSuccess: () => {
      refreshRoom();
    },
  });

  const closeModals = () => {
    setSettingsModalOpen(false);
    setUsersModalOpen(false);
    setMediaTypeModalOpen(false);
    setArchiveModalOpen(false);
    setInviteModalOpen(false);
  };

  const emitPlayback = (action: "play" | "pause" | "seek" | "sync" | "load", nextTime: number, nextSrc?: string, nextSubtitleUrl?: string | null, mediaOverride?: SelectedArchiveMedia | null) => {
    const source = nextSrc ?? playbackSrc;
    const mediaForPayload = mediaOverride !== undefined ? mediaOverride : selectedMedia;
    const payload = {
      action,
      playback_time: nextTime,
      currently_playing: source || null,
      currently_playing_media: mediaForPayload ? {
        id: mediaForPayload.id,
        title: mediaForPayload.title,
        type: mediaForPayload.type,
        url: mediaForPayload.url,
        quality: mediaForPayload.quality,
        softsub: mediaForPayload.softsub,
        season: mediaForPayload.season ?? undefined,
        episode: mediaForPayload.episode ?? undefined,
        next_episode: mediaForPayload.nextEpisode ? {
          id: mediaForPayload.nextEpisode.id,
          title: mediaForPayload.nextEpisode.title,
          type: mediaForPayload.nextEpisode.type,
          url: mediaForPayload.nextEpisode.url,
          quality: mediaForPayload.nextEpisode.quality,
          softsub: mediaForPayload.nextEpisode.softsub,
          season: mediaForPayload.nextEpisode.season ?? undefined,
          episode: mediaForPayload.nextEpisode.episode ?? undefined,
        } : null,
      } : null,
      is_playing: action === "play" || action === "sync" || action === "load" ? true : action === "pause" ? false : isPlaying,
      user_id: user?.id ?? "",
      upload_id: action === "load" ? (currentUploadId && source === playbackSrc ? currentUploadId : undefined) : currentUploadId ?? undefined,
      subtitles: currentUploadId && (action !== "load" || source === playbackSrc) ? customSubtitleTracks : undefined,
      currently_playing_subtitles: nextSubtitleUrl !== undefined ? nextSubtitleUrl : currentSubtitleUrl,
    };

    sendSocketEvent({ type: "sync_playback", payload });

    setRoomState((prev) =>
      prev
        ? {
          ...prev,
          currently_playing: source || null,
          currently_playing_media: mediaForPayload ? {
            id: mediaForPayload.id,
            title: mediaForPayload.title,
            type: mediaForPayload.type,
            url: mediaForPayload.url,
            quality: mediaForPayload.quality,
            softsub: mediaForPayload.softsub,
            season: mediaForPayload.season ?? undefined,
            episode: mediaForPayload.episode ?? undefined,
            next_episode: mediaForPayload.nextEpisode ? {
              id: mediaForPayload.nextEpisode.id,
              title: mediaForPayload.nextEpisode.title,
              type: mediaForPayload.nextEpisode.type,
              url: mediaForPayload.nextEpisode.url,
              quality: mediaForPayload.nextEpisode.quality,
              softsub: mediaForPayload.nextEpisode.softsub,
              season: mediaForPayload.nextEpisode.season ?? undefined,
              episode: mediaForPayload.nextEpisode.episode ?? undefined,
            } : null,
          } : null,
          currently_playing_subtitles: nextSubtitleUrl !== undefined ? nextSubtitleUrl : currentSubtitleUrl,
          playback_time: Math.round(nextTime),
        }
        : prev,
    );
  };

  const resizeMessageInput = useCallback(() => {
    const input = messageInputRef.current;
    if (!input) return;
    const styles = window.getComputedStyle(input);
    const lineHeight = Number.parseFloat(styles.lineHeight) || 21;
    const paddingY = (Number.parseFloat(styles.paddingTop) || 0) + (Number.parseFloat(styles.paddingBottom) || 0);
    const maxHeight = Math.ceil(lineHeight * 4 + paddingY);
    input.style.height = "auto";
    const nextHeight = Math.min(input.scrollHeight, maxHeight);
    input.style.height = `${Math.max(nextHeight, 44)}px`;
    input.style.overflowY = input.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    resizeMessageInput();
  }, [messageText, resizeMessageInput]);

  const handleSendMessage = () => {
    const content = messageText.trim();
    if (!content || sendMessageMutation.isPending || editMessageMutation.isPending) return;

    if (isStealthAdmin) {
      sendSocketEvent({ type: "chat_message", payload: { content } });
      setMessageText("");
      setReplyingTo({ message: "", id: "" });
      scrollChatToBottom("smooth");
      playRoomSound("newChatMessage");
      return;
    }

    if (editingMessageId) {
      editMessageMutation.mutate({ messageId: editingMessageId, content });
      return;
    }

    sendMessageMutation.mutate(content);
  };

  const handleReply = (to: { id: string, message: string }) => {
    setEditingMessageId(null);
    setReplyingTo(to);
    document.getElementById('room-chat-input')?.focus();
  };

  const handleEditMessage = (message: RoomMessageResponse) => {
    setReplyingTo({ id: "", message: "" });
    setEditingMessageId(message.id);
    setMessageText(message.content);
    requestAnimationFrame(() => document.getElementById('room-chat-input')?.focus());
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setMessageText("");
  };

  const handleNavigateToMessage = (messageId: string) => {
    const element = document.getElementById(`chat-message-${messageId}`);
    if (!element) return;

    element.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedMessageId(messageId);
    window.setTimeout(() => {
      setHighlightedMessageId((current) => current === messageId ? null : current);
    }, 1400);
  };

  const handleSelectEmoji = (emoji: string) => {
    const input = messageInputRef.current;

    if (!input) {
      setMessageText((prev) => prev + emoji);
      return;
    }

    const start = input.selectionStart ?? messageText.length;
    const end = input.selectionEnd ?? messageText.length;

    setMessageText((prev) => prev.slice(0, start) + emoji + prev.slice(end));

    requestAnimationFrame(() => {
      input.focus();
      const caret = start + emoji.length;
      input.setSelectionRange(caret, caret);
    });
  };

  const handleLeaveRoom = () => {
    if (!roomId) return;
    leaveMutation.mutate();
  };

  const handleLeaveRoomClick = () => {
    openConfirmation({
      title: "خروج از اتاق",
      body: "آیا مطمئن هستید که می‌خواهید از اتاق خارج شوید؟",
      primaryButtonText: "خروج",
      secondaryButtonText: "انصراف",
      primaryButtonClasses: "room-exit-primary",
      onConfirm: () => {
        handleLeaveRoom();
      },
    });
  };

  // The link is only handed to the player once the user submits it.
  const handleSubmitPlayback = () => {
    const nextSrc = link.trim();
    if (!nextSrc) return;

    setSelectedMedia(null);
    setCustomSubtitleTracks([]);
    setCurrentUploadId(null);
    setCurrentSubtitleUrl(null);
    setPlaybackSrc(nextSrc);
    setCurrentTime(0);
    setIsPlaying(false);
    emitPlayback("load", 0, nextSrc, null, null);
  };

  const handleChooseLinkMode = () => {
    setSelectedMedia(null);
    setLinkModeEnabled(true);
    setMediaTypeModalOpen(false);
  };

  const handleArchiveSelect = async (media: SelectedArchiveMedia) => {
    const subtitleUrl = archiveApi.getSubtitlesUrl(media.id, { season: media.season, episode: media.episode });
    let tracks: Awaited<ReturnType<typeof getSharedRoomSubtitles>> = [];
    try {
      const response = await archiveApi.getSubtitles(media.id, { season: media.season, episode: media.episode });
      tracks = response.data.tracks ?? [];
    } catch {
      tracks = [];
    }

    const sharedSubtitleUrl = tracks.length ? subtitleUrl : null;
    setCurrentId(media.id)
    setSelectedMedia(media);
    setCustomSubtitleTracks(tracks);
    setCurrentSubtitleUrl(sharedSubtitleUrl);
    setCurrentUploadId(null);
    setLinkModeEnabled(false);
    setLink("");
    setCurrentQuality(media.quality ?? "quality");
    setPlaybackSrc(media.url);
    setCurrentTime(0);
    setIsPlaying(false);
    emitPlayback("load", 0, media.url, sharedSubtitleUrl, media);
  };

  const handleNextEpisode = async () => {
    const nextEpisode = selectedMedia?.nextEpisode;
    if (!nextEpisode) return;

    const subtitleUrl = archiveApi.getSubtitlesUrl(nextEpisode.id, { season: nextEpisode.season, episode: nextEpisode.episode });
    let tracks: Awaited<ReturnType<typeof getSharedRoomSubtitles>> = [];
    try {
      const response = await archiveApi.getSubtitles(nextEpisode.id, { season: nextEpisode.season, episode: nextEpisode.episode });
      tracks = response.data.tracks ?? [];
    } catch {
      tracks = [];
    }
    const sharedSubtitleUrl = tracks.length ? subtitleUrl : null;

    setCurrentId(nextEpisode.id);
    setSelectedMedia(nextEpisode);
    setCustomSubtitleTracks(tracks);
    setCurrentSubtitleUrl(sharedSubtitleUrl);
    setCurrentUploadId(null);
    setCurrentQuality(nextEpisode.quality ?? "quality");
    setPlaybackSrc(nextEpisode.url);
    setCurrentTime(0);
    setIsPlaying(true);
    emitPlayback("load", 0, nextEpisode.url, sharedSubtitleUrl, nextEpisode);
  };

  const handleUploadOwnMedia = async (videoFile: File, subtitleFile: File | null, onProgress?: (percent: number) => void) => {
    if (!roomId) return;
    const result = await uploadRoomMedia(roomId, videoFile, subtitleFile, onProgress);
    setSelectedMedia(null);
    setLinkModeEnabled(false);
    setLink("");
    setCurrentQuality("uploaded");
    setCurrentId("");
    setCurrentUploadId(result.upload_id);
    setCustomSubtitleTracks(result.subtitles ?? []);
    setCurrentSubtitleUrl(result.subtitle_url ?? null);
    setPlaybackSrc(result.video_url);
    setCurrentTime(0);
    setIsPlaying(false);
    setMediaTypeModalOpen(false);
    setRoomState((prev) => prev ? {
      ...prev,
      currently_playing: result.video_url,
      currently_playing_media: null,
      currently_playing_subtitles: result.subtitle_url ?? null,
      playback_time: 0,
      is_playing: false,
      subtitles: result.subtitles ?? [],
    } : prev);
  };

  const handleCopyInviteCode = async () => {
    if (!roomId || !roomState) return;

    try {
      await navigator.clipboard.writeText(roomState.code.toString());
      setInviteCopied(true);
      window.setTimeout(() => setInviteCopied(false), 1500);
    } catch (error) {
      console.error("Copy invite code failed", error);
    }
  };

  const visibleRoomAnnouncements = (roomAnnouncementsQuery.data?.announcements ?? []).filter(
    (announcement) => !hiddenAnnouncementIds.has(announcement.id),
  );

  const hideAnnouncement = (announcementId: string) => {
    setHiddenAnnouncementIds((previous) => {
      const next = new Set(previous);
      next.add(announcementId);
      return next;
    });
  };

  if (roomQuery.isLoading) {
    return (
      <div className="room-page room-page--loading" aria-live="polite">
        <div className="room-page__loading-grain" aria-hidden="true" />
        <div className="room-page__loading-glow" aria-hidden="true" />

        <div className="room-page__loading-card">
          <div className="room-page__loading-card__beam" aria-hidden="true" />

          <svg
            className="room-page__loading-card__film"
            viewBox="0 0 420 200"
            role="img"
            aria-label="در حال آماده‌سازی اتاق"
            focusable="false"
          >
            <defs>
              <linearGradient id="room-loader-strip" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--room-loader-strip-top)" />
                <stop offset="100%" stopColor="var(--room-loader-strip-bottom)" />
              </linearGradient>

              <linearGradient id="room-loader-beam" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--send-btn-bg)"
                  stopOpacity="0.45"
                />
                <stop
                  offset="100%"
                  stopColor="var(--send-btn-bg)"
                  stopOpacity="0"
                />
              </linearGradient>

              <clipPath id="room-loader-frame-clip">
                <rect x="34" y="45" width="352" height="110" rx="10" />
              </clipPath>
            </defs>

            {/* Moving projector light */}
            <g
              className="room-page__loading-card__beam"
              clipPath="url(#room-loader-frame-clip)"
            >
              <polygon
                points="110,-30 220,-30 430,250 -20,250"
                fill="url(#room-loader-beam)"
              />
            </g>

            {/* Film strip */}
            <rect
              x="18"
              y="24"
              width="384"
              height="152"
              rx="16"
              fill="url(#room-loader-strip)"
              stroke="var(--room-loader-edge)"
              strokeWidth="1.5"
            />

            {/* Sprocket holes */}
            <g
              className="room-page__loading-card__sprockets"
              fill="var(--room-loader-hole)"
            >
              {Array.from({ length: 9 }).map((_, index) => (
                <rect
                  key={`top-${index}`}
                  x={36 + index * 42}
                  y="31"
                  width="20"
                  height="11"
                  rx="3.5"
                  style={{ animationDelay: `${index * 80}ms` }}
                />
              ))}

              {Array.from({ length: 9 }).map((_, index) => (
                <rect
                  key={`bottom-${index}`}
                  x={36 + index * 42}
                  y="158"
                  width="20"
                  height="11"
                  rx="3.5"
                  style={{ animationDelay: `${index * 80 + 40}ms` }}
                />
              ))}
            </g>

            {/* Frames */}
            <g
              className="room-page__loading-card__frames"
              fill="var(--room-loader-frame)"
              stroke="var(--room-loader-edge)"
              strokeWidth="1.25"
            >
              <rect x="34" y="48" width="112" height="104" rx="9" />
              <rect x="154" y="48" width="112" height="104" rx="9" />
              <rect x="274" y="48" width="112" height="104" rx="9" />
            </g>

            {/* Left frame — camera/play mark */}
            <g className="room-page__loading-card__scene-mark">
              <path d="M68 77v50l39-25z" />
            </g>

            {/* Center — spinning reel */}
            <g
              className="room-page__loading-card__reel"
              transform="translate(210 100)"
            >
              <circle
                r="34"
                fill="none"
                stroke="var(--send-btn-bg)"
                strokeWidth="8"
              />

              <circle
                r="6.5"
                fill="var(--send-btn-bg)"
              />

              {[0, 60, 120, 180, 240, 300].map((angle) => (
                <circle
                  key={angle}
                  cx={Math.cos((angle * Math.PI) / 180) * 18}
                  cy={Math.sin((angle * Math.PI) / 180) * 18}
                  r="5"
                  fill="var(--send-btn-bg)"
                  opacity="0.72"
                />
              ))}
            </g>

            {/* Right frame — subtle progress scan */}
            <g className="room-page__loading-card__scan">
              <rect x="295" y="67" width="70" height="7" rx="3.5" />
              <rect x="295" y="82" width="52" height="7" rx="3.5" />
              <rect x="295" y="97" width="62" height="7" rx="3.5" />
              <rect x="295" y="112" width="40" height="7" rx="3.5" />
            </g>
          </svg>

          <div className="room-page__loading-card__copy">
            <span className="room-page__loading-card__eyebrow">
              NOW PLAYING
            </span>

            <strong>در حال آماده‌سازی اتاق</strong>

            <span className="room-page__loading-card__hint">
              صحنه را آماده می‌کنیم؛ چند لحظه دیگر وارد چت می‌شوید.
            </span>

            <span
              className="room-page__loading-card__status"
              aria-hidden="true"
            >
              <i />
              <i />
              <i />
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (roomQuery.isError || !roomState) {
    return <div className="room-page">اتاق پیدا نشد یا خطایی رخ داد.</div>;
  }

  const members = roomState.members.map((member) => ({
    userId: member.user_id,
    name: member.name,
    avatar: member.avatar,
    role: member.role,
    joinedAt: member.joined_at,
    isCurrentUser: member.user_id === user?.id,
    connectionStatus: connectionStatuses[member.user_id] ?? "good",
  }));

  const isCurrentUserAdmin = isStealthAdmin || members.some(
    (member) => member.userId === user?.id && member.role === "admin",
  );

  const handleChangeMemberRole = (targetUserId: string, role: "admin" | "member") => {
    if (!roomId) return;

    updateRoleMutation.mutate({
      userId: targetUserId,
      role,
    });
  };

  const handleKickMember = (targetUserId: string) => {
    if (!roomId) return;

    openConfirmation({
      title: "اخراج کاربر",
      body: "آیا مطمئن هستید که می‌خواهید این کاربر را از اتاق اخراج کنید؟",
      primaryButtonText: "اخراج",
      secondaryButtonText: "انصراف",
      primaryButtonClasses: "room-exit-primary",
      onConfirm: () => {
        kickMemberMutation.mutate(targetUserId);
      },
    });
  };


  return (
    <div
      className={clsx(
        "room-page",
        sidebarOpen && "sidebar-open",
        isKeyboardOpen && "keyboard-open",
        isPlaying && "is-playing",
      )}
    >
      {connectionLost && (
        <div className="room-page__connection-lost" role="alert">
          <span>اتصال شما به اتاق قطع شد.</span>
          <button type="button" onClick={() => window.location.reload()}>تلاش مجدد</button>
        </div>
      )}
      <button
        type="button"
        className="room-page__side-bar-toggle"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label={sidebarOpen ? "بستن نوار ابزار" : "باز کردن نوار ابزار"}
      >
        <IoChevronBack />
      </button>

      <button
        type="button"
        className="room-page__side-bar-backdrop"
        aria-hidden={!sidebarOpen}
        tabIndex={sidebarOpen ? 0 : -1}
        aria-label="بستن نوار ابزار"
        onClick={() => setSidebarOpen(false)}
      />

      <div className="room-page__reaction-particles" aria-hidden="true">
        {particles.map((p) => (
          <AnimatedParticle
            key={p.id}
            emoji={p.emoji}
            x={p.x}
            y={p.y}
            onFinish={() => removeParticle(p.id)}
          />
        ))}
      </div>

      <div className={clsx("room-page__side-bar", sidebarOpen && "open")}>
        <div className="room-page__side-bar__item">
          <button className="room-page__side-bar__item__settings" onClick={() => setSettingsModalOpen(true)}>
            <AiTwotoneSetting />
          </button>
          <span>تنظیمات</span>
        </div>

        {!isStealthAdmin && (
          voiceEnabled ? (
            <div className="room-page__side-bar__item">
              <button
                type="button"
                className={clsx("room-page__side-bar__microphone", "voice-active")}
                aria-label={isMicMuted ? "روشن کردن میکروفون" : "بی‌صدا کردن میکروفون"}
                title={isMicMuted ? "روشن کردن میکروفون" : "بی‌صدا کردن میکروفون"}
                onClick={() => {
                  setIsMicMuted((prev) => {
                    const next = !prev;
                    voiceLog("local mute toggle", { muted: next, voiceEnabled: voiceEnabledRef.current });
                    return next;
                  });
                }}
              >
                {isMicMuted ? <BsMicMuteFill /> : <BsMicFill />}
              </button>
              <span>میکروفون</span>
            </div>
          ) : (
            <div className="room-page__side-bar__item">
              <button
                type="button"
                className="room-page__side-bar__voice-join"
                aria-label="پیوستن به چت صوتی"
                title="پیوستن به چت صوتی"
                onClick={handleJoinVoice}
              >
                <PiUserSoundFill />
              </button>
              <span>چت صوتی</span>
            </div>
          )
        )}

        <div className="room-page__side-bar__item">
          {!isStealthAdmin && <button className="room-page__side-bar__microphone" onClick={() => setUsersModalOpen(true)}>
            <BsFillPeopleFill />
          </button>}
          <span>کاربران</span>
        </div>

        <div className="room-page__side-bar__item">
          <button className="room-page__side-bar__share" onClick={() => setInviteModalOpen(true)}>
            <BsFillShareFill />
          </button>
          <span>دعوت</span>
        </div>

        <div className="room-page__side-bar__item">
          <button className="room-page__side-bar__exit" onClick={handleLeaveRoomClick}>
            <IoExitOutline />
          </button>
          <span>خروج</span>
        </div>

        <div className={clsx("room-page__side-bar__reaction", reactionDrawerOpen && "open")}>
          <div className="room-page__side-bar__reaction__drawer">
            <button onClick={(e) => handleReactionClick(e, "😭")}>
              😭
            </button>
            <button onClick={(e) => handleReactionClick(e, "😂")}>
              😂
            </button>
            <button onClick={(e) => handleReactionClick(e, "❤️")}>
              ❤️
            </button>
            <button onClick={(e) => handleReactionClick(e, "😍")}>
              😍
            </button>
            <button onClick={(e) => handleReactionClick(e, "🔥")}>
              🔥
            </button>

          </div>

          <button
            ref={reactionTriggerRef}
            className="room-page__side-bar__reaction__trigger"
            onClick={() => setReactionDrawerOpen((prev) => !prev)}
          >
            <span>
              <BsEmojiLaughing />
            </span>
          </button>
        </div>
      </div>

      <div className="room-page__main">
        <div className="room-page__main__top">
          <button className="room-page__main__top__submit" onClick={handleSubmitPlayback} disabled={!linkModeEnabled || !link.trim()}>
            ثبت
          </button>

          {selectedMedia ? (
            <div className="room-page__main__top__now-playing" dir="rtl">
              <span className="room-page__main__top__now-playing__icon">
                <TbPlayerPlayFilled />
              </span>

              <div className="room-page__main__top__now-playing__body">
                <strong>{selectedMedia.title}</strong>

                {selectedMedia.type === "series" ? (
                  <div className="room-page__main__top__now-playing__meta">
                    {selectedMedia.season != null && <span>فصل {selectedMedia.season}</span>}
                    {selectedMedia.episode != null && <span>قسمت {selectedMedia.episode}</span>}
                  </div>
                ) : (
                  <div className="room-page__main__top__now-playing__meta">
                    <span>فیلم</span>
                    {selectedMedia.quality && <span>{selectedMedia.quality}</span>}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <input
              type="text"
              data-video-link-input
              placeholder={linkModeEnabled ? "لینک مورد نظر را وارد کنید" : "برای وارد کردن لینک، «انتخاب فیلم» را بزنید"}
              dir={linkModeEnabled ? "ltr" : "rtl"}
              onChange={(e) => setLink(e.target.value)}
              value={link}
              disabled={!linkModeEnabled}
            />
          )}

          <button className="room-page__main__top__choose" onClick={() => setMediaTypeModalOpen(true)}>
            انتخاب فیلم
          </button>
        </div>

        <div className="room-page__main__player">
          {playbackSrc ? (
            <>
              <img src="/logo//transparentBg//hamnama1-8-08-cropped.png" alt="" className="room-page__main__player__logo" />
              <VideoPlayer
                src={playbackSrc}
                quality={currentQuality}
                mediaId={selectedMedia?.id || currentId || undefined}
                subtitleSeason={selectedMedia?.season}
                subtitleEpisode={selectedMedia?.episode}
                customSubtitleTracks={customSubtitleTracks}
                subtitleSettings={subtitleSettings}
                onSubtitleSettingsChange={setSubtitleSettings}
                isPlaying={isPlaying}
                currentTime={currentTime}
                className='flex-1! h-full! mb-0 mt-auto ml-auto mr-auto'
                onPlayRequest={() => {
                  setIsPlaying(true);
                  emitPlayback("play", currentTime);
                }}
                onPauseRequest={() => {
                  setIsPlaying(false);
                  emitPlayback("pause", currentTime);
                }}
                onSeekRequest={(t) => {
                  setCurrentTime(t);
                  emitPlayback("seek", t);
                }}
                onLocalTimeUpdate={(t) => {
                  setCurrentTime(t);
                  currentTimeRef.current = t;
                }}
                nextEpisode={
                  selectedMedia?.type === "series" && selectedMedia.season != null && selectedMedia.episode != null
                    ? selectedMedia.nextEpisode ?? null
                    : null
                }
                onNextEpisodeRequest={handleNextEpisode}
              />
            </>
          ) : (
            <div className="room-page__main__player__empty">
              <div className="room-page__main__player__empty__ambience" aria-hidden="true">
                <span className="room-page__main__player__empty__ambience__glow room-page__main__player__empty__ambience__glow--a" />
                <span className="room-page__main__player__empty__ambience__glow room-page__main__player__empty__ambience__glow--b" />
                <span className="room-page__main__player__empty__ambience__grid" />
                <span className="room-page__main__player__empty__ambience__spark room-page__main__player__empty__ambience__spark--1" />
                <span className="room-page__main__player__empty__ambience__spark room-page__main__player__empty__ambience__spark--2" />
                <span className="room-page__main__player__empty__ambience__spark room-page__main__player__empty__ambience__spark--3" />
              </div>

              <div className="room-page__main__player__empty__content">
                <span className="room-page__main__player__empty__icon">
                  <span className="room-page__main__player__empty__icon__ring" />
                  <TbMovieOff />
                </span>
                <strong>هنوز چیزی برای پخش انتخاب نشده</strong>
                <p>با زدن «انتخاب فیلم» یک عنوان از آرشیو انتخاب کنید یا لینک مستقیم ویدیو را وارد کنید.</p>
                <div className="room-page__main__player__empty__hint">
                  <strong>راهنمای کنترل:</strong>
                  <p>
                    J / L = عقب یا جلو ۱۰ ثانیه
                  </p>
                  <p>
                    K / Space = پخش یا توقف
                  </p>
                  <p>
                    ← / → = عقب یا جلو ۵ ثانیه
                  </p>
                  <p>
                    F = تمام‌صفحه
                  </p>
                  <p>
                    موبایل: دو ضربه روی نیمه چپ یا راست = عقب/جلو ۱۰ ثانیه
                  </p>
                </div>
                <button type="button" onClick={() => setMediaTypeModalOpen(true)}>
                  انتخاب منبع پخش
                </button>
              </div>
            </div>
          )}
        </div>
      </div>


      <div
        className={clsx("room-page__chat-container", sidebarOpen && "sidebar-open")}
        style={{ "--chat-width": `${chatWidth}px` } as CSSProperties}
      >
        <div
          className="room-page__chat-container__resize-handle"
          role="separator"
          aria-label="تغییر عرض چت"
          aria-orientation="vertical"
          onPointerDown={handleChatResizeStart}
          onPointerMove={handleChatResizeMove}
          onPointerUp={handleChatResizeEnd}
          onPointerCancel={handleChatResizeEnd}
          onDoubleClick={() => setChatWidth(clampChatWidth(DEFAULT_CHAT_WIDTH))}
        />
        <div className="room-page__chat-container__head">
          <div className="room-page__chat-container__head__identity">
            <span className="room-page__chat-container__head__icon" aria-hidden="true">
              <IoChatbubblesSharp />
            </span>
            <div className="room-page__chat-container__head__copy">
              <strong>گفت‌وگوی اتاق</strong>
              <span>مکالمه‌ی شما با افراد حاضر</span>
            </div>
          </div>
          <div className="room-page__chat-container__head__presence" aria-label={`${members.length} نفر حاضر در اتاق`}>
            <BsPeopleFill aria-hidden="true" />
            <span>{members.length}</span>
          </div>
        </div>

        <div className="room-page__chat-container__chat-main">
          {visibleRoomAnnouncements.map((announcement) => (
            <aside
              key={announcement.id}
              className="room-page__chat-container__announcement"
              aria-label="اعلان مدیریت"
            >
              <div className="room-page__chat-container__announcement__icon">
                <TbPlayerPlayFilled aria-hidden="true" />
              </div>
              <div className="room-page__chat-container__announcement__body">
                <strong>اعلان مدیریت</strong>
                <p>{announcement.message}</p>
              </div>
              <button
                type="button"
                onClick={() => hideAnnouncement(announcement.id)}
                aria-label="بستن اعلان"
              >
                <IoClose />
              </button>
            </aside>
          ))}
          {groupedMessages.length === 0 && (
            <div className="room-page__chat-container__empty">
              <div className="room-page__chat-container__empty__icon" aria-hidden="true">
                <IoChatbubblesSharp />
              </div>
              <div className="room-page__chat-container__empty__copy">
                <strong>گفت‌وگو از اینجا شروع می‌شود</strong>
                <p>اولین پیام را بفرستید و فضا را زنده کنید.</p>
              </div>
            </div>
          )}

          {groupedMessages.map((item, index) => {
            if (item.kind === "system") {
              const time = new Date(item.event.created_at).toLocaleTimeString("fa-IR", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={item.event.id} className="room-page__chat-container__day">
                  <span>
                    {item.event.user_name} {item.event.kind === "joined" ? "به اتاق پیوست" : "از اتاق خارج شد"} · {time}
                  </span>
                </div>
              );
            }

            const message = item.message;
            const prev = groupedMessages[index - 1];
            const next = groupedMessages[index + 1];
            const prevMessage = prev?.kind === "message" ? prev.message : null;
            const nextMessage = next?.kind === "message" ? next.message : null;
            const isOwn = !message.is_admin_sender && message.sender_id === user?.id;

            const dayLabel = new Date(message.created_at).toLocaleDateString("fa-IR", {
              day: "numeric",
              month: "long",
            });
            const prevDayLabel = prevMessage
              ? new Date(prevMessage.created_at).toLocaleDateString("fa-IR", { day: "numeric", month: "long" })
              : null;

            const showAvatar = !nextMessage || nextMessage.sender_id !== message.sender_id;

            return (
              <div key={message.id}>
                {dayLabel !== prevDayLabel && (
                  <div className="room-page__chat-container__day">
                    <span>{dayLabel}</span>
                  </div>
                )}

                <ChatMessage
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  isHighlighted={highlightedMessageId === message.id}
                  onReply={message.is_admin_sender ? () => undefined : () => handleReply({ id: message.id, message: message.content })}
                  onReplyNavigate={message.is_admin_sender ? undefined : (message.replying_to_id ? () => handleNavigateToMessage(message.replying_to_id as string) : undefined)}
                  onEdit={isOwn ? () => handleEditMessage(message) : undefined}
                />
              </div>
            );
          })}

          <div ref={chatBottomRef} />
        </div>

        <div className="room-page__chat-container__foot">
          {emojiPickerOpen && (
            <EmojiPicker onSelect={handleSelectEmoji} onClose={() => setEmojiPickerOpen(false)} />
          )}

          {editingMessageId && (
            <div className="room-page__chat-container__foot__editing">
              <div>
                <strong>ویرایش پیام</strong>
                <span>متن پیام را اصلاح کنید و ذخیره را بزنید.</span>
              </div>
              <button type="button" onClick={handleCancelEdit} aria-label="لغو ویرایش">
                <TbX />
              </button>
            </div>
          )}

          <div className="room-page__chat-container__foot__row">
            <button
              className={clsx("room-page__chat-container__foot__send", editingMessageId && "is-editing")}
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sendMessageMutation.isPending || editMessageMutation.isPending}
              onPointerDown={(e) => e.preventDefault()}
              aria-label={editingMessageId ? "ذخیره ویرایش" : "ارسال پیام"}
            >
              {editingMessageId ? <FaCheck /> : <FaArrowRight />}
            </button>

            <div className="room-page__chat-container__foot__input">
              {!!replyingTo.id && (
                <div className="room-page__chat-container__foot__replying-to">
                  <BsReplyFill />
                  <div className="room-page__chat-container__foot__replying-to__body">
                    <strong>پاسخ به پیام</strong>
                    <p>{replyingTo.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo({ id: "", message: "" })}
                    aria-label="لغو پاسخ"
                  >
                    <IoClose />
                  </button>
                </div>
              )}

              <div className="room-page__chat-container__foot__input__row">
                <button
                  type="button"
                  aria-label="ایموجی"
                  data-emoji-trigger
                  className={clsx(emojiPickerOpen && "is-active")}
                  onClick={() => setEmojiPickerOpen((prev) => !prev)}
                  disabled={sendMessageMutation.isPending || editMessageMutation.isPending}
                >
                  <TbSticker />
                </button>
                <textarea
                  id='room-chat-input'
                  ref={messageInputRef}
                  rows={1}
                  placeholder="پیام خود را بنویسید..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onFocus={() => {
                    window.requestAnimationFrame(() => {
                      const viewport = window.visualViewport;
                      if (!viewport) return;
                      const currentHeight = viewport.height;
                      viewportBaseHeightRef.current = Math.max(
                        viewportBaseHeightRef.current ?? currentHeight,
                        currentHeight,
                      );
                    });
                  }}
                  onBlur={() => setIsKeyboardOpen(false)}
                  disabled={false}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={clsx("room-page__modal-overlay", settingsModalOpen || usersModalOpen || mediaTypeModalOpen || archiveModalOpen || inviteModalOpen ? "is-active" : "",)} onClick={closeModals} >
        {settingsModalOpen && (
          <div className="room-page__modal-overlay__modal" onClick={(e) => e.stopPropagation()}>
            <SettingsModal
              isOpen={settingsModalOpen}
              isPublic={roomState.is_public}
              mediaControlPermission={roomState.media_control_permission}
              playbackTime={roomState.playback_time}
              currentlyPlaying={roomState.currently_playing}
              createdAt={roomState.created_at}
              // subtitleSettings={subtitleSettings}
              // onSubtitleSettingsChange={setSubtitleSettings}
              soundVolumes={roomSoundVolumes}
              onSoundVolumesChange={setRoomSoundVolumes}
            />
          </div>
        )}

        {usersModalOpen && (
          <div className="room-page__modal-overlay__modal" onClick={(e) => e.stopPropagation()}>
            <UsersModal
              isOpen={usersModalOpen}
              users={members}
              isCurrentAdmin={isCurrentUserAdmin}
              onChangeRole={handleChangeMemberRole}
              onKick={handleKickMember}
              roleLoadingId={
                updateRoleMutation.isPending
                  ? updateRoleMutation.variables?.userId ?? null
                  : null
              }
              kickLoadingId={
                kickMemberMutation.isPending
                  ? kickMemberMutation.variables ?? null
                  : null
              }
            />
          </div>
        )}

        {mediaTypeModalOpen && (
          <div className="room-page__modal-overlay__modal" onClick={(e) => e.stopPropagation()}>
            <MediaTypeModal
              isOpen={mediaTypeModalOpen}
              closeModal={() => setMediaTypeModalOpen(false)}
              openArchive={() => setArchiveModalOpen(true)}
              onChooseLink={handleChooseLinkMode}
              onSubmitUpload={handleUploadOwnMedia}
            />
          </div>
        )}

        {archiveModalOpen && (
          <div className="room-page__modal-overlay__modal" onClick={(e) => e.stopPropagation()}>
            <ArchiveModal
              isOpen={archiveModalOpen}
              closeModal={() => setArchiveModalOpen(false)}
              onSelectMedia={handleArchiveSelect}
              currentPlaying={roomState.currently_playing}
              currentPlayingId={currentId}
            />
          </div>
        )}

        {inviteModalOpen && (
          <div className="room-page__modal-overlay__modal room-page__modal-overlay__modal--invite" onClick={(e) => e.stopPropagation()}>
            <InviteModal
              isOpen={inviteModalOpen}
              roomCode={String(roomState.code)}
              copied={inviteCopied}
              onClose={() => setInviteModalOpen(false)}
              onCopy={handleCopyInviteCode}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomPage;
