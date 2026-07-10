import './Sidebar.scss'
import { useNavigate, useLocation } from "react-router-dom"

const Sidebar = () => {
  const nav = useNavigate()
  const location = useLocation() // Get the current URL location object

  const items = [
    { text: "اطلاعات کاربر", link: "/user/info" },
    { text: "پرداخت ها", link: "/user/payments" },
    { text: "تیکت", link: "/user/ticket" },
    { text: "رتبه بندی", link: "/user/leaderboard" },
    { text: "مدیریت اعضا", link: "/user/plan-users" },
  ]

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

      <div className="user-sidebar__logout"> خروج از حساب </div>
    </div>
  )
}

export default Sidebar