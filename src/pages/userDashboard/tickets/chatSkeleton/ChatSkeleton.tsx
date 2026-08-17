import './ChatSkeleton.scss';

/**
 * Shared loading skeleton for the ticket conversation (page + modal).
 * Mimics the real bubble layout so the panel doesn't jump when data lands.
 */
const ChatSkeleton = () => (
  <div className="ticket-chat-skeleton" aria-busy="true" aria-live="polite">
    <span className="sr-only">در حال بارگذاری پیام‌ها...</span>

    {[
      { side: 'user', w: 62 },
      { side: 'admin', w: 74 },
      { side: 'user', w: 48 },
      { side: 'admin', w: 66 },
    ].map((row, i) => (
      <div
        key={i}
        className={`ticket-chat-skeleton__bubble ${row.side}`}
        style={{ width: `${row.w}%`, animationDelay: `${i * 110}ms` }}
      >
        <span className="ticket-chat-skeleton__label" />
        <span className="ticket-chat-skeleton__line" />
        <span className="ticket-chat-skeleton__line short" />
      </div>
    ))}
  </div>
);

export default ChatSkeleton;
