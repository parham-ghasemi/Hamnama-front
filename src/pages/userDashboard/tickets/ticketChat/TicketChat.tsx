import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IoChevronForwardOutline } from 'react-icons/io5';
import './TicketChat.scss';
import clsx from 'clsx';
import { userApi } from '../../../../apiCalls/userApi';

const TicketChat = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showInput, setShowInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Fetch Ticket Detail
  const { data: ticketDetail, isLoading } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      const response = await userApi.getTicket(ticketId!);
      return response.data;
    },
    enabled: !!ticketId,
  });

  // Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => userApi.sendTicketMessage(ticketId!, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      setReplyText('');
      setShowInput(false);
    }
  });

  // Close Ticket Mutation
  const closeTicketMutation = useMutation({
    mutationFn: () => userApi.closeTicket(ticketId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      navigate('/user/ticket'); // Navigate back on close
    }
  });

  const handleSend = () => {
    if (!replyText.trim()) return;
    sendMessageMutation.mutate(replyText);
  };

  const formattedDate = ticketDetail?.created_at
    ? new Intl.DateTimeFormat('fa-IR').format(new Date(ticketDetail.created_at))
    : '';

  const isClosed = ticketDetail?.status === 'closed';

  return (
    <div className='user-ticket-chat'>

      {/* 1. HEADER SECTION */}
      <div className='user-ticket-chat__header'>
        <div className="left">
          <p className="id">شماره تیکت: <span>{ticketId}#</span></p>
          <p className="date">{formattedDate}</p>
        </div>
        <h2 className="subject">{ticketDetail?.subject || 'در حال بارگذاری...'}</h2>
        <Link to={'/user/ticket'} className="back-btn">
          <IoChevronForwardOutline />
          <span>بازگشت</span>
        </Link>
      </div>

      {/* 2. CHAT BODY SECTION */}
      <div className="user-ticket-chat__body">
        {isLoading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>در حال بارگذاری پیام‌ها...</p>
        ) : (
          <div className='user-ticket-chat__body__chat-container'>
            {ticketDetail?.messages?.map((message: any) => (
              <div
                className={clsx("user-ticket-chat__body__chat-container__message", message.is_admin_sender ? "admin" : "user")}
                key={message.id}
              >
                <span>{message.is_admin_sender ? 'پشتیبان' : 'شما'}</span>
                <p>{message.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. FOOTER SECTION */}
      <div className='user-ticket-chat__footer'>
        {isClosed ? (
          <p style={{ textAlign: 'center', width: '100%', color: '#666' }}>این تیکت بسته شده است.</p>
        ) : (
          <>
            {/* Input container wrapper */}
            <div className={clsx('user-ticket-chat__input-wrapper', { 'is-open': showInput })}>
              <textarea
                placeholder="پاسخ خود را بنویسید..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={sendMessageMutation.isPending}
              />
              <div className='user-ticket-chat__input-wrapper__actions'>
                <button
                  className='send-btn'
                  onClick={handleSend}
                  disabled={sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? 'در حال ارسال' : 'ارسال'}
                </button>
                <button className='cancel-btn' onClick={() => setShowInput(false)}>انصراف</button>
              </div>
            </div>

            {/* Main button actions container */}
            <div className={clsx('user-ticket-chat__buttons-container', { 'is-hidden': showInput })}>
              <button
                className='user-ticket-chat__buttons-container__answer'
                onClick={() => setShowInput(true)}
              >
                پاسخ
              </button>
              <button
                className='user-ticket-chat__buttons-container__close'
                onClick={() => closeTicketMutation.mutate()}
                disabled={closeTicketMutation.isPending}
              >
                {closeTicketMutation.isPending ? 'درحال بستن...' : 'بستن تیکت'}
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default TicketChat;