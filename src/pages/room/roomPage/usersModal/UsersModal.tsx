import clsx from 'clsx';
import './UsersModal.scss';
import { BsFillPersonFill, BsPeopleFill, BsPersonCheckFill } from 'react-icons/bs';
import { FaChevronDown } from 'react-icons/fa6';
import { useState } from 'react';
import { IoWifi } from 'react-icons/io5';

interface User {
  id: number,
  pfp: string,
  name: string,
  connectionStatus: "good" | "medium" | "bad",
  isRoomAdmin: boolean
}

const UsersModal = ({ isOpen, users }: { isOpen: boolean, users: User[] }) => {
  const [openRoleInd, setOpenRoleInd] = useState<null | number>(null)

  return (
    <div className={clsx('room-users-modal', isOpen && 'open')}>
      <div className="room-users-modal__head">
        <span>لیست کاربران</span>
        <BsPeopleFill />
      </div>

      <div className="room-users-modal__body">
        {
          users.map((user, ind) => (
            <div className="room-users-modal__body__card" key={`roomuserslistind${ind}`}>
              <div className="room-users-modal__body__card__profile">
                <img src={user.pfp} alt="profile picture" />
                <p>{user.name}</p>
              </div>

              <div className="room-users-modal__body__card__body">
                <div className={clsx("room-users-modal__body__card__body__connection", user.connectionStatus === "good" ? 'good' : user.connectionStatus === "bad" ? "bad" : "medium")}>
                  <span>
                    <IoWifi />
                  </span>
                  <p>
                    {
                      user.connectionStatus === "good" ? 'عالی' : user.connectionStatus === "bad" ? "ضعیف" : "متوسط"
                    }
                  </p>
                </div>

                <div className={clsx("room-users-modal__body__card__body__role", openRoleInd === ind && 'open')}>
                  <div className={clsx("room-users-modal__body__card__body__role__trigger", user.id === 1 && 'current', !user.isRoomAdmin && 'normal')} onClick={() => setOpenRoleInd(prev => prev === ind ? null : user.id !== 1 ? ind : null)}>
                    <span>
                      {
                        user.isRoomAdmin ? <BsPersonCheckFill /> : <BsFillPersonFill />
                      }
                    </span>
                    <p>{user.isRoomAdmin ? "کاربر ادمین" : "کاربر عادی"}</p>
                    <FaChevronDown />
                  </div>

                  <div className="room-users-modal__body__card__body__role__drop-down">
                    <span>
                      {
                        !user.isRoomAdmin ? <BsPersonCheckFill /> : <BsFillPersonFill />
                      }
                    </span>
                    <p>{!user.isRoomAdmin ? "کاربر ادمین" : "کاربر عادی"}</p>
                  </div>
                </div>
              </div>

              <div className={clsx("room-users-modal__body__card__foot", user.id === 1 && 'current')}>
                {
                  user.id === 1 ? "شما" : "اخراج"
                }
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default UsersModal