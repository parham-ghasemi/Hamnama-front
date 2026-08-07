import './RoomPage.scss'
import './themse/Themes.scss'
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import { AiTwotoneSetting } from "react-icons/ai";
import { BsEmojiLaughing, BsFillPeopleFill, BsFillShareFill, BsMicFill, BsMicMuteFill, BsReplyFill } from "react-icons/bs";
import { IoChatbubblesSharp, IoChevronBack, IoClose, IoExitOutline } from "react-icons/io5";
import { FaArrowRight } from "react-icons/fa6";
import { TbSticker } from "react-icons/tb";

import SettingsModal from "./settingsModal/SettingsModal";
import ChatMessage from "./ChatMessage";
import EmojiPicker from "./EmojiePicker";
import UsersModal from "./usersModal/UsersModal";
import MediaTypeModal from "./mediaTypeModal/MediaTypeModal";
import ArchiveModal from "./archiveModal/ArchiveModal";
import VideoPlayer from "./videoPlayer.tsx/VideoPlayer";

import {
  getRoom,
  leaveRoom,
  sendRoomMessage,
  type ConnectionStatus,
  type RoomMessageResponse,
  type RoomResponse,
} from "../../../apiCalls/roomApi";
import { useAuth } from "../../../context/AuthContext";
import AnimatedParticle from '../../../components/animatedParticle/AnimatedParticle';
import { useConfirmationModal } from '../../../context/ConfirmModalContext/ConfirmaModalContext';

