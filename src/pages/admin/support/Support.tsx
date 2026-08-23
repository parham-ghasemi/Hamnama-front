import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiCheck,
  FiClock,
  FiMessageCircle,
  FiSearch,
  FiSend,
  FiXCircle,
} from "react-icons/fi";
import { supportApi, getSupportWsUrl, type SupportConversation, type SupportMessage } from "../../../apiCalls/supportApi";
import { toast } from "../../../components/toast";
import "./Support.scss";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const getStatus = (status: string) =>
  status === "closed"
    ? { label: "بسته‌شده", className: "closed" }
    : { label: "باز", className: "open" };

const AdminSupport = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-support-conversations"],
    queryFn: async () => (await supportApi.listAdminConversations()).data.conversations,
    refetchInterval: 15000,
  });

  const selected = useMemo(
    () => data?.find((item) => item.id === selectedId) || null,
    [data, selectedId],
  );

  const { data: details, isLoading: isDetailsLoading } = useQuery({
    queryKey: ["admin-support-conversation", selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      return (await supportApi.getAdminConversation(selectedId)).data;
    },
    enabled: !!selectedId,
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => supportApi.closeAdminConversation(id),
    onSuccess: async () => {
      toast.success("گفتگو بسته شد");
      await queryClient.invalidateQueries({ queryKey: ["admin-support-conversations"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-support-conversation", selectedId] });
    },
    onError: () => toast.error("بستن گفتگو با مشکل مواجه شد"),
  });

  useEffect(() => {
    socketRef.current?.close();
    socketRef.current = null;
    setConnected(false);

    if (!selectedId || details?.status === "closed") {
      return;
    }

    const socket = new WebSocket(getSupportWsUrl(selectedId, "admin"));
    socketRef.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onerror = () => setConnected(false);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          type: string;
          payload?: SupportMessage;
        };

        if (data.type !== "message" || !data.payload?.id) return;

        const payload = data.payload;

        queryClient.setQueryData<SupportConversation | undefined>(
          ["admin-support-conversation", selectedId],
          (current) => {
            if (!current || current.messages.some((item) => item.id === payload.id)) {
              return current;
            }

            return {
              ...current,
              messages: [...current.messages, payload],
              updated_at: payload.created_at,
            };
          },
        );
        queryClient.invalidateQueries({ queryKey: ["admin-support-conversations"] });
      } catch {
        // Ignore malformed socket payloads; the connection remains usable.
      }
    };

    return () => {
      socket.close();
    };
  }, [selectedId, details?.status, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [details?.messages.length]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data || [];
    return (data || []).filter((item) =>
      `${item.visitor_name} ${item.latest_message} ${item.status}`.toLowerCase().includes(term),
    );
  }, [data, search]);

  const sendReply = (event: FormEvent) => {
    event.preventDefault();
    const content = reply.trim();
    if (!content || !selectedId || !connected) return;

    socketRef.current?.send(
      JSON.stringify({
        type: "message",
        payload: { content },
      }),
    );
    setReply("");
  };

  return (
    <section className="admin-support">
      <header className="admin-support__header">
        <div>
          <p className="admin-support__eyebrow">پشتیبانی</p>
          <h1>گفتگوهای آنلاین</h1>
        </div>
        <span className="admin-support__count">
          {data?.length ?? 0} گفتگو
        </span>
      </header>

      <div className="admin-support__toolbar">
        <label>
          <FiSearch aria-hidden />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجو بر اساس نام یا پیام"
          />
        </label>
      </div>

      <div className="admin-support__content">
        <div className="admin-support__list">
          {isLoading ? (
            <div className="admin-support__state">در حال بارگذاری گفتگوها…</div>
          ) : isError ? (
            <div className="admin-support__state">بارگذاری گفتگوها ممکن نیست.</div>
          ) : filtered.length === 0 ? (
            <div className="admin-support__state">
              <FiMessageCircle />
              <span>هنوز گفتگویی وجود ندارد.</span>
            </div>
          ) : (
            filtered.map((item) => {
              const status = getStatus(item.status);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`admin-support__item ${selectedId === item.id ? "is-active" : ""}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="admin-support__item__top">
                    <strong>{item.visitor_name}</strong>
                    <span className={`admin-support__status admin-support__status--${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <p>{item.latest_message || "بدون پیام"}</p>
                  <time>
                    <FiClock /> {formatDate(item.updated_at)}
                  </time>
                </button>
              );
            })
          )}
        </div>

        <div className="admin-support__detail">
          {!selectedId ? (
            <div className="admin-support__empty-detail">
              <FiMessageCircle />
              <h2>یک گفتگو را انتخاب کنید</h2>
              <p>پیام‌های بازدیدکنندگان در اینجا نمایش داده می‌شود.</p>
            </div>
          ) : isDetailsLoading || !details ? (
            <div className="admin-support__state">در حال بارگذاری گفتگو…</div>
          ) : (
            <>
              <header className="admin-support__detail__header">
                <div>
                  <p className="admin-support__eyebrow">گفتگو با</p>
                  <h2>{selected?.visitor_name || details.visitor_name}</h2>
                  <span>{formatDate(details.created_at)}</span>
                </div>
                <div className="admin-support__detail__actions">
                  <div className={`admin-support__live ${connected ? "is-connected" : ""}`}>
                    {connected ? <FiCheck /> : <FiXCircle />}
                    {connected ? "آنلاین" : "آفلاین"}
                  </div>
                  {details.status === "open" ? (
                    <button
                      type="button"
                      className="admin-support__close"
                      onClick={() => closeMutation.mutate(details.id)}
                      disabled={closeMutation.isPending}
                    >
                      بستن گفتگو
                    </button>
                  ) : (
                    <span className="admin-support__closed-label">گفتگو بسته است</span>
                  )}
                </div>
              </header>

              <div className="admin-support__messages">
                {details.messages.length === 0 ? (
                  <div className="admin-support__state">هنوز پیامی ثبت نشده است.</div>
                ) : (
                  details.messages.map((item) => (
                    <div
                      key={item.id}
                      className={`admin-support__bubble ${item.sender_type === "admin" ? "is-admin" : "is-visitor"}`}
                    >
                      <div className="admin-support__bubble__meta">
                        <span>{item.sender_type === "admin" ? "شما" : details.visitor_name}</span>
                        <time>{formatTime(item.created_at)}</time>
                      </div>
                      <p>{item.content}</p>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {details.status === "open" ? (
                <form className="admin-support__composer" onSubmit={sendReply}>
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    maxLength={2000}
                    rows={3}
                    placeholder="پاسخ خود را بنویسید…"
                  />
                  <button type="submit" disabled={!reply.trim() || !connected}>
                    <FiSend />
                    ارسال پاسخ
                  </button>
                </form>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminSupport;
