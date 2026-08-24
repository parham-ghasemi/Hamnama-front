import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  FiSend,
  FiWifi,
  FiWifiOff,
  FiX,
  FiArrowLeft,
} from "react-icons/fi";
import {
  getSupportWsUrl,
  supportApi,
  type SupportConversation,
  type SupportMessage,
} from "../../apiCalls/supportApi";
import "./SupportChatWidget.scss";

const VISITOR_KEY = "support_chat_visitor_id";
const CONVERSATION_KEY = "support_chat_conversation_id";
const NAME_KEY = "support_chat_visitor_name";

type ConnectionState = "connecting" | "connected" | "offline";

const getStored = (key: string) =>
  typeof window !== "undefined" ? localStorage.getItem(key) || "" : "";

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const SupportChatIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`support-chat-fab__icon ${open ? "is-open" : ""}`}
    viewBox="0 0 32 32"
    aria-hidden="true"
  >
    {/* Chat icon */}
    <g className="support-chat-fab__icon-chat">
      <path
        d="M8 7.75h16a5 5 0 0 1 5 5v5.75a5 5 0 0 1-5 5H15l-5.75 3.75.85-3.75H8a5 5 0 0 1-5-5v-5.75a5 5 0 0 1 5-5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 14h11M10.5 18h6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
      <circle
        cx="24"
        cy="11"
        r="1.15"
        fill="currentColor"
      />
    </g>

    {/* Close icon */}
    <g className="support-chat-fab__icon-close">
      <path
        d="M10.5 10.5 21.5 21.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M21.5 10.5 10.5 21.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  </svg>
);

const SupportChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const closeAnimationTimer = useRef<number | null>(null);

  const [conversation, setConversation] =
    useState<SupportConversation | null>(null);
  const [name, setName] = useState(getStored(NAME_KEY));
  const [message, setMessage] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [connection, setConnection] =
    useState<ConnectionState>("offline");
  const [error, setError] = useState("");

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const toggleOpen = () => {
    if (open) {
      setOpen(false);

      if (closeAnimationTimer.current) {
        window.clearTimeout(closeAnimationTimer.current);
      }

      closeAnimationTimer.current = window.setTimeout(() => {
        setRendered(false);
        closeAnimationTimer.current = null;
      }, 260);

      return;
    }

    if (closeAnimationTimer.current) {
      window.clearTimeout(closeAnimationTimer.current);
      closeAnimationTimer.current = null;
    }

    setRendered(true);

    requestAnimationFrame(() => setOpen(true));
  };

  useEffect(
    () => () => {
      if (closeAnimationTimer.current) {
        window.clearTimeout(closeAnimationTimer.current);
      }
    },
    [],
  );

  const closeSocket = useCallback(() => {
    if (reconnectTimer.current) {
      window.clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    socketRef.current?.close();
    socketRef.current = null;
    setConnection("offline");
  }, []);

  const connect = useCallback(
    (activeConversation: SupportConversation) => {
      if (activeConversation.status !== "open") return;

      const currentVisitorId = getStored(VISITOR_KEY);
      if (!currentVisitorId) return;

      closeSocket();
      setConnection("connecting");

      const liveSocket = new WebSocket(
        getSupportWsUrl(
          activeConversation.id,
          "visitor",
          currentVisitorId,
        ),
      );

      socketRef.current = liveSocket;

      liveSocket.onopen = () => {
        setConnection("connected");
        setError("");
      };

      liveSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as {
            type: string;
            payload?: SupportMessage & {
              code?: string;
              message?: string;
            };
          };

          if (data.type === "message" && data.payload?.id) {
            const payload = data.payload;

            setConversation((current) => {
              if (!current) return current;

              if (
                current.messages.some(
                  (item) => item.id === payload.id,
                )
              ) {
                return current;
              }

              return {
                ...current,
                messages: [
                  ...current.messages,
                  payload as SupportMessage,
                ],
                updated_at: payload.created_at,
              };
            });
          }

          if (data.type === "conversation_closed") {
            setConversation((current) =>
              current
                ? { ...current, status: "closed" }
                : current,
            );
            setConnection("offline");
            return;
          }

          if (data.type === "error") {
            setError(
              data.payload?.message ||
              "ارتباط با پشتیبانی با مشکل مواجه شد.",
            );
          }
        } catch {
          setError("پاسخ نامعتبر از سرور دریافت شد.");
        }
      };

      liveSocket.onerror = () => {
        setConnection("offline");
      };

      liveSocket.onclose = () => {
        setConnection("offline");

        if (activeConversation.status === "open") {
          reconnectTimer.current = window.setTimeout(
            () => connect(activeConversation),
            2500,
          );
        }
      };
    },
    [closeSocket],
  );

  useEffect(() => {
    const restore = async () => {
      const savedConversationId = getStored(CONVERSATION_KEY);
      const savedVisitorId = getStored(VISITOR_KEY);

      if (!savedConversationId || !savedVisitorId) {
        setRestoring(false);
        return;
      }

      try {
        const response = await supportApi.getConversation(
          savedConversationId,
          savedVisitorId,
        );

        setConversation(response.data);
        setName(response.data.visitor_name);
      } catch {
        localStorage.removeItem(CONVERSATION_KEY);
      } finally {
        setRestoring(false);
      }
    };

    restore();
  }, []);

  useEffect(() => {
    if (conversation?.status === "open") {
      connect(conversation);
    } else {
      closeSocket();
    }

    return () => closeSocket();
  }, [
    conversation?.id,
    conversation?.status,
    connect,
    closeSocket,
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [conversation?.messages.length]);

  useEffect(
    () => () => closeSocket(),
    [closeSocket],
  );

  const submitStart = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!initialMessage.trim()) {
      setError("پیام اول را وارد کنید.");
      return;
    }

    setLoading(true);

    try {
      const savedVisitorId =
        getStored(VISITOR_KEY) || crypto.randomUUID();

      const visitorName = name.trim() || "ناشناس";

      const response = await supportApi.createConversation({
        visitor_id: savedVisitorId,
        name: visitorName,
        message: initialMessage.trim(),
      });

      localStorage.setItem(
        VISITOR_KEY,
        response.data.visitor_id,
      );
      localStorage.setItem(
        CONVERSATION_KEY,
        response.data.id,
      );
      localStorage.setItem(
        NAME_KEY,
        response.data.visitor_name,
      );

      setConversation(response.data);
      setName(visitorName);
      setInitialMessage("");
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setError(
          "سقف ایجاد گفتگو برای امروز پر شده است. لطفاً فردا دوباره تلاش کنید.",
        );
      } else {
        setError("شروع گفتگو با مشکل مواجه شد.");
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();

    const content = message.trim();

    if (
      !content ||
      !conversation ||
      conversation.status !== "open"
    ) {
      return;
    }

    if (
      socketRef.current?.readyState !== WebSocket.OPEN
    ) {
      setError("ارتباط با پشتیبانی برقرار نیست.");
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "message",
        payload: { content },
      }),
    );

    setMessage("");
  };

  const restart = () => {
    closeSocket();
    localStorage.removeItem(CONVERSATION_KEY);
    setConversation(null);
    setError("");
  };

  return (
    <>
      <button
        className={`support-chat-fab ${open ? "is-open" : ""}`}
        type="button"
        aria-label={
          open
            ? "بستن پشتیبانی"
            : "باز کردن پشتیبانی"
        }
        aria-expanded={open}
        onClick={toggleOpen}
      >
        <SupportChatIcon open={open} />

        {!open && conversation?.messages.length ? (
          <span className="support-chat-fab__dot" />
        ) : null}
      </button>

      {rendered && (
        <>
          <div
            className={`support-chat-backdrop ${open ? "is-open" : "is-closing"
              }`}
            aria-hidden="true"
          />

          <section
            className={`support-chat ${open ? "is-open" : "is-closing"
              }`}
            dir="rtl"
          >
            <header className="support-chat__header">
              <div>
                <span className="support-chat__eyebrow">
                  پشتیبانی هم‌نما
                </span>
                <h2>کنارتون هستیم</h2>
              </div>

              <button
                type="button"
                onClick={toggleOpen}
                aria-label="بستن"
              >
                <FiX />
              </button>
            </header>

            {restoring ? (
              <div className="support-chat__state">
                در حال بازیابی گفتگو…
              </div>
            ) : !conversation ? (
              <form
                className="support-chat__start"
                onSubmit={submitStart}
              >
                <p>
                  قبل از ثبت‌نام هم می‌توانید با تیم پشتیبانی
                  گفتگو کنید.
                </p>

                <label>
                  نام
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={80}
                    placeholder="پیش‌فرض: ناشناس"
                    autoComplete="name"
                  />
                </label>

                <label>
                  پیام شما
                  <textarea
                    value={initialMessage}
                    onChange={(event) =>
                      setInitialMessage(event.target.value)
                    }
                    maxLength={2000}
                    placeholder="چطور می‌توانیم کمکتان کنیم؟"
                    rows={4}
                  />
                </label>

                {error ? (
                  <div className="support-chat__error">
                    {error}
                  </div>
                ) : null}

                <button
                  className="support-chat__primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "در حال شروع…"
                    : "شروع گفتگو"}
                  <FiArrowLeft />
                </button>
              </form>
            ) : (
              <div className="support-chat__body">
                <div className="support-chat__status">
                  <span
                    className={`support-chat__status-dot support-chat__status-dot--${connection}`}
                  />

                  <span>
                    {conversation.status === "closed"
                      ? "گفتگو بسته شده"
                      : connection === "connected"
                        ? "متصل"
                        : connection === "connecting"
                          ? "در حال اتصال…"
                          : "در حال تلاش برای اتصال"}
                  </span>

                  {conversation.status === "closed" ? (
                    <button
                      type="button"
                      onClick={restart}
                    >
                      گفتگوی جدید
                    </button>
                  ) : null}
                </div>

                <div className="support-chat__messages">
                  {conversation.messages.length === 0 ? (
                    <div className="support-chat__empty">
                      اولین پیام را بفرستید.
                    </div>
                  ) : (
                    conversation.messages.map((item) => (
                      <div
                        key={item.id}
                        className={`support-chat__message ${item.sender_type === "admin"
                          ? "is-admin"
                          : "is-visitor"
                          }`}
                      >
                        <span className="support-chat__message__label">
                          {item.sender_type === "admin"
                            ? "پشتیبانی"
                            : "شما"}
                        </span>

                        <p>{item.content}</p>

                        <time>
                          {formatTime(item.created_at)}
                        </time>
                      </div>
                    ))
                  )}

                  <div ref={bottomRef} />
                </div>

                {error ? (
                  <div className="support-chat__error">
                    {error}
                  </div>
                ) : null}

                {conversation.status === "open" ? (
                  <form
                    className="support-chat__composer"
                    onSubmit={sendMessage}
                  >
                    <textarea
                      value={message}
                      onChange={(event) =>
                        setMessage(event.target.value)
                      }
                      maxLength={2000}
                      rows={2}
                      placeholder="پیامتان را بنویسید…"
                    />

                    <button
                      className="support-chat__send"
                      type="submit"
                      disabled={
                        !message.trim() ||
                        connection !== "connected"
                      }
                      aria-label="ارسال پیام"
                    >
                      <FiSend />
                    </button>
                  </form>
                ) : (
                  <div className="support-chat__closed">
                    این گفتگو بسته شده است. برای ادامه، یک
                    گفتگوی جدید باز کنید.
                  </div>
                )}

                <div className="support-chat__connection">
                  {connection === "connected" ? (
                    <FiWifi />
                  ) : (
                    <FiWifiOff />
                  )}

                  <span>
                    {connection === "connected"
                      ? "پیام‌ها لحظه‌ای ارسال می‌شوند"
                      : "اتصال برقرار نیست"}
                  </span>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
};

export default SupportChatWidget;