import { useState } from 'react';
import { IoReturnUpForwardOutline } from 'react-icons/io5';
import './TicketChat.scss';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
// import { useParams } from "react-router-dom"

const TicketChat = () => {
  // const { id } = useParams()
  const [showInput, setShowInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  const messages = [
    {
      from: "parham",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    },
    {
      from: "پشتیبان",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    },
    {
      from: "پشتیبان",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    },
    {
      from: "پشتیبان",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    },
    {
      from: "پشتیبان",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    },
    {
      from: "پشتیبان",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    },
  ]

  const handleSend = () => {
    // Add your message sending logic here
    console.log("Sending reply:", replyText);
    setReplyText('');
    setShowInput(false);
  };

  return (
    <div className='user-ticket-chat'>
      <div className='user-ticket-chat__back-container'>
        <Link to={'/user/ticket'}><IoReturnUpForwardOutline /></Link>
      </div>

      <div className='user-ticket-chat__chat-container'>
        {messages.map((message, ind) => (
          <div className={clsx("user-ticket-chat__chat-container__message", message.from === "پشتیبان" ? "admin" : "user")} key={`ticketmessage${ind}`}>
            <span>{message.from}</span>
            <p>{message.text}</p>
          </div>
        ))}
      </div>

      {/* Input container wrapper with conditional class for smooth transition */}
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

      {/* Main button actions container smoothly collapses when input is active */}
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
  );
};

export default TicketChat;