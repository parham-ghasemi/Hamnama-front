import './Header.scss';
import { PiCaretRightBold, PiMoonStarsFill, PiSunFill, PiUserFill } from "react-icons/pi";
import clsx from 'clsx';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { setTheme, isLight } = useTheme();
  const { user, isAuthenticated } = useAuth(); // Get user and auth status from context
  const nav = useNavigate();

  return (
    <div className="header">
      <Link to={`/`} className="header__logo">
        <img src="/Logo.svg" alt="" />
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
            <div className="header__left__user__profile" onClick={() => nav('/user/info')}>
              <p className="header__left__user__profile__name">{user?.username}</p>
              <div className="header__left__user__profile__photo">
                <PiUserFill />
              </div>
            </div>
          ) : (
            // Navigates to the authentication page
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