import React from 'react';
import './Sidebar.scss';
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from 'sonner';
import { useAuth } from '../../../context/AuthContext';
import { useConfirmationModal } from '../../../context/ConfirmModalContext/ConfirmaModalContext';

// Add props interface
interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const nav = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const items = [
    { text: "اطلاعات کاربر", link: "/user/info" },
    { text: "پرداخت ها", link: "/user/payments" },
    { text: "تیکت", link: "/user/ticket" },
    { text: "رتبه بندی", link: "/user/leaderboard" },
    { text: "مدیریت اعضا", link: "/user/plan-users" },
  ];

  const confirmLogout = () => {
    logout();
    toast.success('با موفقیت از حساب کاربری خارج شدید');
    nav('/');
    if (onClose) onClose(); // Also close sidebar if on mobile
  };

  const handleNav = (link: string) => {
    nav(link);
    if (onClose) onClose(); // Close the mobile sidebar on navigation
  };

  const { openConfirmation } = useConfirmationModal();

  const handleOpenConfirm = () => {
    openConfirmation({
      onConfirm: confirmLogout,
      title: "خروج از حساب",
      body: "آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟",
      primaryButtonText: "خروج",
      secondaryButtonText: "انصراف",
      primaryButtonClasses: 'user-sidebar__logout__modal-btn',
    })
  }

  return (
    <div className="user-sidebar">
      <span className="user-sidebar__filmstrip" aria-hidden="true" />

      <ul>
        {
          items.map((item, ind) => {
            const isActive = location.pathname.startsWith(item.link);

            return (
              <li
                key={`usersidebarind-${ind}`}
                className={`user-sidebar__item ${isActive ? 'active' : ''}`}
                onClick={() => handleNav(item.link)}
              >
                {item.text}
              </li>
            );
          })
        }
      </ul>

      <div className="user-sidebar__sep" />

      <div className="user-sidebar__logout" onClick={handleOpenConfirm}>
        خروج از حساب
      </div>
    </div>
  );
};

export default Sidebar;
