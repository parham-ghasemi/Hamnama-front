import { BsFillGearFill, BsGiftFill, BsXLg } from 'react-icons/bs';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import clsx from 'clsx';
import './UsernameDropdown.scss';
import { PiUserFill } from 'react-icons/pi';
import { useConfirmationModal } from '../../../context/ConfirmModalContext/ConfirmaModalContext';
import { toast } from '../../toast';
import { FaUserLock } from 'react-icons/fa6';
import { TbRefresh } from 'react-icons/tb';
import { useEffect, useState, type MouseEvent } from 'react';
import { userApi } from '../../../apiCalls/userApi';

const buildInviteLink = (token: string) =>
  `${window.location.origin}/auth?invite=${encodeURIComponent(token)}`;

// Accept isOpen as a prop
const UsernameDropdown = ({ isOpen }: { isOpen: boolean }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteRefreshing, setInviteRefreshing] = useState(false);

  const handleInviteClick = async () => {
    if (!inviteLink) {
      toast.error('لینک دعوت هنوز آماده نیست');
      return;
    }

    const shareData = {
      title: 'دعوت به هم‌نما',
      text: `${user?.username ?? 'یک دوست'} از شما دعوت کرده به هم‌نما بپیوندید.`,
      url: inviteLink,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(inviteLink);
      toast.success('لینک دعوت کپی شد');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;

      console.error('Share invite link failed', error);
      toast.error('اشتراک‌گذاری لینک دعوت انجام نشد');
    }
  };

  const handleRefreshInvite = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (inviteRefreshing) return;
    setInviteRefreshing(true);

    try {
      const { data } = await userApi.refreshInvite();
      setInviteLink(buildInviteLink(data.token));
      toast.success('لینک دعوت جدید ساخته شد');
    } catch (error) {
      console.error('Failed to refresh invite link', error);
      toast.error('خطا در ساخت لینک دعوت جدید');
    } finally {
      setInviteRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isOpen || inviteLink || inviteLoading) return;

    const fetchInvite = async () => {
      setInviteLoading(true);

      try {
        const { data } = await userApi.getInvite();
        setInviteLink(buildInviteLink(data.token));
      } catch (error) {
        console.error('Failed to load invite link', error);
        toast.error('خطا در دریافت لینک دعوت');
      } finally {
        setInviteLoading(false);
      }
    };

    void fetchInvite();
  }, [isOpen, inviteLink, inviteLoading]);

  const bodyItems = [
    {
      icon: <BsFillGearFill />,
      title: "حساب کاربری",
      onClick: () => navigate('/user/info')
    },
    ...(user?.is_admin
      ? [{
        icon: <FaUserLock />,
        title: "پنل ادمین",
        onClick: () => navigate('/admin/dashboard')
      }]
      : []),
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
                <li
                  key={`headerdropdownbodyind${ind}`}
                  onClick={item.onClick}
                >
                  {item.icon}
                  {item.title}
                </li>
              ))
            }

            <li
              onClick={handleInviteClick}
              title={inviteLoading ? 'در حال آماده‌سازی لینک دعوت' : 'اشتراک‌گذاری لینک دعوت'}
            >
              <BsGiftFill />
              <span>دعوت از دوستان</span>

              <button
                type="button"
                className="username-dropdown__body__invite-refresh"
                onClick={handleRefreshInvite}
                disabled={inviteRefreshing}
                aria-label="ساخت لینک دعوت جدید"
                title="ساخت لینک دعوت جدید"
              >
                <TbRefresh className={inviteRefreshing ? 'is-spinning' : ''} />
              </button>
            </li>
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
