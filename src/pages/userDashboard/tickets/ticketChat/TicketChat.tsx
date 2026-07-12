import { useState } from 'react';
import { IoChevronForwardOutline } from 'react-icons/io5';
import './TicketChat.scss';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

const TicketChat = () => {
  const [showInput, setShowInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Mock data for the new header elements
  const ticketSubject = "مشکل در پرداخت";
  const ticketDate = "1404/10/22";
  const ticketId = "1001";

  const messages = [
    {
      from: "parham",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer sit amet lacinia eros. Fusce bibendum tincidunt urna, a vehicula diam laoreet sed. Nam scelerisque laoreet felis, sit amet sodales sapien tempus ut. Nulla tempus ipsum quis sapien aliquet luctus. Proin vulputate lobortis turpis ac vehicula. Quisque ultricies lacus mauris, id mattis ligula volutpat sit amet. Etiam mi turpis, vestibulum a vestibulum eget, scelerisque id mi. Donec eu vehicula sem, sed finibus neque."
    },
    {
      from: "پشتیبان",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer sit amet lacinia eros. Fusce bibendum tincidunt urna, a vehicula diam laoreet sed. Nam scelerisque laoreet felis, sit amet sodales sapien tempus ut. Nulla tempus ipsum quis sapien aliquet luctus. Proin vulputate lobortis turpis ac vehicula. Quisque ultricies lacus mauris, id mattis ligula volutpat sit amet. Etiam mi turpis, vestibulum a vestibulum eget, scelerisque id mi. Donec eu vehicula sem, sed finibus neque."
    },
    {
      from: "parham",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer sit amet lacinia eros. Fusce bibendum tincidunt urna, a vehicula diam laoreet sed. Nam scelerisque laoreet felis, sit amet sodales sapien tempus ut. Nulla tempus ipsum quis sapien aliquet luctus. Proin vulputate lobortis turpis ac vehicula. Quisque ultricies lacus mauris, id mattis ligula volutpat sit amet. Etiam mi turpis, vestibulum a vestibulum eget, scelerisque id mi. Donec eu vehicula sem, sed finibus neque."
    },
    {
      from: "parham",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer sit amet lacinia eros. Fusce bibendum tincidunt urna, a vehicula diam laoreet sed. Nam scelerisque laoreet felis, sit amet sodales sapien tempus ut. Nulla tempus ipsum quis sapien aliquet luctus. Proin vulputate lobortis turpis ac vehicula. Quisque ultricies lacus mauris, id mattis ligula volutpat sit amet. Etiam mi turpis, vestibulum a vestibulum eget, scelerisque id mi. Donec eu vehicula sem, sed finibus neque."
    },
    {
      from: "پشتیبان",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer sit amet lacinia eros. Fusce bibendum tincidunt urna, a vehicula diam laoreet sed. Nam scelerisque laoreet felis, sit amet sodales sapien tempus ut. Nulla tempus ipsum quis sapien aliquet luctus. Proin vulputate lobortis turpis ac vehicula. Quisque ultricies lacus mauris, id mattis ligula volutpat sit amet. Etiam mi turpis, vestibulum a vestibulum eget, scelerisque id mi. Donec eu vehicula sem, sed finibus neque."
    },
  ];

  const handleSend = () => {
    console.log("Sending reply:", replyText);
    setReplyText('');
    setShowInput(false);
  };

  return (
    <div className='user-ticket-chat'>

      {/* 1. HEADER SECTION */}
      <div className='user-ticket-chat__header'>
        <div className="left">
          <p className="id">شماره تیکت: <span>{ticketId}#</span></p>
          <p className="date">{ticketDate}</p>
        </div>
        <h2 className="subject">{ticketSubject}</h2>
        <Link to={'/user/ticket'} className="back-btn">
          <IoChevronForwardOutline />
          <span>بازگشت</span>
        </Link>
      </div>

      {/* 2. CHAT BODY SECTION */}
      <div className="user-ticket-chat__body">
        <div className='user-ticket-chat__body__chat-container'>
          {messages.map((message, ind) => (
            <div className={clsx("user-ticket-chat__body__chat-container__message", message.from === "پشتیبان" ? "admin" : "user")} key={`ticketmessage${ind}`}>
              <span>{message.from}</span>
              <p>{message.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. FOOTER SECTION */}
      <div className='user-ticket-chat__footer'>
        {/* Input container wrapper */}
        <div className={clsx('user-ticket-chat__input-wrapper', { 'is-open': showInput })}>
          <textarea
            placeholder="پاسخ خود را بنویسید..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <div className='user-ticket-chat__input-wrapper__actions'>
            <button className='send-btn' onClick={handleSend}>ارسال</button>
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
          <button className='user-ticket-chat__buttons-container__close'>بستن تیکت</button>
        </div>
      </div>

    </div>
  );
};

export default TicketChat;