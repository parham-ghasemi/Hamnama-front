import { BsFillGearFill, BsGiftFill, BsXLg } from 'react-icons/bs';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import clsx from 'clsx';
import './UsernameDropdown.scss';
import { PiUserFill } from 'react-icons/pi';
import { useConfirmationModal } from '../../../context/ConfirmModalContext/ConfirmaModalContext';
import { toast } from '../../toast';
import { FaUserLock } from 'react-icons/fa6';
import { TbCheck, TbCopy, TbLink, TbRefresh } from 'react-icons/tb';
import { useEffect, useState, type MouseEvent } from 'react';
import { userApi } from '../../../apiCalls/userApi';

const buildInviteLink = (token: string) =>
  `${window.location.origin}/auth?invite=${encodeURIComponent(token)}`;

// Accept isOpen as a prop
const UsernameDropdown = ({ isOpen }: { isOpen: boolean }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [inviteLink, setInviteLink] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteRefreshing, setInviteRefreshing] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  const loadInvite = async () => {
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

  const handleInviteClick = () => {
    if (!inviteOpen && !inviteLink && !inviteLoading) {
      void loadInvite();
    }

    setInviteOpen((current) => !current);
  };

  const handleCopyInvite = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      window.setTimeout(() => setInviteCopied(false), 1500);
    } catch (error) {
      console.error('Copy invite link failed', error);
      toast.error('کپی لینک انجام نشد');
    }
  };

  const handleRefreshInvite = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setInviteRefreshing(true);

    try {
      const { data } = await userApi.refreshInvite();
      setInviteLink(buildInviteLink(data.token));
      setInviteCopied(false);
      toast.success('لینک دعوت جدید ساخته شد');
    } catch (error) {
      console.error('Failed to refresh invite link', error);
      toast.error('خطا در ساخت لینک دعوت جدید');
    } finally {
      setInviteRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setInviteOpen(false);
      setInviteCopied(false);
    }
  }, [isOpen]);

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
              className={clsx('username-dropdown__body__invite-trigger', inviteOpen && 'is-open')}
              onClick={handleInviteClick}
            >
              <BsGiftFill />
              <span>دعوت از دوستان</span>
            </li>
          </ul>

          {inviteOpen && (
            <div
              className="username-dropdown__invite"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="username-dropdown__invite__label">
                <TbLink />
                <span>لینک دعوت شخصی شما</span>
              </div>

              <div className="username-dropdown__invite__link">
                <span dir="ltr">
                  {inviteLoading ? 'در حال دریافت لینک...' : inviteLink || 'لینک در دسترس نیست'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  disabled={!inviteLink || inviteLoading || inviteRefreshing}
                  aria-label="کپی لینک دعوت"
                  title={inviteCopied ? 'کپی شد' : 'کپی لینک'}
                >
                  {inviteCopied ? <TbCheck /> : <TbCopy />}
                </button>
              </div>

              <button
                type="button"
                className="username-dropdown__invite__refresh"
                onClick={handleRefreshInvite}
                disabled={inviteLoading || inviteRefreshing}
              >
                <TbRefresh className={inviteRefreshing ? 'is-spinning' : ''} />
                <span>{inviteRefreshing ? 'در حال ساخت...' : 'ساخت لینک جدید'}</span>
              </button>

              <p className="username-dropdown__invite__tip">
                با ساخت لینک جدید، لینک قبلی دیگر معتبر نخواهد بود.
              </p>
            </div>
          )}
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
