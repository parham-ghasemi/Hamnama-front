import { AiTwotoneSetting } from 'react-icons/ai';
import './RoomPage.scss';
import { BsFillPeopleFill, BsFillShareFill, BsMicFill } from 'react-icons/bs';
import { IoChatbubblesSharp, IoExitOutline } from 'react-icons/io5';
import { FaArrowRight } from "react-icons/fa6";
import { TbSticker } from "react-icons/tb";
import clsx from 'clsx';
import { useState } from 'react';
import SettingsModal from './settingsModal/SettingsModal';
import UsersModal from './usersModal/UsersModal';
import MediaTypeModal from './mediaTypeModal/MediaTypeModal';

const RoomPage = () => {
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false)
  const [usersModalOpen, setUsersModalOpen] = useState<boolean>(false)
  const [mediaTypeModalOpen, setMediaTypeModalOpen] = useState<boolean>(false)
  const [archiveModalOpen, setArchiveModalOpen] = useState<boolean>(false)

  const currentUserId = 1;
  const messageBlocks = [
    {
      from: {
        id: 1,
        pfp: "/rodeocover.png"
      },
      messages: [
        {
          text: "عالیه !!",
          time: "11:51"
        },
        {
          text: "وابگوی سوالات پیوسته اهل دنیای موجود طراحی اساسا مورد استفاده قرار گیرد.",
          time: "11:52"
        },
        {
          text: "وابگوی سوالات پیوسته اهل دنیای موجود طراحی اساسا مورد استفاده قرار گیرد.",
          time: "11:52"
        }
      ]
    },
    {
      from: {
        id: 2,
        pfp: "/rodeocover.png"
      },
      messages: [
        {
          text: "عالیه !!",
          time: "11:59"
        },
        {
          text: "وابگوی سوالات پیوسته اهل دنیای موجود طراحی اساسا مورد استفاده قرار گیرد.",
          time: "11:52"
        },
        {
          text: "وابگوی سوالات پیوسته اهل دنیای موجود طراحی اساسا مورد استفاده قرار گیرد.",
          time: "12:00"
        }
      ]
    },
  ]
  interface User {
    id: number,
    pfp: string,
    name: string,
    connectionStatus: "good" | "medium" | "bad",
    isRoomAdmin: boolean
  }
  const users = [
    {
      id: 1,
      pfp: "/rodeocover.png",
      name: "mamad",
      connectionStatus: "good",
      isRoomAdmin: true
    },
    {
      id: 2,
      pfp: "/rodeocover.png",
      name: "mamad",
      connectionStatus: "medium",
      isRoomAdmin: true
    },
    {
      id: 2,
      pfp: "/rodeocover.png",
      name: "mamad",
      connectionStatus: "bad",
      isRoomAdmin: false
    },
  ] as User[]

  const closeModals = () => {
    setSettingsModalOpen(false)
    setUsersModalOpen(false)
    setMediaTypeModalOpen(false)
  }

  return (
    <div className='room-page'>
      <div className='room-page__side-bar'>
        <div className='room-page__side-bar__item'>
          <button className='room-page__side-bar__item__settings' onClick={() => setSettingsModalOpen(true)}>
            <AiTwotoneSetting />
          </button>
          <span>تنظیمات</span>
        </div>

        <div className='room-page__side-bar__item'>
          <button className='room-page__side-bar__microphone'>
            <BsMicFill />
          </button>
          <span>میکروفون</span>
        </div>

        <div className='room-page__side-bar__item'>
          <button className='room-page__side-bar__microphone' onClick={() => setUsersModalOpen(true)}>
            <BsFillPeopleFill />
          </button>
          <span>کاربران</span>
        </div>

        <div className='room-page__side-bar__item'>
          <button className='room-page__side-bar__share'>
            <BsFillShareFill />
          </button>
          <span>دعوت</span>
        </div>

        <div className='room-page__side-bar__item'>
          <button className='room-page__side-bar__exit'>
            <IoExitOutline />
          </button>
          <span>خروج</span>
        </div>
      </div>

      <div className='room-page__main'>
        <div className='room-page__main__top'>
          <button className='room-page__main__top__submit'>ثبت</button>
          <input type="text" placeholder='لینک مورد نظر را وارد کنید .' dir='ltr' />
          <button className='room-page__main__top__choose' onClick={() => setMediaTypeModalOpen(true)}>انتخاب حالت پخش</button>
        </div>

        <div className='room-page__main__player'></div>
      </div>

      <div className='room-page__chat-container'>
        <div className='room-page__chat-container__head'>
          <p>چت آنلاین</p>
          <span>
            <IoChatbubblesSharp />
          </span>
        </div>

        <div className='room-page__chat-container__chat-main'>
          {
            messageBlocks.map((block, ind) => (
              <div className={clsx('room-page__chat-container__message-block', block.from.id === currentUserId && "outgoing")} key={`chatblockfrom${block.from.id}ind${ind}`}>
                <div className='room-page__chat-container__message-block__messages'>
                  {
                    block.messages.map((mess, ind) => (
                      <div className='room-page__chat-container__message-block__messages__message'>
                        <span className='room-page__chat-container__message-block__messages__message__text'>{mess.text}</span>
                        <span className='room-page__chat-container__message-block__messages__message__time'>{mess.time}</span>
                      </div>
                    ))
                  }
                </div>

                <img src={block.from.pfp} alt="profile picture" />
              </div>
            ))
          }
        </div>

        <div className='room-page__chat-container__foot'>
          <button>
            <FaArrowRight />
          </button>
          <div className='room-page__chat-container__foot__input'>
            <button>
              <TbSticker />
            </button>
            {/* <input type="text" /> */}
            <textarea name="" id=""></textarea>
          </div>
        </div>
      </div>


      {/* MODAL */}
      <div className={clsx("room-page__modal-overlay", settingsModalOpen || usersModalOpen || mediaTypeModalOpen ? "is-active" : "")} onClick={closeModals}>
        <div className="room-page__modal-overlay__modal" onClick={(e) => e.stopPropagation()}>
          <SettingsModal isOpen={settingsModalOpen} />
        </div>

        <div className="room-page__modal-overlay__modal" onClick={(e) => e.stopPropagation()}>
          <UsersModal isOpen={usersModalOpen} users={users} />
        </div>

        <div className="room-page__modal-overlay__modal" onClick={(e) => e.stopPropagation()}>
          <MediaTypeModal isOpen={mediaTypeModalOpen} closeModal={() => setMediaTypeModalOpen(false)} openArchive={() => setArchiveModalOpen(true)} />
        </div>
      </div>
    </div>
  )
}

export default RoomPage