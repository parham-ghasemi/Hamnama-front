import './Header.scss';
import { PiCaretRightBold, PiMoonStarsFill, PiSunFill, PiUserFill, PiListBold } from "react-icons/pi";
import clsx from 'clsx';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import UsernameDropdown from './usernameDropdown/UsernameDropdown';

// Add the optional prop
interface HeaderProps {
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { setTheme, isLight } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Check if we are inside the user dashboard
  const isDashboard = location.pathname.startsWith('/user');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="header">
      {/* Wrapped Logo and Hamburger in a right-side container */}
      <div className="header__right">
        {isDashboard && (
          <button className="header__hamburger" onClick={onMenuClick} aria-label="Open Sidebar">
            <PiListBold />
          </button>
        )}
        <Link to={`/`} className="header__logo">
          <img src="/Logo.svg" alt="Logo" />
        </Link>
      </div>

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
            className={clsx("header__left__theme-btn__icon", "header__left__theme-btn__icon--moon", isLight && "is-hidden")}
          />
          <PiSunFill
            className={clsx("header__left__theme-btn__icon", "header__left__theme-btn__icon--sun", isLight && "is-visible")}
          />
        </button>
      </div>
    </div>
  )
}

export default Header;