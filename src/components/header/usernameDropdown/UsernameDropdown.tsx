import { BsFillGearFill, BsGiftFill, BsXLg } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import clsx from 'clsx'; // <-- Make sure to import clsx
import './UsernameDropdown.scss';
import { PiUserFill } from 'react-icons/pi';

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
      title: "حساب کاربری",
      onClick: () => { }
    },
  ];

  return (
    // Conditionally add the open class
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
          onClick={logout}
        >
          <BsXLg />
          <span>خروج</span>
        </div>
      </div>
    </div>
  )
}

export default UsernameDropdown;