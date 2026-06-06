import { useState } from 'react';
import './Header.scss';
import { PiCaretRightBold, PiMoonStarsFill, PiSunFill, PiUserFill } from "react-icons/pi";
import clsx from 'clsx';

const Header = () => {
  const [activeMode, setActiveMode] = useState('dark');
  const [isLogedin, setIsLogedin] = useState(false);

  return (
    <div className="header">
      <div className="header__logo">
        <img src="/Logo.svg" alt="" />
      </div>

      <div className="header__left">
        <button className="header__left__watchbtn">
          <PiCaretRightBold className='header__left__watchbtn__Icon' />
          <p className='header__left_watchbtn__text'>
            شروع به تماشا
          </p>
        </button>

        <div className="header__left__user">
          {isLogedin ? (
            <div className="header__left__user__profile" onClick={() => setIsLogedin(false)}>
              <p className="header__left__user__profile__name">username</p>
              <div className="header__left__user__profile__photo">
                <PiUserFill />
              </div>
            </div>
          ) : (
            <button className='header__left__user__loginbtn' onClick={() => setIsLogedin(true)}>ورود</button>
          )}
        </div>

        <div className="header__left__mode">
          <div className={clsx("header__left__mode__slider", activeMode === "light" ? "header__left__mode__slider--light" : "header__left__mode__slider--dark")} />

          <div className="header__left__mode__icon" onClick={() => setActiveMode("dark")} >
            <PiMoonStarsFill />
          </div>

          <div className="header__left__mode__icon" onClick={() => setActiveMode("light")} >
            <PiSunFill />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header