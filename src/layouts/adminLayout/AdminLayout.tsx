import { NavLink, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FiLayout,
  FiMessageSquare,
  FiUsers,
  FiMonitor,
  FiSettings,
  FiMessageCircle,
  FiArchive,
  FiCreditCard,
} from 'react-icons/fi';
import Header from '../../components/header/Header';
import { useAdminAccess } from '../../components/adminRoute/AdminAccessContext';
import { adminApi } from '../../apiCalls/adminApi';
import './AdminLayout.scss';

const navItems = [
  { to: '/admin/dashboard', label: 'داشبورد', icon: FiLayout, minLevel: 1 },
  { to: '/admin/tickets', label: 'تیکت‌ها', icon: FiMessageSquare, minLevel: 1 },
  { to: '/admin/support', label: 'گفتگوهای پشتیبانی', icon: FiMessageCircle, minLevel: 1 },
  { to: '/admin/users', label: 'کاربران', icon: FiUsers, minLevel: 2 },
  { to: '/admin/rooms', label: 'اتاق‌ها', icon: FiMonitor, minLevel: 3 },
  { to: '/admin/settings', label: 'تنظیمات', icon: FiSettings, minLevel: 2 },
  { to: '/admin/archive', label: 'مدیریت آرشیو', icon: FiArchive, minLevel: 3 },
  { to: '/admin/plan-payments', label: 'پلن‌ها و پرداخت‌ها', icon: FiCreditCard, minLevel: 3 },
];

const AdminLayout = () => {
  const { accessLevel } = useAdminAccess();
  const { data: notifications } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => adminApi.getNotifications().then((res) => res.data),
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const hasTicketNotifications = (notifications?.tickets_needing_response ?? 0) > 0;
  const hasSupportNotifications = (notifications?.support_needing_response ?? 0) > 0;

  return (
    <div className="admin-layout">
      <Header />

      <div className="admin-layout__shell">
        <aside className="admin-layout__sidebar">
          <div className="admin-layout__brand">
            <p>پنل مدیریت</p>
            <span>hamnama</span>
          </div>

          <nav className="admin-layout__nav">
            {navItems.filter(item => accessLevel >= item.minLevel).map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `admin-layout__nav__item ${isActive ? 'is-active' : ''}`
                }
              >
                <Icon aria-hidden />
                <span>{label}</span>
                {to === '/admin/tickets' && hasTicketNotifications ? (
                  <span className="admin-layout__nav__item__indicator" aria-label="پاسخ جدید در تیکت‌ها" />
                ) : null}
                {to === '/admin/support' && hasSupportNotifications ? (
                  <span className="admin-layout__nav__item__indicator" aria-label="پیام جدید در پشتیبانی" />
                ) : null}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="admin-layout__content">
          <div className="admin-layout__content__inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;