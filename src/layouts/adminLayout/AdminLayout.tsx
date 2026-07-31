import { NavLink, Outlet } from 'react-router-dom';
import { FiLayout, FiMessageSquare, FiUsers, FiMonitor, FiSettings } from 'react-icons/fi';
import Header from '../../components/header/Header';
import './AdminLayout.scss';

const navItems = [
  { to: '/admin/dashboard', label: 'داشبورد', icon: FiLayout },
  { to: '/admin/tickets', label: 'تیکت‌ها', icon: FiMessageSquare },
  { to: '/admin/users', label: 'کاربران', icon: FiUsers },
  { to: '/admin/rooms', label: 'اتاق‌ها', icon: FiMonitor },
  { to: '/admin/settings', label: 'تنظیمات', icon: FiSettings },
];

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <Header />

      <div className="admin-layout__shell">
        <aside className="admin-layout__shell__sidebar">
          <div className="admin-layout__shell__sidebar__brand">
            <p>پنل مدیریت</p>
            <span>hamnama</span>
          </div>

          <nav className="admin-layout__shell__sidebar__nav">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `admin-layout__shell__sidebar__nav__item ${isActive ? 'is-active' : ''}`}>
                <Icon />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="admin-layout__shell__content">
          <div className="admin-layout__shell__content__inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
