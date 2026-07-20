import './Header.scss';
import { PiCaretRightBold, PiMoonStarsFill, PiSunFill, PiUserFill } from "react-icons/pi";
import clsx from 'clsx';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import UsernameDropdown from './usernameDropdown/UsernameDropdown';

const Header: React.FC = () => {
  const { setTheme, isLight } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const nav = useNavigate();

  // Explicitly type state as boolean
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Type the reference specifically as an HTMLDivElement
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Type the event as a standard DOM MouseEvent
    const handleClickOutside = (event: MouseEvent) => {
      // event.target is an EventTarget, we need to cast it to Node for .contains()
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="header">

      <Link to={`/`} className="header__logo">
        <img src="/Logo.svg" alt="Logo" />
      </Link>

      <div className="header__left">
        <button className="header__left__watchbtn" onClick={() => nav('/join-room')}>
          <PiCaretRightBold className='header__left__watchbtn__Icon' style={{ strokeWidth: 10 }} />
          <p className='header__left_watchbtn__text'>
            شروع به تماشا
          </p>
        </button>

        <div className="header__left__user">
          {isAuthenticated ? (
            <div
              className="header__left__user__profile"
              ref={profileRef}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <p className="header__left__user__profile__name">{user?.username}</p>
              <div className="header__left__user__profile__photo">
                <PiUserFill />
              </div>
              <div
                className="header__left__user__profile__dropdown"
                // Type the React MouseEvent to be strictly safe
                onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
              >
                <UsernameDropdown isOpen={isDropdownOpen} />
              </div>
            </div>
          ) : (
            <button className='header__left__user__loginbtn' onClick={() => nav('/auth')}>
              ورود | ثبت نام
            </button>
          )}
        </div>

        <button
          className={clsx(
            "header__left__theme-btn",
            isLight && "header__left__theme-btn--light"
          )}
          onClick={() => setTheme(isLight ? "dark" : "light")}
          aria-label="Toggle theme"
        >
          <PiMoonStarsFill
            className={clsx(
              "header__left__theme-btn__icon",
              "header__left__theme-btn__icon--moon",
              isLight && "is-hidden"
            )}
          />

          <PiSunFill
            className={clsx(
              "header__left__theme-btn__icon",
              "header__left__theme-btn__icon--sun",
              isLight && "is-visible"
            )}
          />
        </button>
      </div>
    </div>
  )
}

export default Header;