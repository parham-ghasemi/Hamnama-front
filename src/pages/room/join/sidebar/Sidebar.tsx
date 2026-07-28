import { useState } from 'react';
import clsx from 'clsx';
import './Sidebar.scss';
import { BsPlayBtnFill, BsChevronLeft, BsPeopleFill } from 'react-icons/bs';
import { AiTwotoneApi } from "react-icons/ai";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const users = [
    { name: "parham", pfp: "/rodeocover.png", isOnline: true, isInOtherRoom: true },
    { name: "ali", pfp: "/rodeocover.png", isOnline: false, isInOtherRoom: false },
    { name: "mamad", pfp: "/rodeocover.png", isOnline: true, isInOtherRoom: false },
    { name: "kasraa", pfp: "/rodeocover.png", isOnline: true, isInOtherRoom: true },
  ];

  return (
    <>
      {/* Dimmed backdrop when open on mobile */}
      <div
        className={clsx("join-sidebar-backdrop", isOpen && "open")}
        onClick={() => setIsOpen(false)}
      />

      <div className={clsx('join-sidebar', isOpen && 'open')}>
        {/* Toggle Button (Sticks out on the left edge in mobile) */}
        <button
          className={clsx("join-sidebar__toggle", isOpen && 'open')}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle subscribers"
        >
          <BsChevronLeft className={clsx("toggle-arrow", isOpen && "rotated")} />
          <BsPeopleFill className="toggle-icon" />
        </button>

        {/* Inner Scrollable Container */}
        <div className="join-sidebar__inner">
          <h4>لیست مشترکین</h4>

          <ul>
            {users.map((item, ind) => (
              <li key={`subedusersind${ind}`}>
                <span className='join-sidebar__img'>
                  <img className={clsx(item.isOnline && 'online')} src={item.pfp} alt={`${item.name}'s profile picture`} />
                </span>
                <p>{item.name}</p>

                <span className='join-sidebar__icon'>
                  {item.isOnline && item.isInOtherRoom ? (<BsPlayBtnFill />) : item.isOnline ? (<span />) : (<AiTwotoneApi />)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default Sidebar;