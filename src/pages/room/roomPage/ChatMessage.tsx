import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { BsReplyFill, BsThreeDotsVertical } from "react-icons/bs";
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
const LONG_PRESS_DELAY = 500;

const CONTEXT_MENU_WIDTH = 176;
const CONTEXT_MENU_HEIGHT = 92;

const ChatMessage = ({
  message,
  isOwn,
  showAvatar,
  isHighlighted,
  onReply,
  onReplyNavigate,
  onEdit,
}: Props) => {
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const startX = useRef(0);
  const startY = useRef(0);
  const locked = useRef<"none" | "x" | "y">("none");
  const fired = useRef(false);

  const longPressTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const contextMenuRef = useRef<HTMLDivElement>(null);

  const clearLongPressTimer = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const openContextMenu = (x: number, y: number) => {
    if (message.is_admin_sender) return;
    const left = Math.max(
      8,
      Math.min(
        x,
        window.innerWidth - CONTEXT_MENU_WIDTH - 8,
      ),
    );

    const top = Math.max(
      8,
      Math.min(
        y,
        window.innerHeight - CONTEXT_MENU_HEIGHT - 8,
      ),
    );

    setContextMenu({
      x: left,
      y: top,
    });
  };

  useEffect(() => {
    if (!contextMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (contextMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      setContextMenu(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };

    const handleScroll = () => {
      setContextMenu(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [contextMenu]);

  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];

    if (!touch) return;

    startX.current = touch.clientX;
    startY.current = touch.clientY;

    locked.current = "none";
    fired.current = false;
    longPressTriggered.current = false;

    clearLongPressTimer();

    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;

      navigator.vibrate?.(15);

      setSwiping(false);
      setOffset(0);

      locked.current = "none";

      openContextMenu(
        touch.clientX,
        touch.clientY,
      );
    }, LONG_PRESS_DELAY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];

    if (!touch) return;

    const dx = touch.clientX - startX.current;
    const dy = touch.clientY - startY.current;

    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      clearLongPressTimer();
    }

    if (longPressTriggered.current) {
      return;
    }

    if (locked.current === "none") {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
        return;
      }

      locked.current =
        Math.abs(dx) > Math.abs(dy)
          ? "x"
          : "y";

      if (locked.current === "x") {
        setSwiping(true);
      }
    }

    if (locked.current !== "x") {
      return;
    }

    const raw = Math.max(
      0,
      Math.abs(dx),
    );

    const next = Math.min(
      SWIPE_MAX,
      raw > SWIPE_TRIGGER
        ? raw * 0.45
        : raw,
    );

    setOffset(next);

    if (!fired.current && next >= SWIPE_TRIGGER) {
      fired.current = true;
      navigator.vibrate?.(10);
    }
  };

  const handleTouchEnd = () => {
    clearLongPressTimer();

    if (
      !longPressTriggered.current &&
      offset >= SWIPE_TRIGGER
    ) {
      onReply();
    }

    setOffset(0);
    setSwiping(false);

    locked.current = "none";
    longPressTriggered.current = false;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();

    openContextMenu(
      e.clientX,
      e.clientY,
    );
  };

  const handleMoreAction = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();

    openContextMenu(
      rect.left + rect.width / 2,
      rect.bottom + 6,
    );
  };

  const handleReplyAction = () => {
    setContextMenu(null);
    onReply();
  };

  const handleEditAction = () => {
    setContextMenu(null);
    onEdit?.();
  };

  const direction = isOwn ? -1 : 1;

  return (
    <div
      id={`chat-message-${message.id}`}
      data-message-id={message.id}
      className={clsx(message.is_admin_sender && "is-admin-message",
        "room-page__chat-container__message-block",
        isOwn && "outgoing",
        showAvatar && "has-avatar",
        isHighlighted && "is-highlighted",
        offset >= SWIPE_TRIGGER && "swipe-armed",
      )}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        className="room-page__chat-container__message-block__swipe-hint"
        style={{
          opacity: Math.min(
            1,
            offset / SWIPE_TRIGGER,
          ),
        }}
        aria-hidden
      >
        <BsReplyFill />
      </div>

      <div
        className="room-page__chat-container__message-block__swipe"
        style={{
          transform: `translateX(${offset * direction}px)`,
          transition: swiping
            ? "none"
            : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div className="room-page__chat-container__message-block__messages">
          <div className="room-page__chat-container__message-block__messages__message">
            {message.is_admin_sender && (
              <div className="room-page__chat-container__message-block__messages__message__admin-label">
                مدیریت سایت
              </div>
            )}
            {!!message.replying_to && (
              <button
                type="button"
                className="room-page__chat-container__message-block__messages__message__top"
                onClick={(event) => {
                  event.stopPropagation();
                  onReplyNavigate?.();
                }}
                disabled={!onReplyNavigate}
                title={
                  onReplyNavigate
                    ? "رفتن به پیام اصلی"
                    : undefined
                }
              >
                <span className="room-page__chat-container__message-block__messages__message__top__label">
                  {message.replying_to_sender_name ? `${message.replying_to_sender_name}:` : "پاسخ به "}
                </span>

                <span>
                  {message.replying_to}
                </span>
              </button>
            )}

            <span className="room-page__chat-container__message-block__messages__message__text">
              {message.content}
            </span>

            <span className="room-page__chat-container__message-block__messages__message__meta">
              {!message.is_admin_sender && <button
                type="button"
                className="room-page__chat-container__message-block__messages__message__more"
                onClick={handleMoreAction}
                onContextMenu={(event) => event.stopPropagation()}
                aria-label="گزینه‌های پیام"
                aria-haspopup="menu"
                aria-expanded={!!contextMenu}
                title="گزینه‌های پیام"
              >
                <BsThreeDotsVertical />
              </button>}

              <div className={clsx("flex gap-1", !isOwn && "flex-row-reverse")}>
                {message.edited && (
                  <span className="room-page__chat-container__message-block__messages__message__edited">
                    <TbPencil size={12} />
                  </span>
                )}

                <span className="room-page__chat-container__message-block__messages__message__time">
                  {new Date(
                    message.created_at,
                  ).toLocaleTimeString("fa-IR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </span>
          </div>
        </div>

        {!isOwn && (
          <div className="room-page__chat-container__message-block__avatar">
            {showAvatar ? (
              message.sender_avatar ? (
                <img
                  src={`${import.meta.env["VITE_BASE_URL"] ?? ""}${message.sender_avatar}`}
                  alt={message.sender_name}
                  onError={(e) => {
                    (
                      e.currentTarget as HTMLImageElement
                    ).style.visibility = "hidden";
                  }}
                />
              ) : (
                <div className="room-img-none">
                  <span>
                    {message.sender_name[0]?.toUpperCase()}
                  </span>
                </div>
              )
            ) : null}
          </div>
        )}
      </div>

      {contextMenu && !message.is_admin_sender && (
        <div
          ref={contextMenuRef}
          className="room-page__chat-container__message-block__context-menu"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          role="menu"
          aria-label="عملیات پیام"
        >
          <button
            type="button"
            onClick={handleReplyAction}
            role="menuitem"
          >
            <BsReplyFill />
            <span>پاسخ</span>
          </button>

          {isOwn && onEdit && (
            <button
              type="button"
              onClick={handleEditAction}
              role="menuitem"
            >
              <TbPencil />
              <span>ویرایش</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;