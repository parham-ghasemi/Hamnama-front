import { BsFillGearFill, BsGiftFill, BsXLg } from 'react-icons/bs';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import clsx from 'clsx';
import './UsernameDropdown.scss';
import { PiUserFill } from 'react-icons/pi';
import { useConfirmationModal } from '../../../context/ConfirmModalContext/ConfirmaModalContext';
import { toast } from '../../toast';
import { FaUserLock } from 'react-icons/fa6';
import AdminRoute from '../../adminRoute/AdminRoute';

// Accept isOpen as a prop
const UsernameDropdown = ({ isOpen }: { isOpen: boolean }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminDashboard = location.pathname.startsWith('/admin');

  const bodyItems = [
    {
      icon: <BsFillGearFill />,
      title: "حساب کاربری",
      onClick: () => navigate('/user/info')
    },
    {
      icon: <BsGiftFill />,
      title: "دعوت از دوستان",
      onClick: () => { shareInvite() }
    },
    {
      icon: <FaUserLock />,
      title: "پنل ادمین",
      onClick: () => navigate('/admin/dashboard')
    },
  ];

  const confirmLogout = () => {
    logout();
    toast.success('با موفقیت از حساب کاربری خارج شدید');
    navigate('/');
  };

  const { openConfirmation } = useConfirmationModal();

  const handleOpenConfirm = () => {
    openConfirmation({
      onConfirm: confirmLogout,
      title: "خروج از حساب",
      body: "آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟",
      primaryButtonText: "خروج",
      secondaryButtonText: "انصراف",
      primaryButtonClasses: 'dropdown-logout',
    })
  }

  async function shareInvite() {
    const inviteUrl = `https://hamnama.net/invite/${user?.id}`;

    try {
      await navigator.share({
        title: "همنما",
        text: "بیا با هم فیلم ببینیم!",
        url: inviteUrl,
      });
    } catch (error) {
      console.log("Share cancelled or failed", error);
    }
  }

  return (
    <>
      {/* Conditionally add the open class */}
      <div className={clsx('username-dropdown', isOpen && 'username-dropdown--open')}>
        <span className="username-dropdown__sprockets" aria-hidden="true" />

        <div className='username-dropdown__header'>
          <p>اشتراک ندارید</p>
          <button>خرید اشتراک</button>
        </div>

        <div className='username-dropdown__body'>
          <Link to={'/user/info'} className='username-dropdown__body__username'>
            <div className='username-dropdown__body__username__photo'>
              {
                user?.profile_picture ? (
                  <img src={`${import.meta.env['VITE_BASE_URL']}${user?.profile_picture}`} alt="profile picture" />
                ) : (
                  <PiUserFill />
                )
              }
            </div>
            <span>
              {user?.username}
            </span>
          </Link>
          <ul>
            {
              bodyItems.map((item, ind) => (
                item.title === "پنل ادمین" && !isAdminDashboard ? (
                  <AdminRoute>
                    <li
                      key={`headerdropdownbodyind${ind}`}
                      onClick={item.onClick}
                    >
                      {item.icon}
                      {item.title}
                    </li>
                  </AdminRoute>
                ) : (
                  <li
                    key={`headerdropdownbodyind${ind}`}
                    onClick={item.onClick}
                  >
                    {item.icon}
                    {item.title}
                  </li>
                )
              ))
            }
          </ul>
        </div>

        <div className='username-dropdown__footer'>
          <div
            className='username-dropdown__footer__exit'
            onClick={handleOpenConfirm}
          >
            <BsXLg />
            <span>خروج</span>
          </div>
        </div>
      </div>
    </>
  )
}

export default UsernameDropdown;
