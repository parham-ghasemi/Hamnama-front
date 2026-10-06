import { useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { IoChevronForwardOutline } from 'react-icons/io5';
import clsx from 'clsx';
import { userApi } from '../../../../apiCalls/userApi';
import { toast } from '../../../../components/toast';
import { getApiErrorMessage } from '../../../../lib/apiError';
import ChatSkeleton from '../chatSkeleton/ChatSkeleton';
import './TicketChat.scss';

const TicketChat = () => {
  const params = useParams<{ ticketId?: string; id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const ticketId =
    params.ticketId ??
    params.id ??
    location.pathname.split('/').filter(Boolean).pop();

  const [showInput, setShowInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  const {
    data: ticketDetail,
    isPending,
    isFetching,
    error: ticketError,
  } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => userApi.getTicket(ticketId!).then((response) => response.data),
    enabled: Boolean(ticketId),
  });

  const isLoading = isPending && isFetching;

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => userApi.sendTicketMessage(ticketId!, message),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      setReplyText('');
      setShowInput(false);
      toast.success('پاسخ شما ارسال شد.');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'ارسال پاسخ انجام نشد.'));
    },
  });

  const closeTicketMutation = useMutation({
    mutationFn: () => userApi.closeTicket(ticketId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      void queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('تیکت بسته شد.');
      navigate('/user/ticket');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'بستن تیکت انجام نشد.'));
    },
  });

  const handleSend = () => {
    const message = replyText.trim();
    if (!message) return;
    sendMessageMutation.mutate(message);
  };

  const formattedDate = ticketDetail?.created_at
    ? new Intl.DateTimeFormat('fa-IR').format(
        new Date(ticketDetail.created_at),
      )
    : '';

  const isClosed = ticketDetail?.status === 'closed';

  return (
    <div className="user-ticket-chat">
      <div className="user-ticket-chat__header">
        <div className="left">
          <p className="left__id">
            شماره تیکت: <span>{ticketId}#</span>
          </p>
          <p className="left__date">
            {formattedDate}
          </p>
        </div>

        {isLoading ? (
          <h2 className="subject is-loading">
            <span className="subject-skeleton" />
          </h2>
        ) : (
          <h2 className="subject">
            {ticketDetail?.subject || 'تیکت'}
          </h2>
        )}

        <Link to="/user/ticket" className="back-btn">
          <IoChevronForwardOutline />
          <span>بازگشت</span>
        </Link>
      </div>

      <div className="user-ticket-chat__body">
        {isLoading ? (
          <ChatSkeleton />
        ) : ticketError ? (
          <div className="user-ticket-chat__error">
            {getApiErrorMessage(ticketError, 'دریافت اطلاعات تیکت انجام نشد.')}
          </div>
        ) : (
          <div className="user-ticket-chat__body__chat-container">
            {ticketDetail?.messages?.map((message: any) => (
              <div
                className={clsx(
                  'user-ticket-chat__body__chat-container__message',
                  message.is_admin_sender ? 'admin' : 'user',
                )}
                key={message.id}
              >
                <span>{message.is_admin_sender ? 'پشتیبان' : 'شما'}</span>
                <p>{message.message}</p>
              </div>
            ))}

            {!ticketDetail?.messages?.length && (
              <p className="user-ticket-chat__body__empty">
                پیامی وجود ندارد.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="user-ticket-chat__footer">
        {isClosed ? (
          <p className="user-ticket-chat__footer__closed">
            این تیکت بسته شده است.
          </p>
        ) : (
          <>
            <div
              className={clsx('user-ticket-chat__input-wrapper', {
                'is-open': showInput,
              })}
            >
              <textarea
                placeholder="پاسخ خود را بنویسید..."
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                disabled={sendMessageMutation.isPending}
              />

              <div className="user-ticket-chat__input-wrapper__actions">
                <button
                  className="send-btn"
                  type="button"
                  onClick={handleSend}
                  disabled={sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? 'در حال ارسال...' : 'ارسال'}
                </button>
                <button
                  className="cancel-btn"
                  type="button"
                  onClick={() => setShowInput(false)}
                >
                  انصراف
                </button>
              </div>
            </div>

            <div
              className={clsx('user-ticket-chat__buttons-container', {
                'is-hidden': showInput,
              })}
            >
              <button
                className="user-ticket-chat__buttons-container__answer"
                type="button"
                onClick={() => setShowInput(true)}
              >
                پاسخ
              </button>
              <button
                className="user-ticket-chat__buttons-container__close"
                type="button"
                onClick={() => closeTicketMutation.mutate()}
                disabled={closeTicketMutation.isPending}
              >
                {closeTicketMutation.isPending
                  ? 'در حال بستن...'
                  : 'بستن تیکت'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TicketChat;
