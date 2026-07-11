import clsx from 'clsx';
import './Sidebar.scss';
import { BsPlayBtnFill } from 'react-icons/bs';
import { AiTwotoneApi } from "react-icons/ai";


const Sidebar = () => {
  const users = [
    { name: "parham", pfp: "/rodeocover.png", isOnline: true, isInOtherRoom: true },
    { name: "ali", pfp: "/rodeocover.png", isOnline: false, isInOtherRoom: false },
    { name: "mamad", pfp: "/rodeocover.png", isOnline: true, isInOtherRoom: false },
    { name: "kasraa", pfp: "/rodeocover.png", isOnline: true, isInOtherRoom: true },
  ]

  return (
    <div className='join-sidebar'>
      <h4>لیست مشترکین</h4>

      <ul>
        {
          users.map((item, ind) => (
            <li key={`subedusersind${ind}`}>
              <span className='join-sidebar__img'>
                <img className={clsx(item.isOnline && 'online')} src={item.pfp} alt={`${item.name}'s profile picture`} />
              </span>
              <p>{item.name}</p>

              <span className='join-sidebar__icon'>
                {item.isOnline && item.isInOtherRoom ? (<BsPlayBtnFill />) : item.isOnline ? (<span />) : (<AiTwotoneApi />)}
              </span>
            </li>
          ))
        }
      </ul>
    </div>
  )
}

export default Sidebar