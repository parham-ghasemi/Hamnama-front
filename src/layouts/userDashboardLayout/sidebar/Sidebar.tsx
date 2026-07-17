import './Sidebar.scss'
import { useNavigate, useLocation } from "react-router-dom"
import { toast } from 'sonner'; // Keep consistent with your existing toast library
import { useAuth } from '../../../context/AuthContext';

const Sidebar = () => {
  const nav = useNavigate()
  const location = useLocation() // Get the current URL location object
  const { logout } = useAuth() // Get the logout function from context

  const items = [
    { text: "اطلاعات کاربر", link: "/user/info" },
    { text: "پرداخت ها", link: "/user/payments" },
    { text: "تیکت", link: "/user/ticket" },
    { text: "رتبه بندی", link: "/user/leaderboard" },
    { text: "مدیریت اعضا", link: "/user/plan-users" },
  ]

  const handleLogout = () => {
    logout(); // Clears token from localStorage and resets global user state
    toast.success('با موفقیت از حساب کاربری خارج شدید');
    nav('/'); // Redirect to home page
  }

  return (
    <div className="user-sidebar">
      <ul>
        {
          items.map((item, ind) => {
            const isActive = location.pathname.startsWith(item.link)

            return (
              <li
                key={`usersidebarind-${ind}`}
                className={`user-sidebar__item ${isActive ? 'active' : ''}`}
                onClick={() => nav(item.link)}
              >
                {item.text}
              </li>
            )
          })
        }
      </ul>

      <div className="user-sidebar__sep" />

      {/* Added onClick handler for logout */}
      <div className="user-sidebar__logout" onClick={handleLogout}>
        خروج از حساب
      </div>
    </div>
  )
}

export default Sidebar