import './RoomPage.scss'
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import { AiTwotoneSetting } from "react-icons/ai";
import { BsFillPeopleFill, BsFillShareFill, BsMicFill } from "react-icons/bs";
import { IoChatbubblesSharp, IoExitOutline } from "react-icons/io5";
import { FaArrowRight } from "react-icons/fa6";
import { TbSticker } from "react-icons/tb";

import SettingsModal from "./settingsModal/SettingsModal";
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

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [usersModalOpen, setUsersModalOpen] = useState(false);
  const [mediaTypeModalOpen, setMediaTypeModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);

  const [currentQuality, setCurrentQuality] = useState("1080");
  const [link, setLink] = useState("");
  const [messageText, setMessageText] = useState("");
  const [roomState, setRoomState] = useState<RoomResponse | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, ConnectionStatus>>({});
  const currentTimeRef = useRef(0);

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

  const groupedMessages = useMemo(() => {
    const messages = roomState?.messages ?? [];
    return [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [roomState?.messages]);

  const isCreator = roomState?.created_by === user?.id;

  const sendSocketEvent = (event: SocketEvent) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(event));
  };

  useEffect(() => {
    if (!roomId || !user?.id) return;

    const token = localStorage.getItem("token") ?? undefined;
    const socket = new WebSocket(buildWsUrl(import.meta.env.VITE_BASE_URL, roomId, token));
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
    mutationFn: (content: string) => sendRoomMessage(roomId!, content),
    onSuccess: () => {
      setMessageText("");
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

  const handleLeaveRoom = () => {
    if (!roomId) return;
    leaveMutation.mutate();
  };

  const handleSubmitPlayback = () => {
    emitPlayback("load", 0, link.trim());
    setCurrentTime(0);
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

  return (
    <div className="room-page">
      <div className="room-page__side-bar">
        <div className="room-page__side-bar__item">
          <button className="room-page__side-bar__item__settings" onClick={() => setSettingsModalOpen(true)}>
            <AiTwotoneSetting />
          </button>
          <span>تنظیمات</span>
        </div>

        <div className="room-page__side-bar__item">
          <button className="room-page__side-bar__microphone">
            <BsMicFill />
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
          <button className="room-page__side-bar__share">
            <BsFillShareFill />
          </button>
          <span>دعوت</span>
        </div>

        <div className="room-page__side-bar__item">
          <button className="room-page__side-bar__exit" onClick={handleLeaveRoom}>
            <IoExitOutline />
          </button>
          <span>خروج</span>
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
          <VideoPlayer
            src={link}
            quality={currentQuality}
            isPlaying={isPlaying}
            currentTime={currentTime}
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
        </div>
      </div>

      <div className="room-page__chat-container">
        <div className="room-page__chat-container__head">
          <p>چت آنلاین</p>
          <span>
            <IoChatbubblesSharp />
          </span>
        </div>

        <div className="room-page__chat-container__chat-main">
          {groupedMessages.map((message) => (
            <div
              className={clsx(
                "room-page__chat-container__message-block",
                message.sender_id === user?.id && "outgoing",
              )}
              key={message.id}
            >
              <div className="room-page__chat-container__message-block__messages">
                <div className="room-page__chat-container__message-block__messages__message">
                  <span className="room-page__chat-container__message-block__messages__message__text">
                    {message.content}
                  </span>
                  <span className="room-page__chat-container__message-block__messages__message__time">
                    {new Date(message.created_at).toLocaleTimeString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <img
                src={message.sender_avatar}
                alt={message.sender_name}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/rodeocover.png";
                }}
              />
            </div>
          ))}
        </div>

        <div className="room-page__chat-container__foot">
          <button onClick={handleSendMessage}>
            <FaArrowRight />
          </button>

          <div className="room-page__chat-container__foot__input">
            <button>
              <TbSticker />
            </button>
            <textarea
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

      <div className={clsx("room-page__modal-overlay", settingsModalOpen || usersModalOpen || mediaTypeModalOpen || archiveModalOpen ? "is-active" : "",)} onClick={closeModals} >
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
            <UsersModal isOpen={usersModalOpen} users={members} />
          </div>
        )}

        {mediaTypeModalOpen && (
          <div className="room-page__modal-overlay__modal" onClick={(e) => e.stopPropagation()}>
            <MediaTypeModal
              isOpen={mediaTypeModalOpen}
              closeModal={() => setMediaTypeModalOpen(false)}
              openArchive={() => setArchiveModalOpen(true)}
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
      </div>
    </div>
  );
};

export default RoomPage;