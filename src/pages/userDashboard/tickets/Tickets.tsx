import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft } from 'react-icons/fi';
import { BsPlusLg } from 'react-icons/bs';
import { IoCloseOutline } from 'react-icons/io5';
import clsx from 'clsx';
import { userApi } from '../../../apiCalls/userApi';
import TicketChat from './ticketChatModal/TicketChatModal';
import { toast } from '../../../components/toast';
import Skeleton from '../../../components/skeleton/Skeleton';
import { getApiErrorMessage } from '../../../lib/apiError';
import './Tickets.scss';

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'answered':
      return { text: 'پاسخ داده شده', colorClass: 'green' };
    case 'waiting_for_answer':
      return { text: 'در انتظار پاسخ', colorClass: 'yellow' };
    case 'closed':
      return { text: 'بسته شده', colorClass: 'red' };
    default:
      return { text: 'باز', colorClass: 'green' };
  }
};

const formatDate = (isoDate: string) => {
  if (!isoDate) return '';
  return new Intl.DateTimeFormat('fa-IR').format(new Date(isoDate));
};

const Tickets = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [activeChatTicketId, setActiveChatTicketId] = useState<string | null>(
    null,
  );

  const {
    data: ticketsData,
    isLoading,
    error: ticketsError,
  } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => userApi.getTickets().then((response) => response.data.tickets || []),
  });

  const createTicketMutation = useMutation({
    mutationFn: (data: { subject: string; message: string }) =>
      userApi.createTicket(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setTicketSubject('');
      setTicketDescription('');
      setIsModalOpen(false);
      toast.success('تیکت شما ثبت شد.');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'ثبت تیکت انجام نشد.'));
    },
  });

  const handleCreateTicket = (event: React.FormEvent) => {
    event.preventDefault();
    createTicketMutation.mutate({
      subject: ticketSubject,
      message: ticketDescription,
    });
  };

  const handleTicketClick = (ticketId: string | number) => {
    if (window.innerWidth <= 768) {
      navigate(`/user/ticket/${ticketId}`);
      return;
    }
    setActiveChatTicketId(String(ticketId));
  };

  return (
    <div className="user-tickets">
      <div className="user-tickets__blob" />

      <div className="user-tickets__list-container">
        <div className="user-tickets__list-container__header">
          <div className="user-tickets__list-container__header__cell">
            موضوع
          </div>
          <div className="user-tickets__list-container__header__cell">
            شماره تیکت
          </div>
          <div className="user-tickets__list-container__header__cell">
            وضعیت
          </div>
          <div className="user-tickets__list-container__header__cell">
            تاریخ
          </div>
          <div className="user-tickets__list-container__header__cell icon" />
        </div>

        <div className="user-tickets__list-container__body-wrapper">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                className="user-tickets__list-container__body-wrapper__row"
                key={index}
                aria-hidden="true"
              >
                <div className="user-tickets__list-container__body-wrapper__row__cell">
                  <Skeleton variant="text" width="72%" />
                </div>
                <div className="user-tickets__list-container__body-wrapper__row__cell">
                  <Skeleton variant="text" width={52} />
                </div>
                <div className="user-tickets__list-container__body-wrapper__row__cell">
                  <Skeleton variant="pill" width={88} height={28} />
                </div>
                <div className="user-tickets__list-container__body-wrapper__row__cell">
                  <Skeleton variant="text" width={78} />
                </div>
                <div className="user-tickets__list-container__body-wrapper__row__cell icon">
                  <Skeleton variant="circle" width={20} height={20} />
                </div>
              </div>
            ))
          ) : ticketsError ? (
            <div className="user-tickets__error">
              {getApiErrorMessage(
                ticketsError,
                'دریافت تیکت‌ها انجام نشد. لطفاً دوباره تلاش کنید.',
              )}
            </div>
          ) : ticketsData?.length ? (
            ticketsData.map((ticket: any) => {
              const statusInfo = getStatusInfo(ticket.status);

              return (
                <button
                  key={ticket.id}
                  type="button"
                  className="user-tickets__list-container__body-wrapper__row"
                  onClick={() => handleTicketClick(ticket.id)}
                >
                  <span className="user-tickets__list-container__body-wrapper__row__cell">
                    {ticket.subject}
                  </span>
                  <span className="user-tickets__list-container__body-wrapper__row__cell">
                    {ticket.id}
                  </span>
                  <span
                    className={clsx(
                      'user-tickets__list-container__body-wrapper__row__cell',
                      statusInfo.colorClass,
                    )}
                  >
                    {statusInfo.text}
                  </span>
                  <span className="user-tickets__list-container__body-wrapper__row__cell">
                    {formatDate(ticket.created_at)}
                  </span>
                  <span className="user-tickets__list-container__body-wrapper__row__cell icon">
                    <FiChevronLeft strokeWidth={4} />
                  </span>
                </button>
              );
            })
          ) : (
            <p className="user-tickets__empty">تیکتی یافت نشد.</p>
          )}
        </div>
      </div>

      <button
        className="user-tickets__new-ticket"
        type="button"
        onClick={() => setIsModalOpen(true)}
      >
        <p>ثبت تیکت جدید</p>
        <span>
          <BsPlusLg strokeWidth={1} />
        </span>
      </button>

      <div
        className={clsx('user-tickets__modal-overlay', {
          'is-active': isModalOpen,
        })}
        onClick={() => setIsModalOpen(false)}
      >
        <div
          className="user-tickets__modal-content"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="user-tickets__modal-content__header">
            <h3>ثبت تیکت جدید</h3>
            <button
              className="close-icon"
              type="button"
              onClick={() => setIsModalOpen(false)}
              aria-label="بستن"
            >
              <IoCloseOutline />
            </button>
          </div>

          <form
            onSubmit={handleCreateTicket}
            className="user-tickets__modal-content__form"
          >
            <div className="input-group">
              <label htmlFor="ticket-subject">موضوع تیکت</label>
              <input
                id="ticket-subject"
                type="text"
                required
                value={ticketSubject}
                onChange={(event) => setTicketSubject(event.target.value)}
                placeholder="عنوان مشکل خود را وارد کنید..."
              />
            </div>

            <div className="input-group">
              <label htmlFor="ticket-description">توضیحات</label>
              <textarea
                id="ticket-description"
                required
                value={ticketDescription}
                onChange={(event) => setTicketDescription(event.target.value)}
                placeholder="جزئیات مشکل خود را بنویسید..."
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={createTicketMutation.isPending}
              >
                {createTicketMutation.isPending
                  ? 'در حال ارسال...'
                  : 'ارسال تیکت'}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setIsModalOpen(false)}
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      </div>

      <TicketChat
        isOpen={Boolean(activeChatTicketId)}
        onClose={() => setActiveChatTicketId(null)}
        ticketId={activeChatTicketId}
      />
    </div>
  );
};

export default Tickets;
