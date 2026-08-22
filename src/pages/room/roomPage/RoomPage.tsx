import './RoomPage.scss'
import './themse/Themes.scss'
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { AiTwotoneSetting } from "react-icons/ai";
import { BsEmojiLaughing, BsFillPeopleFill, BsFillShareFill, BsMicFill, BsMicMuteFill, BsReplyFill } from "react-icons/bs";
import { IoChatbubblesSharp, IoChevronBack, IoClose, IoExitOutline } from "react-icons/io5";
import { FaArrowRight, FaCheck } from "react-icons/fa6";
import { TbSticker, TbMovieOff, TbPlayerPlayFilled, TbX } from "react-icons/tb";

import SettingsModal from "./settingsModal/SettingsModal";
import ChatMessage from "./ChatMessage";
import EmojiPicker from "./EmojiePicker";
import UsersModal from "./usersModal/UsersModal";
import MediaTypeModal from "./mediaTypeModal/MediaTypeModal";
import ArchiveModal, { type SelectedArchiveMedia } from "./archiveModal/ArchiveModal";
import VideoPlayer from "./videoPlayer.tsx/VideoPlayer";

import {
  getRoom,
  leaveRoom,
  sendRoomMessage,
  editRoomMessage,
  kickRoomMember,
  updateRoomMemberRole,
  type ConnectionStatus,
  type RoomMessageResponse,
  type RoomReactionResponse,
  type RoomResponse,
  type RoomSocketUserPresence,
} from "../../../apiCalls/roomApi";
import { useAuth } from "../../../context/AuthContext";
import AnimatedParticle from '../../../components/animatedParticle/AnimatedParticle';
import { useConfirmationModal } from '../../../context/ConfirmModalContext/ConfirmaModalContext';
import { useAppViewport } from '../../../hooks/useAppViewPort';
import { useNavigate, useParams } from 'react-router-dom';

type ClientSocketEvent =
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
      is_playing: boolean;
      user_id: string;
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
      is_playing: boolean;
      user_id: string;
    };
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
  };

