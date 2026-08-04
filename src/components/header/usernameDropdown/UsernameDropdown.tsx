import { BsFillGearFill, BsGiftFill, BsXLg } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import clsx from 'clsx';
import './UsernameDropdown.scss';
import { PiUserFill } from 'react-icons/pi';
import { toast } from 'sonner';
import { useConfirmationModal } from '../../../context/ConfirmModalContext/ConfirmaModalContext';

// Accept isOpen as a prop
const UsernameDropdown = ({ isOpen }: { isOpen: boolean }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const bodyItems = [
    {
      icon: <BsFillGearFill />,
      title: "حساب کاربری",
      onClick: () => navigate('/user/info')
    },
    {
      icon: <BsGiftFill />,
      title: "دعوت از دوستان",
      onClick: () => { }
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

  return (
    <>
      {/* Conditionally add the open class */}
      <div className={clsx('username-dropdown', isOpen && 'username-dropdown--open')}>
        <div className='username-dropdown__header'>
          <p>اشتراک ندارید</p>
          <button>خرید اشتراک</button>
        </div>

        <div className='username-dropdown__body'>
          <div className='username-dropdown__body__username'>
            <div className='username-dropdown__body__username__photo'>
              {
                user?.profile_picture ? (
                  <img src={`${import.meta.env.VITE_BASE_URL}${user?.profile_picture}`} alt="profile picture" />
                ) : (
                  <PiUserFill />
                )
              }
            </div>
            <span>
              {user?.username}
            </span>
          </div>
          <ul>
            {
              bodyItems.map((item, ind) => (
                <li
                  key={`headerdropdownbodyind${ind}`}
                  onClick={item.onClick}
                >
                  {item.icon}
                  {item.title}
                </li>
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