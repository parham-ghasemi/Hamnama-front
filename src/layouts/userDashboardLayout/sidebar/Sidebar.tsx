import React, { useEffect, useRef, useState } from 'react';
import './Sidebar.scss';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHourglassHalf } from 'react-icons/fa';
import { toast } from '../../../components/toast';
import { useAuth } from '../../../context/AuthContext';
import { useConfirmationModal } from '../../../context/ConfirmModalContext/ConfirmaModalContext';

// Add props interface
interface SidebarProps {
  onClose?: () => void;
}

interface SidebarItem {
  text: string;
  link: string;
  disabled: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const nav = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const [noticeIndex, setNoticeIndex] = useState<number | null>(null);
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const items: SidebarItem[] = [
    { text: 'اطلاعات کاربر', link: '/user/info', disabled: false },
    { text: 'تیکت ها', link: '/user/ticket', disabled: false },
    { text: 'رتبه بندی', link: '/user/leaderboard', disabled: false },
    { text: 'پرداخت ها', link: '/user/payments', disabled: false },
    { text: 'مدیریت اعضا', link: '/user/plan-users', disabled: !user?.current_plan },
  ];

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current);
      }
    };
  }, []);

  const showDisabledNotice = (index: number) => {
    setNoticeIndex(index);

    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
    }

    noticeTimeoutRef.current = setTimeout(() => {
      setNoticeIndex(null);
    }, 2400);
  };

  const handleNav = (item: SidebarItem, index: number) => {
    if (item.disabled) {
      showDisabledNotice(index);
      return;
    }

    nav(item.link);

    if (onClose) onClose(); // Close the mobile sidebar on navigation
  };

  const confirmLogout = () => {
    logout();
    toast.success('با موفقیت از حساب کاربری خارج شدید');
    nav('/');

    if (onClose) onClose(); // Also close sidebar if on mobile
  };

  const { openConfirmation } = useConfirmationModal();

  const handleOpenConfirm = () => {
    openConfirmation({
      onConfirm: confirmLogout,
      title: 'خروج از حساب',
      body: 'آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟',
      primaryButtonText: 'خروج',
      secondaryButtonText: 'انصراف',
      primaryButtonClasses: 'user-sidebar__logout__modal-btn',
    });
  };

  return (
    <div className="user-sidebar">
      <span className="user-sidebar__filmstrip" aria-hidden="true" />

      <ul>
        {items.map((item, ind) => {
          const isActive = location.pathname.startsWith(item.link);
          const isShowingNotice = noticeIndex === ind;

          return (
            <li
              key={`usersidebarind-${ind}`}
              className={[
                'user-sidebar__item',
                isActive ? 'active' : '',
                item.disabled ? 'disabled' : '',
                isShowingNotice ? 'show-notice' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleNav(item, ind)}
              aria-disabled={item.disabled}
            >
              <span className="user-sidebar__item-label">{item.text}</span>

              {item.disabled && (
                <span className="user-sidebar__item-notice" aria-hidden="true">
                  <FaHourglassHalf className="user-sidebar__item-notice-icon" />
                  <span className="user-sidebar__item-notice-text">
                    {item.link === '/user/plan-users' ? 'ابتدا یک پلن فعال بگیرید' : 'این صفحه در حال ساخت است'}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="user-sidebar__sep" />

      <div className="user-sidebar__logout" onClick={handleOpenConfirm}>
        خروج از حساب
      </div>
    </div>
  );
};

export default Sidebar;