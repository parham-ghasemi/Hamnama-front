import { useRef, useState } from "react";
import clsx from "clsx";
import { BsReplyFill } from "react-icons/bs";
import { TbPencil } from "react-icons/tb";

import type { RoomMessageResponse } from "../../../apiCalls/roomApi";

type Props = {
  message: RoomMessageResponse;
  isOwn: boolean;
  showAvatar: boolean;
  isHighlighted?: boolean;
  onReply: () => void;
  onReplyNavigate?: () => void;
  onEdit?: () => void;
};

const SWIPE_TRIGGER = 56;
const SWIPE_MAX = 84;

const ChatMessage = ({ message, isOwn, showAvatar, isHighlighted, onReply, onReplyNavigate, onEdit }: Props) => {
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const locked = useRef<"none" | "x" | "y">("none");
  const fired = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    locked.current = "none";
    fired.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const dx = touch.clientX - startX.current;
    const dy = touch.clientY - startY.current;

    if (locked.current === "none") {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      locked.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (locked.current === "x") setSwiping(true);
    }

    if (locked.current !== "x") return;

    const raw = Math.max(0, Math.abs(dx));
    const next = Math.min(SWIPE_MAX, raw * (raw > SWIPE_TRIGGER ? 0.45 : 1));
    setOffset(next);

    if (!fired.current && next >= SWIPE_TRIGGER) {
      fired.current = true;
      navigator.vibrate?.(10);
    }
  };

  const handleTouchEnd = () => {
    if (offset >= SWIPE_TRIGGER) onReply();
    setOffset(0);
    setSwiping(false);
    locked.current = "none";
  };

  const direction = isOwn ? -1 : 1;

  return (
    <div
      id={`chat-message-${message.id}`}
      data-message-id={message.id}
      className={clsx(
        "room-page__chat-container__message-block",
        isOwn && "outgoing",
        showAvatar && "has-avatar",
        isHighlighted && "is-highlighted",
        offset >= SWIPE_TRIGGER && "swipe-armed",
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        className="room-page__chat-container__message-block__swipe-hint"
        style={{ opacity: Math.min(1, offset / SWIPE_TRIGGER) }}
        aria-hidden
      >
        <BsReplyFill />
      </div>

      <div
        className="room-page__chat-container__message-block__swipe"
        style={{
          transform: `translateX(${offset * direction}px)`,
          transition: swiping ? "none" : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {isOwn && onEdit && (
          <button
            type="button"
            className="room-page__chat-container__message-block__edit"
            onClick={onEdit}
            aria-label="ویرایش پیام"
          >
            <TbPencil />
          </button>
        )}

        <button
          type="button"
          className="room-page__chat-container__message-block__reply"
          onClick={onReply}
          aria-label="پاسخ به پیام"
        >
          <BsReplyFill />
        </button>

        <div className="room-page__chat-container__message-block__messages">
          <div className="room-page__chat-container__message-block__messages__message">
            {!!message.replying_to && (
              <button
                type="button"
                className="room-page__chat-container__message-block__messages__message__top"
                onClick={(event) => {
                  event.stopPropagation();
                  onReplyNavigate?.();
                }}
                disabled={!onReplyNavigate}
                title={onReplyNavigate ? "رفتن به پیام اصلی" : undefined}
              >
                <span className="room-page__chat-container__message-block__messages__message__top__label">پاسخ به</span>
                <span>{message.replying_to}</span>
              </button>
            )}
            <span className="room-page__chat-container__message-block__messages__message__text">
              {message.content}
            </span>
            <span className="room-page__chat-container__message-block__messages__message__meta">
              <span className="room-page__chat-container__message-block__messages__message__time">
                {new Date(message.created_at).toLocaleTimeString("fa-IR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {message.edited && <span className="room-page__chat-container__message-block__messages__message__edited">ویرایش شد</span>}
            </span>
          </div>
        </div>

        {!isOwn && (
          <div className="room-page__chat-container__message-block__avatar">
            {showAvatar ? (
              message.sender_avatar ? (
                <img
                  src={`${import.meta.env['VITE_BASE_URL'] ?? ''}${message.sender_avatar}`}
                  alt={message.sender_name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                  }}
                />
              ) : (
                <div className="room-img-none">
                  <span>{message.sender_name[0]?.toUpperCase()}</span>
                </div>
              )
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
