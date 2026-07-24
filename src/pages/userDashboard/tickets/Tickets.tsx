import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../../apiCalls/userApi'; // <-- Adjust import path as needed
import './Tickets.scss';
import { FiChevronLeft } from 'react-icons/fi';
import { BsPlusLg } from 'react-icons/bs';
import { IoCloseOutline } from 'react-icons/io5';
import clsx from 'clsx';
import TicketChat from './ticketChatModal/TicketChatModal';

// Helper to convert English statuses to Persian and matching CSS classes
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

// Helper for formatting ISO dates to Persian Date
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
  const [activeChatTicketId, setActiveChatTicketId] = useState<string | null>(null);

  // Fetch Tickets
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const response = await userApi.getTickets();
      return response.data.tickets || [];
    }
  });

  // Create Ticket Mutation
  const createTicketMutation = useMutation({
    mutationFn: (data: { subject: string; message: string }) => userApi.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setTicketSubject('');
      setTicketDescription('');
      setIsModalOpen(false);
    },
    onError: (error) => {
      console.error("Failed to create ticket", error);
      // Optional: Add toast notification here
    }
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    createTicketMutation.mutate({
      subject: ticketSubject,
      message: ticketDescription
    });
  };

  const handleTicketClick = (ticketId: string | number) => {
    if (window.innerWidth <= 768) {
      navigate(`/user/ticket/${ticketId}`);
    } else {
      setActiveChatTicketId(String(ticketId));
    }
  };

  return (
    <div className="user-tickets">
      <div className="user-tickets__blob" />

      <div className="user-tickets__list-container">
        <div className="user-tickets__list-container__header">
          <div className="user-tickets__list-container__header__cell">موضوع</div>
          <div className="user-tickets__list-container__header__cell">شماره تیکت</div>
          <div className="user-tickets__list-container__header__cell">وضعیت</div>
          <div className="user-tickets__list-container__header__cell">تاریخ</div>
          <div className="user-tickets__list-container__header__cell icon" />
        </div>

        <div className="user-tickets__list-container__body-wrapper">
          {isLoading ? (
            <p style={{ textAlign: 'center', padding: '1rem' }}>در حال بارگذاری...</p>
          ) : (
            ticketsData?.map((ticket: any) => {
              const statusInfo = getStatusInfo(ticket.status);
              return (
                <div
                  key={ticket.id}
                  className="user-tickets__list-container__body-wrapper__row"
                  onClick={() => handleTicketClick(ticket.id)}
                >
                  <div className="user-tickets__list-container__body-wrapper__row__cell">{ticket.subject}</div>
                  <div className="user-tickets__list-container__body-wrapper__row__cell">{ticket.id}</div>
                  <div className={`user-tickets__list-container__body-wrapper__row__cell ${statusInfo.colorClass}`}>
                    {statusInfo.text}
                  </div>
                  <div className="user-tickets__list-container__body-wrapper__row__cell">{formatDate(ticket.created_at)}</div>
                  <div className="user-tickets__list-container__body-wrapper__row__cell icon">
                    <FiChevronLeft strokeWidth={4} />
                  </div>
                </div>
              );
            })
          )}
          {!isLoading && ticketsData?.length === 0 && (
            <p style={{ textAlign: 'center', padding: '1rem' }}>تیکتی یافت نشد.</p>
          )}
        </div>
      </div>

      <button className="user-tickets__new-ticket" onClick={() => setIsModalOpen(true)}>
        ثبت تیکت جدید
        <span><BsPlusLg strokeWidth={1} /></span>
      </button>

      {/* Modal Overlay */}
      <div className={clsx('user-tickets__modal-overlay', { 'is-active': isModalOpen })} onClick={() => setIsModalOpen(false)}>
        <div className="user-tickets__modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="user-tickets__modal-content__header">
            <h3>ثبت تیکت جدید</h3>
            <span className="close-icon" onClick={() => setIsModalOpen(false)}>
              <IoCloseOutline />
            </span>
          </div>

          <form onSubmit={handleCreateTicket} className="user-tickets__modal-content__form">
            <div className="input-group">
              <label>موضوع تیکت</label>
              <input
                type="text"
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="عنوان مشکل خود را وارد کنید..."
              />
            </div>

            <div className="input-group">
              <label>توضیحات</label>
              <textarea
                required
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                placeholder="جزئیات مشکل خود را بنویسید..."
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={createTicketMutation.isPending}
              >
                {createTicketMutation.isPending ? 'در حال ارسال...' : 'ارسال تیکت'}
              </button>
              <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>انصراف</button>
            </div>
          </form>
        </div>
      </div>

      <TicketChat
        isOpen={!!activeChatTicketId}
        onClose={() => setActiveChatTicketId(null)}
        ticketId={activeChatTicketId}
      />
    </div>
  );
};

export default Tickets;