type SocketEvent =
  | {
    type: "chat_message";
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
    payload: {
      user_id: string;
    };
  }
  | {
    type: "user_left";
    payload: {
      user_id: string;
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
  }
  | {
    type: "error";
    payload: {
      message: string;
    };
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
  const [link, setLink] = useState("");
  const [messageText, setMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string, message: string }>({ id: "", message: "" });
  const [roomState, setRoomState] = useState<RoomResponse | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null);
  const [screenShareError, setScreenShareError] = useState<string | null>(null);
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, ConnectionStatus>>({});
  const currentTimeRef = useRef(0);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

  // ========== Start Reaction Particles ===========

  let particleIdCounter = 0;
  interface ParticleData {
    id: number;
    emoji: string;
    x: number;
    y: number;
  }
  const handleReactionClick = (e: React.MouseEvent<HTMLButtonElement>, emoji: string) => {
    // Get the exact center of the button relative to the viewport
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    // Generate 10 new particles
    const newParticles: ParticleData[] = Array.from({ length: 10 }).map(() => ({
      id: particleIdCounter++,
      emoji: emoji,
      x: startX,
      y: startY,
    }));

    // Add them to the existing state
    setParticles((prev) => [...prev, ...newParticles]);
  };

  const removeParticle = (idToRemove: number) => {
    // Clean up the particle from state once GSAP finishes animating it
    setParticles((prev) => prev.filter((p) => p.id !== idToRemove));
  };

  // ========== End Reaction Particles ===========


  const socketRef = useRef<WebSocket | null>(null);
  const syncIntervalRef = useRef<number | null>(null);

  const roomQuery = useQuery({
    queryKey: ["room", roomId],
    enabled: !!roomId,
    queryFn: () => getRoom(roomId!),
  });

  useEffect(() => {
    if (!roomQuery.data) return;
    setRoomState(roomQuery.data);
    setLink(roomQuery.data.currently_playing ?? "");
    setCurrentTime(roomQuery.data.playback_time ?? 0);
    setIsPlaying(false);
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
    const messages = roomState?.messages ?? [];
    return [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [roomState?.messages]);

  // Auto-scroll to the newest message.
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [groupedMessages.length]);

  const isCreator = roomState?.created_by === user?.id;

  const sendSocketEvent = (event: SocketEvent) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(event));
  };

  useEffect(() => {
    if (!roomId || !user?.id) return;

    const token = localStorage.getItem("token") ?? undefined;
    const socket = new WebSocket(buildWsUrl(import.meta.env.VITE_WS_BASE_URL, roomId, token));
    socketRef.current = socket;

    socket.onopen = () => console.log("WS OPEN");

    socket.onerror = (e) => console.log("WS ERROR", e);

    socket.onmessage = (event) => {
      let parsed: SocketEvent;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (parsed.type) {
        case "chat_message":
          setRoomState((prev) => {
            if (!prev) return prev;
            if (prev.messages.some((m) => m.id === parsed.payload.id)) return prev;
            return { ...prev, messages: [...prev.messages, parsed.payload] };
          });
          break;

        case "member_status":
          setConnectionStatuses((prev) => ({
            ...prev,
            [parsed.payload.user_id]: parsed.payload.status,
          }));
          break;

        case "user_joined":
          setRoomState(prev => {
            if (!prev) return prev;

            if (prev.members.some(m => m.user_id === parsed.payload.user_id))
              return prev;

            return {
              ...prev,
              members: [
                ...prev.members,
                parsed.payload
              ]
            } as RoomResponse;
          });

          break;
        case "user_left":
          // roomQuery.refetch();
          roomQuery.refetch().then(result => {
            if (result.data) {
              setRoomState(result.data);
            }
          });
          setRoomState(prev => {
            if (!prev) return prev;

            return {
              ...prev,
              members: prev.members.filter(
                m => m.user_id !== parsed.payload.user_id
              )
            };
          });
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
            setLink(parsed.payload.currently_playing);
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

        case "error":
          console.log(parsed.payload.message);
          break;
      }
    };

    socket.onclose = (e) => {
      console.log("WS CLOSED", e.code);

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };

    return () => {
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
          currently_playing: link || null,
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
  }, [isCreator, isPlaying, currentTime, link, user?.id]);

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => sendRoomMessage(roomId!, content, replyingTo.id),
    onSuccess: () => {
      setMessageText("");
      setReplyingTo({ message: "", id: "" });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveRoom(roomId!),
    onSuccess: () => {
      socketRef.current?.close();
      navigate("/");
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
    const source = nextSrc ?? link;
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
    const trimmed = messageText.trim();
    if (!trimmed || !roomId) return;
    sendMessageMutation.mutate(trimmed);
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

  const handleSubmitPlayback = () => {
    emitPlayback("load", 0, link.trim());
    setCurrentTime(0);
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

  const isCurrentUserAdmin = (): boolean => {
    for (let i = 0; i < members.length; i++) {
      if (members[i].userId === user?.id && members[i].role === "admin") {
        return true;
      }
    }
    return false;
  }



  return (
    <div className={clsx("room-page", sidebarOpen && "sidebar-open")}>
      <button
        type="button"
        className="room-page__side-bar-toggle"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label={sidebarOpen ? "بستن نوار ابزار" : "باز کردن نوار ابزار"}
      >
        <IoChevronBack />
      </button>

      <div className={clsx("room-page__side-bar", sidebarOpen && "open")}>
        <div className="room-page__side-bar__item">
          <button className="room-page__side-bar__item__settings" onClick={() => setSettingsModalOpen(true)}>
            <AiTwotoneSetting />
          </button>
          <span>تنظیمات</span>
        </div>

        <div className="room-page__side-bar__item">
          <button className="room-page__side-bar__microphone" onClick={() => setIsMicMuted((prev) => !prev)}>
            {isMicMuted ? <BsMicMuteFill /> : <BsMicFill />}
          </button>
          <span>میکروفون</span>
        </div>

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

          <button className="room-page__side-bar__reaction__trigger" onClick={() => setReactionDrawerOpen((prev) => !prev)}>
            <span>
              <BsEmojiLaughing />
            </span>
          </button>
        </div>
      </div>

      <div className="room-page__main">
        <div className="room-page__main__top">
          <button className="room-page__main__top__submit" onClick={handleSubmitPlayback}>
            ثبت
          </button>

          <input
            type="text"
            placeholder="لینک مورد نظر را وارد کنید "
            dir="ltr"
            onChange={(e) => setLink(e.target.value)}
            value={link}
          />

          <button className="room-page__main__top__choose" onClick={() => setMediaTypeModalOpen(true)}>
            انتخاب حالت پخش
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
          ) : (
            <VideoPlayer
              src={link}
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
            />
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

          {groupedMessages.map((message, index) => {
            const prev = groupedMessages[index - 1];
            const next = groupedMessages[index + 1];
            const isOwn = message.sender_id === user?.id;

            const dayLabel = new Date(message.created_at).toLocaleDateString("fa-IR", {
              day: "numeric",
              month: "long",
            });
            const prevDayLabel = prev
              ? new Date(prev.created_at).toLocaleDateString("fa-IR", { day: "numeric", month: "long" })
              : null;

            const showAvatar = !next || next.sender_id !== message.sender_id;

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
                  onReply={() => setReplyingTo({ id: message.id, message: message.content })}
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

          <div className="room-page__chat-container__foot__row">
            <button
              className="room-page__chat-container__foot__send"
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              aria-label="ارسال پیام"
            >
              <FaArrowRight />
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
                >
                  <TbSticker />
                </button>
                <textarea
                  ref={messageInputRef}
                  rows={1}
                  placeholder="پیام خود را بنویسید..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
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
            <UsersModal isOpen={usersModalOpen} users={members} isCurrentAdmin={isCurrentUserAdmin()} />
          </div>
        )}

        {mediaTypeModalOpen && (
          <div className="room-page__modal-overlay__modal" onClick={(e) => e.stopPropagation()}>
            <MediaTypeModal
              isOpen={mediaTypeModalOpen}
              closeModal={() => setMediaTypeModalOpen(false)}
              openArchive={() => setArchiveModalOpen(true)}
              onShareScreen={handleShareScreen}
            />
          </div>
        )}

        {archiveModalOpen && (
          <div className="room-page__modal-overlay__modal" onClick={(e) => e.stopPropagation()}>
            <ArchiveModal
              isOpen={archiveModalOpen}
              closeModal={() => setArchiveModalOpen(false)}
              setLink={setLink}
              setQuality={setCurrentQuality}
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