function buildWsUrl(baseUrl: string, roomId: string, token?: string) {
  const url = new URL(baseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = url.pathname.replace(/\/$/, "") + `/rooms/${roomId}/ws`;
  if (token) url.searchParams.set("token", token);
  return url.toString();
}

const RoomPage = () => {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const [currentQuality, setCurrentQuality] = useState("quality");
  const [currentId, setCurrentId] = useState('')
  const [link, setLink] = useState("");
  // The link input is locked until the user picks "پخش با لینک" in the media type modal.
  const [linkModeEnabled, setLinkModeEnabled] = useState(false);
  // What the video element actually plays. Only updated on submit / archive pick.
  const [playbackSrc, setPlaybackSrc] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<SelectedArchiveMedia | null>(null);
  const [messageText, setMessageText] = useState("");
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

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null);
  const [screenShareError, setScreenShareError] = useState<string | null>(null);
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, ConnectionStatus>>({});
  const currentTimeRef = useRef(0);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const intentionalSocketCloseRef = useRef(false);

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
      x: startX,
      y: startY,
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

  const ICE_SERVERS: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    ...(() => {
      const urls = String(import.meta.env["VITE_TURN_URLS"] ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      if (!urls.length) return [] as RTCIceServer[];

      const username = String(import.meta.env["VITE_TURN_USERNAME"] ?? "");
      const credential = String(import.meta.env["VITE_TURN_CREDENTIAL"] ?? "");
      if (!username || !credential) return [] as RTCIceServer[];

      return [{
        urls,
        username,
        credential,
      }] as RTCIceServer[];
    })(),
  ];

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

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
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
  };

  const enableVoice = async () => {
    if (!user?.id) return;
    try {
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

  useEffect(() => {
    if (!roomQuery.data) return;

    console.log("ROOM QUERY MEMBERS:", roomQuery.data.members);

    setRoomState(roomQuery.data);
    setConnectionLost(false);
    setPlaybackSrc(roomQuery.data.currently_playing ?? "");
    setCurrentTime(roomQuery.data.playback_time ?? 0);
    setIsPlaying(roomQuery.data.is_playing ?? false);
    const statuses: Record<string, ConnectionStatus> = {};

    roomQuery.data.members.forEach((member) => {
      statuses[member.user_id] = "good";
    });

    setConnectionStatuses(statuses);
  }, [roomQuery.data]);

  useEffect(() => {
    if (screenVideoRef.current && screenShareStream) {
      screenVideoRef.current.srcObject = screenShareStream;
    }
  }, [screenShareStream]);

  useEffect(() => {
    return () => {
      screenShareStream?.getTracks().forEach((track) => track.stop());
    };
  }, [screenShareStream]);

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

  // Auto-scroll to the newest message.
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [groupedMessages.length]);

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

    const token = localStorage.getItem("token") ?? undefined;
    const socket = new WebSocket(buildWsUrl(wsBaseUrl, roomId, token));
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
        case "chat_message":
          setRoomState((prev) => {
            if (!prev) return prev;
            if (prev.messages.some((m) => m.id === parsed.payload.id)) return prev;
            return { ...prev, messages: [...prev.messages, parsed.payload] };
          });
          break;

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
            navigate("/");
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

          setRoomState((prev) =>
            prev
              ? {
                ...prev,
                currently_playing: parsed.payload.currently_playing ?? prev.currently_playing,
                playback_time: Math.round(parsed.payload.playback_time),
              }
              : prev,
          );

          if (typeof parsed.payload.currently_playing === "string") {
            setPlaybackSrc(parsed.payload.currently_playing);
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
      if (e.code === 4003) {
        intentionalSocketCloseRef.current = true;
        navigate("/");
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
  }, [roomId, user?.id]);

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
        },
      });
    }, 30000);

    return () => {
      if (syncIntervalRef.current) {
        window.clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [isCreator, isPlaying, currentTime, playbackSrc, user?.id]);

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => sendRoomMessage(roomId!, content, replyingTo.id),
    onSuccess: () => {
      setMessageText("");
      setReplyingTo({ message: "", id: "" });
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
      navigate("/");
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

  const emitPlayback = (action: "play" | "pause" | "seek" | "sync" | "load", nextTime: number, nextSrc?: string) => {
    const source = nextSrc ?? playbackSrc;
    const payload = {
      action,
      playback_time: nextTime,
      currently_playing: source || null,
      is_playing: action === "play" || action === "sync" || action === "load" ? true : action === "pause" ? false : isPlaying,
      user_id: user?.id ?? "",
    };

    sendSocketEvent({ type: "sync_playback", payload });

    setRoomState((prev) =>
      prev
        ? {
          ...prev,
          currently_playing: source || null,
          playback_time: Math.round(nextTime),
        }
        : prev,
    );
  };

  const handleSendMessage = () => {
    const content = messageText.trim();
    if (!content || sendMessageMutation.isPending || editMessageMutation.isPending) return;

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
    setPlaybackSrc(nextSrc);
    setCurrentTime(0);
    setIsPlaying(false);
    emitPlayback("load", 0, nextSrc);
  };

  const handleChooseLinkMode = () => {
    setSelectedMedia(null);
    setLinkModeEnabled(true);
    setMediaTypeModalOpen(false);
  };

  const handleArchiveSelect = (media: SelectedArchiveMedia) => {
    setCurrentId(media.id)
    setSelectedMedia(media);
    setLinkModeEnabled(false);
    setLink("");
    setCurrentQuality(media.quality ?? "quality");
    setPlaybackSrc(media.url);
    setCurrentTime(0);
    setIsPlaying(false);
    emitPlayback("load", 0, media.url);
  };

  const handleNextEpisode = () => {
    const nextEpisode = selectedMedia?.nextEpisode;
    if (!nextEpisode) return;

    setCurrentId(nextEpisode.id);
    setSelectedMedia(nextEpisode);
    setCurrentQuality(nextEpisode.quality ?? "quality");
    setPlaybackSrc(nextEpisode.url);
    setCurrentTime(0);
    setIsPlaying(true);
    emitPlayback("load", 0, nextEpisode.url);
  };

  const handleShareScreen = async () => {
    try {
      setScreenShareError(null);
      setMediaTypeModalOpen(false);

      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error("این مرورگر از اشتراک‌گذاری صفحه پشتیبانی نمی‌کند.");
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      setScreenShareStream(stream);
    } catch (error) {
      setScreenShareError(error instanceof Error ? error.message : "امکان شروع اشتراک‌گذاری صفحه وجود ندارد.");
      console.error("Screen share error:", error);
    }
  };

  const stopScreenShare = () => {
    screenShareStream?.getTracks().forEach((track) => track.stop());
    setScreenShareStream(null);
    setScreenShareError(null);
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

  if (roomQuery.isLoading) {
    return <div className="room-page">در حال دریافت اطلاعات اتاق...</div>;
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

  const isCurrentUserAdmin = members.some(
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
    <div className={clsx("room-page", sidebarOpen && "sidebar-open")}>
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

        {!voiceEnabled ? (
          <div className="room-page__side-bar__item">
            <button
              type="button"
              className="room-page__side-bar__voice-join"
              aria-label="پیوستن به چت صوتی"
              title="پیوستن به چت صوتی"
              onClick={handleJoinVoice}
            >
              <BsMicFill />
            </button>
            <span>چت صوتی</span>
          </div>
        ) : (
          <div className="room-page__side-bar__item">
            <button
              type="button"
              className={clsx("room-page__side-bar__microphone", "voice-active")}
              aria-label={isMicMuted ? "روشن کردن میکروفون" : "بی‌صدا کردن میکروفون"}
              title={isMicMuted ? "روشن کردن میکروفون" : "بی‌صدا کردن میکروفون"}
              onClick={() => {
                setIsMicMuted((prev) => {
                  const next = !prev;
                  voiceLog("local mute toggle", {
                    muted: next,
                    voiceEnabled: voiceEnabledRef.current,
                  });
                  return next;
                });
              }}
            >
              {isMicMuted ? <BsMicMuteFill /> : <BsMicFill />}
            </button>
            <span>میکروفون</span>
          </div>
        )}

        <div className="room-page__side-bar__item">
          <button className="room-page__side-bar__microphone" onClick={() => setUsersModalOpen(true)}>
            <BsFillPeopleFill />
          </button>
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
          {screenShareStream ? (
            <div className="room-page__main__player__screen-share">
              <video ref={screenVideoRef} autoPlay playsInline muted className="room-page__main__player__screen-share__video" />
              <div className="room-page__main__player__screen-share__actions">
                <button onClick={stopScreenShare}>توقف اشتراک‌گذاری</button>
                {screenShareError && <p>{screenShareError}</p>}
              </div>
            </div>
          ) : playbackSrc ? (
            <VideoPlayer
              src={playbackSrc}
              quality={currentQuality}
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
          ) : (
            <div className="room-page__main__player__empty">
              <span className="room-page__main__player__empty__icon">
                <TbMovieOff />
              </span>
              <strong>هنوز چیزی برای پخش انتخاب نشده</strong>
              <p>با زدن «انتخاب فیلم» یک عنوان از آرشیو انتخاب کنید یا لینک مستقیم ویدیو را وارد کنید.</p>
              <div className="mt-4 max-w-xl rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-6 text-gray-300">
                <strong className="mr-1 text-white">راهنمای کنترل:</strong>
                <span>J / L = عقب یا جلو ۱۰ ثانیه · K / Space = پخش یا توقف · ← / → = عقب یا جلو ۵ ثانیه · F = تمام‌صفحه · موبایل: دو ضربه روی نیمه چپ یا راست = عقب/جلو ۱۰ ثانیه</span>
              </div>
              <button type="button" onClick={() => setMediaTypeModalOpen(true)}>
                انتخاب منبع پخش
              </button>
            </div>
          )}
        </div>
      </div>


      <div className={clsx("room-page__chat-container", sidebarOpen && "sidebar-open")}>
        <div className="room-page__chat-container__head">
          <p>چت آنلاین</p>
          <span>
            <IoChatbubblesSharp />
          </span>
        </div>

        <div className="room-page__chat-container__chat-main">
          {groupedMessages.length === 0 && (
            <div className="room-page__chat-container__empty">
              <IoChatbubblesSharp />
              <p>هنوز پیامی ارسال نشده است</p>
              <span>اولین نفری باشید که چت را شروع می‌کند</span>
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
            const isOwn = message.sender_id === user?.id;

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
                  onReply={() => handleReply({ id: message.id, message: message.content })}
                  onReplyNavigate={message.replying_to_id ? () => handleNavigateToMessage(message.replying_to_id as string) : undefined}
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
                  disabled={sendMessageMutation.isPending || editMessageMutation.isPending}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
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
              onShareScreen={handleShareScreen}
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
            <div className={clsx("room-page__invite-modal", inviteModalOpen && "open")}>
              <div className="room-page__invite-modal__head">
                <span>دعوت به اتاق</span>
                <BsFillShareFill />
              </div>
              <div className="room-page__invite-modal__body">
                <p>کد اتاق را با دیگران به اشتراک بگذارید.</p>
                <div className="room-page__invite-modal__body__code">
                  <span>{roomState.code}</span>
                  <button onClick={handleCopyInviteCode}>{inviteCopied ? "کپی شد" : "کپی"}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomPage;
