import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FiSearch,
  FiCheckCircle,
  FiRotateCcw,
  FiMessageSquare,
  FiMail,
} from 'react-icons/fi';
import { toast } from 'sonner';
import { adminApi } from '../../../apiCalls/adminApi';
import './Tickets.scss';

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'closed':
      return { text: 'بسته‌شده', className: 'closed' };
    case 'answered':
      return { text: 'پاسخ داده‌شده', className: 'answered' };
    default:
      return { text: 'در انتظار پاسخ', className: 'waiting' };
  }
};

const formatDate = (value: string) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const Tickets = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [reply, setReply] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const response = await adminApi.getTickets();
      return response.data.tickets || [];
    },
  });

  const selectedTicket = useMemo(() => {
    if (!data || !selectedTicketId) return null;
    return (
      data.find((ticket: { id: number }) => ticket.id === selectedTicketId) ??
      null
    );
  }, [data, selectedTicketId]);

  const { data: ticketDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['admin-ticket-details', selectedTicketId],
    queryFn: async () => {
      if (!selectedTicketId) return null;
      const response = await adminApi.getTicket(selectedTicketId);
      return response.data;
    },
    enabled: !!selectedTicketId,
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) =>
      adminApi.replyToTicket(id, message),
    onSuccess: async () => {
      toast.success('پاسخ ارسال شد');
      setReply('');
      await queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      await queryClient.invalidateQueries({
        queryKey: ['admin-ticket-details', selectedTicketId],
      });
    },
    onError: () => toast.error('ارسال پاسخ با مشکل مواجه شد'),
  });

  const closeMutation = useMutation({
    mutationFn: (id: number) => adminApi.closeTicket(id),
    onSuccess: async () => {
      toast.success('تیکت بسته شد');
      await queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      await queryClient.invalidateQueries({
        queryKey: ['admin-ticket-details', selectedTicketId],
      });
    },
    onError: () => toast.error('امکان بستن تیکت وجود ندارد'),
  });

  const reopenMutation = useMutation({
    mutationFn: (id: number) => adminApi.reopenTicket(id),
    onSuccess: async () => {
      toast.success('تیکت دوباره باز شد');
      await queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      await queryClient.invalidateQueries({
        queryKey: ['admin-ticket-details', selectedTicketId],
      });
    },
    onError: () => toast.error('امکان باز کردن مجدد تیکت وجود ندارد'),
  });

  const filteredTickets = useMemo(() => {
    if (!data) return [];
    return data.filter((ticket: { subject: string; status: string }) => {
      const term = search.trim();
      if (!term) return true;
      return `${ticket.subject} ${ticket.status}`.includes(term);
    });
  }, [data, search]);

  if (isLoading) {
    return (
      <section className="admin-tickets">
        <div className="admin-tickets__loading">در حال بارگذاری…</div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="admin-tickets">
        <div className="admin-tickets__empty">
          امکان بارگذاری تیکت‌ها وجود ندارد.
        </div>
      </section>
    );
  }

  return (
    <section className="admin-tickets">
      <header className="admin-tickets__header">
        <div>
          <p className="admin-tickets__eyebrow">پشتیبانی</p>
          <h1 className="admin-tickets__title">مدیریت تیکت‌ها</h1>
        </div>
        <span className="admin-tickets__count">
          {data?.length ?? 0} تیکت در دسترس
        </span>
      </header>

      <div className="admin-tickets__toolbar">
        <label className="admin-tickets__search">
          <FiSearch aria-hidden />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجو در موضوع یا وضعیت"
          />
        </label>
      </div>

      <div className="admin-tickets__content">
        <div className="admin-tickets__list">
          {filteredTickets.length === 0 ? (
            <div className="admin-tickets__empty admin-tickets__empty--inline">
              تیکتی مطابق جستجو یافت نشد.
            </div>
          ) : (
            filteredTickets.map(
              (ticket: {
                id: number;
                subject: string;
                status: string;
                created_at: string;
              }) => {
                const status = getStatusInfo(ticket.status);
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    className={`admin-tickets__item ${selectedTicketId === ticket.id ? 'is-active' : ''
                      }`}
                    onClick={() => setSelectedTicketId(ticket.id)}
                  >
                    <div className="admin-tickets__item__top">
                      <span
                        className={`admin-tickets__status admin-tickets__status--${status.className}`}
                      >
                        {status.text}
                      </span>
                      <span className="admin-tickets__item__date">
                        {formatDate(ticket.created_at)}
                      </span>
                    </div>
                    <p className="admin-tickets__item__subject">
                      {ticket.subject}
                    </p>
                    <span className="admin-tickets__item__id">
                      تیکت #{ticket.id}
                    </span>
                  </button>
                );
              }
            )
          )}
        </div>

        <div className="admin-tickets__detail">
          {!selectedTicket ? (
            <div className="admin-tickets__empty admin-tickets__empty--detail">
              <FiMail size={36} />
              <p>یک تیکت را برای مشاهده گفتگو انتخاب کنید.</p>
            </div>
          ) : (
            <>
              <div className="admin-tickets__detail__header">
                <div>
                  <p className="admin-tickets__detail__title">
                    {selectedTicket.subject}
                  </p>
                  <span className="admin-tickets__detail__meta">
                    {formatDate(selectedTicket.created_at)}
                  </span>
                </div>
                <div className="admin-tickets__detail__actions">
                  {ticketDetails?.status === 'closed' ? (
                    <button
                      type="button"
                      className="admin-tickets__action admin-tickets__action--reopen"
                      disabled={reopenMutation.isPending}
                      onClick={() => reopenMutation.mutate(selectedTicket.id)}
                    >
                      <FiRotateCcw />
                      بازگشایی
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-tickets__action admin-tickets__action--close"
                      disabled={closeMutation.isPending}
                      onClick={() => closeMutation.mutate(selectedTicket.id)}
                    >
                      <FiCheckCircle />
                      بستن
                    </button>
                  )}
                </div>
              </div>

              <div className="admin-tickets__messages">
                {isDetailsLoading ? (
                  <div className="admin-tickets__empty admin-tickets__empty--inline">
                    در حال بارگذاری گفتگو…
                  </div>
                ) : (
                  ticketDetails?.messages?.map(
                    (message) => (
                      <div
                        key={message.id}
                        className={`admin-tickets__bubble ${message.is_admin_sender ? 'is-admin' : 'is-user'
                          }`}
                      >
                        <div className="admin-tickets__bubble__meta">
                          <span>
                            {message.is_admin_sender ? 'پشتیبان' : 'کاربر'}
                          </span>
                          <span>{formatDate(message.created_at)}</span>
                        </div>
                        <p>{message.message}</p>
                      </div>
                    )
                  )
                )}
              </div>

              <form
                className="admin-tickets__composer"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!reply.trim()) return;
                  replyMutation.mutate({
                    id: selectedTicket.id,
                    message: reply,
                  });
                }}
              >
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="پاسخ مدیر را بنویسید..."
                  rows={4}
                />
                <button
                  type="submit"
                  className="admin-tickets__action admin-tickets__action--reply"
                  disabled={replyMutation.isPending || !reply.trim()}
                >
                  <FiMessageSquare />
                  ارسال پاسخ
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Tickets;