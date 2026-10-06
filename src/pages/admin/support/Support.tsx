import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiBookOpen,
  FiCheck,
  FiClock,
  FiEdit2,
  FiMessageCircle,
  FiPlus,
  FiSearch,
  FiSend,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";
import { supportApi, getSupportWsUrl, type SupportConversation, type SupportDefaultAnswer, type SupportMessage } from "../../../apiCalls/supportApi";
import { toast } from "../../../components/toast";
import "./Support.scss";
import Skeleton from "../../../components/skeleton/Skeleton";

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
  const [showDefaultAnswers, setShowDefaultAnswers] = useState(false);
  const [answerTitle, setAnswerTitle] = useState("");
  const [answerContent, setAnswerContent] = useState("");
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-support-conversations"],
    queryFn: async () => (await supportApi.listAdminConversations()).data.conversations,
    refetchInterval: 15000,
  });

  const defaultAnswersQuery = useQuery({
    queryKey: ["admin-support-default-answers"],
    queryFn: async () => (await supportApi.listDefaultAnswers()).data.answers,
    staleTime: 60_000,
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

  const saveDefaultAnswerMutation = useMutation({
    mutationFn: (payload: { id?: string; title: string; content: string }) =>
      payload.id
        ? supportApi.updateDefaultAnswer(payload.id, { title: payload.title, content: payload.content })
        : supportApi.createDefaultAnswer({ title: payload.title, content: payload.content }),
    onSuccess: async () => {
      toast.success(editingAnswerId ? "پاسخ پیش‌فرض ویرایش شد" : "پاسخ پیش‌فرض ایجاد شد");
      setAnswerTitle("");
      setAnswerContent("");
      setEditingAnswerId(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-support-default-answers"] });
    },
    onError: () => toast.error("ذخیره پاسخ پیش‌فرض با مشکل مواجه شد"),
  });

  const deleteDefaultAnswerMutation = useMutation({
    mutationFn: (id: string) => supportApi.deleteDefaultAnswer(id),
    onSuccess: async () => {
      toast.success("پاسخ پیش‌فرض حذف شد");
      await queryClient.invalidateQueries({ queryKey: ["admin-support-default-answers"] });
    },
    onError: () => toast.error("حذف پاسخ پیش‌فرض با مشکل مواجه شد"),
  });

  const resetDefaultAnswerForm = () => {
    setAnswerTitle("");
    setAnswerContent("");
    setEditingAnswerId(null);
  };

  const editDefaultAnswer = (answer: SupportDefaultAnswer) => {
    setEditingAnswerId(answer.id);
    setAnswerTitle(answer.title);
    setAnswerContent(answer.content);
    setShowDefaultAnswers(true);
  };

  const submitDefaultAnswer = (event: FormEvent) => {
    event.preventDefault();
    if (!answerTitle.trim() || !answerContent.trim()) return;
    saveDefaultAnswerMutation.mutate({
      id: editingAnswerId ?? undefined,
      title: answerTitle.trim(),
      content: answerContent.trim(),
    });
  };

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
        <button
          type="button"
          className={`admin-support__answers-toggle ${showDefaultAnswers ? "is-active" : ""}`}
          onClick={() => setShowDefaultAnswers((value) => !value)}
        >
          <FiBookOpen />
          مدیریت پاسخ‌های پیش‌فرض
        </button>
      </div>

      {showDefaultAnswers && (
        <section className="admin-support__answers-manager">
          <div className="admin-support__answers-manager__head">
            <div>
              <span className="admin-support__eyebrow">پاسخ‌های آماده</span>
              <h2>{editingAnswerId ? "ویرایش پاسخ پیش‌فرض" : "ساخت پاسخ پیش‌فرض"}</h2>
            </div>
            {editingAnswerId && (
              <button type="button" className="admin-support__answers-cancel" onClick={resetDefaultAnswerForm}>
                لغو ویرایش
              </button>
            )}
          </div>
          <form className="admin-support__answers-form" onSubmit={submitDefaultAnswer}>
            <input
              value={answerTitle}
              onChange={(event) => setAnswerTitle(event.target.value)}
              maxLength={80}
              placeholder="عنوان کوتاه، مثل: مشکل ورود"
            />
            <textarea
              value={answerContent}
              onChange={(event) => setAnswerContent(event.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="متنی که قرار است برای کاربر ارسال شود…"
            />
            <button type="submit" disabled={!answerTitle.trim() || !answerContent.trim() || saveDefaultAnswerMutation.isPending}>
              {editingAnswerId ? <FiEdit2 /> : <FiPlus />}
              {editingAnswerId ? "ذخیره تغییرات" : "افزودن پاسخ"}
            </button>
          </form>
          <div className="admin-support__answers-list">
            {defaultAnswersQuery.isLoading ? (
              <div className="admin-support__answers-empty">در حال دریافت پاسخ‌های پیش‌فرض…</div>
            ) : defaultAnswersQuery.data?.length ? (
              defaultAnswersQuery.data.map((answer) => (
                <article className="admin-support__answer-card" key={answer.id}>
                  <div>
                    <strong>{answer.title}</strong>
                    <p>{answer.content}</p>
                  </div>
                  <div className="admin-support__answer-card__actions">
                    <button type="button" onClick={() => editDefaultAnswer(answer)} aria-label={`ویرایش ${answer.title}`}>
                      <FiEdit2 />
                    </button>
                    <button
                      type="button"
                      className="is-danger"
                      disabled={deleteDefaultAnswerMutation.isPending}
                      onClick={() => window.confirm(`پاسخ «${answer.title}» حذف شود؟`) && deleteDefaultAnswerMutation.mutate(answer.id)}
                      aria-label={`حذف ${answer.title}`}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="admin-support__answers-empty">هنوز پاسخ پیش‌فرضی ساخته نشده است.</div>
            )}
          </div>
        </section>
      )}

      <div className="admin-support__content">
        <div className="admin-support__list">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div className="admin-support__conversation-skeleton" key={index} aria-hidden="true">
                <Skeleton variant="circle" width={38} height={38} />
                <div>
                  <Skeleton variant="text" width={110} height={14} />
                  <Skeleton variant="text" width={155} height={12} />
                </div>
              </div>
            ))
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
                <div className="admin-support__composer-wrap">
                  {defaultAnswersQuery.data?.length ? (
                    <div className="admin-support__quick-answers" aria-label="پاسخ‌های پیش‌فرض">
                      <span><FiBookOpen /> پاسخ‌های پیش‌فرض</span>
                      <div>
                        {defaultAnswersQuery.data.map((answer) => (
                          <button type="button" key={answer.id} onClick={() => setReply(answer.content)} title="قرار دادن متن در کادر پاسخ">
                            {answer.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
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
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminSupport;
