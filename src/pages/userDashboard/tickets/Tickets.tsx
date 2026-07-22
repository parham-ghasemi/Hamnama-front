import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- Imported useNavigate
import './Tickets.scss';
import { FiChevronLeft } from 'react-icons/fi';
import { BsPlusLg } from 'react-icons/bs';
import { IoCloseOutline } from 'react-icons/io5';
import clsx from 'clsx';
import TicketChat from './ticketChatModal/TicketChatModal';

const TICKETS_DATA = [
  { id: '001', subject: 'مشکل در پرداخت', status: 'پاسخ داده شده', date: '1404/10/22' },
  { id: '002', subject: 'تمدید اشتراک', status: 'در انتظار پاسخ', date: '1404/10/21' },
  { id: '003', subject: 'درخواست بازگشت وجه', status: 'بسته شده', date: '1404/10/18' },
];

const Tickets = () => {
  const navigate = useNavigate(); // <-- Initialized navigation

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');

  const [activeChatTicketId, setActiveChatTicketId] = useState<string | null>(null);

  const handleCreateTicket = (e: any) => {
    e.preventDefault();
    console.log("Submitting:", { ticketSubject, ticketDescription });

    setTicketSubject('');
    setTicketDescription('');
    setIsModalOpen(false);
  };

  // Check window size on click, route to page on mobile, modal on desktop
  const handleTicketClick = (ticketId: string) => {
    if (window.innerWidth <= 768) {
      navigate(`/user/ticket/${ticketId}`);
    } else {
      setActiveChatTicketId(ticketId);
    }
  };

  return (
    <div className="user-tickets">
      <div className="user-tickets__blob" />

      <div className="user-tickets__list-container">
        {/* Header (Hidden on Mobile via SCSS) */}
        <div className="user-tickets__list-container__header">
          <div className="user-tickets__list-container__header__cell">موضوع</div>
          <div className="user-tickets__list-container__header__cell">شماره تیکت</div>
          <div className="user-tickets__list-container__header__cell">وضعیت</div>
          <div className="user-tickets__list-container__header__cell">تاریخ</div>
          <div className="user-tickets__list-container__header__cell icon" />
        </div>

        {/* Body */}
        <div className="user-tickets__list-container__body-wrapper">
          {TICKETS_DATA.map((ticket) => (
            <div
              key={ticket.id}
              className="user-tickets__list-container__body-wrapper__row"
              onClick={() => handleTicketClick(ticket.id)}
            >
              <div className="user-tickets__list-container__body-wrapper__row__cell">{ticket.subject}</div>
              <div className="user-tickets__list-container__body-wrapper__row__cell">{ticket.id}</div>
              <div className={`user-tickets__list-container__body-wrapper__row__cell ${ticket.status === 'پاسخ داده شده' ? 'green' : ticket.status === 'در انتظار پاسخ' ? 'yellow' : 'red'
                }`}>
                {ticket.status}
              </div>
              <div className="user-tickets__list-container__body-wrapper__row__cell">{ticket.date}</div>
              <div className="user-tickets__list-container__body-wrapper__row__cell icon">
                <FiChevronLeft strokeWidth={4} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="user-tickets__new-ticket" onClick={() => setIsModalOpen(true)}>
        ثبت تیکت جدید
        <span><BsPlusLg strokeWidth={1} /></span>
      </button>

      {/* --- Create Ticket Modal Structure --- */}
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
              <button type="submit" className="submit-btn">ارسال تیکت</button>
              <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>انصراف</button>
            </div>
          </form>
        </div>
      </div>

      {/* --- Ticket Chat Modal Injection --- */}
      <TicketChat
        isOpen={!!activeChatTicketId}
        onClose={() => setActiveChatTicketId(null)}
        ticketId={activeChatTicketId}
      />

    </div>
  );
};

export default Tickets;