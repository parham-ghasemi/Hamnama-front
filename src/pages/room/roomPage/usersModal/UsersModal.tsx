import clsx from "clsx";
import "./UsersModal.scss";
import { BsFillPersonFill, BsPeopleFill, BsPersonCheckFill } from "react-icons/bs";
import { FaChevronDown } from "react-icons/fa6";
import { useState } from "react";
import { IoWifi } from "react-icons/io5";
import type { ConnectionStatus } from "../../../../apiCalls/roomApi";

interface UserRow {
  userId: string;
  name: string;
  avatar: string;
  role: "admin" | "member";
  joinedAt: string;
  isCurrentUser: boolean;
  connectionStatus: ConnectionStatus;
}

const UsersModal = ({ isOpen, users }: { isOpen: boolean; users: UserRow[] }) => {
  const [openRoleInd, setOpenRoleInd] = useState<null | number>(null);

  return (
    <div className={clsx("room-users-modal", isOpen && "open")}>
      <div className="room-users-modal__head">
        <span>لیست کاربران</span>
        <BsPeopleFill />
      </div>

      <div className="room-users-modal__body">
        {users.map((user, ind) => (
          <div className="room-users-modal__body__card" key={user.userId}>
            <div className="room-users-modal__body__card__profile">
              <img src={`${import.meta.env.VITE_BASE_URL}${user?.avatar}`} alt={user.name} />
              <div>
                <p>{user.isCurrentUser ? "شما" : user.name}</p>
              </div>
            </div>

            <div className="room-users-modal__body__card__body">
              <div
                className={clsx(
                  "room-users-modal__body__card__body__connection",
                  user.connectionStatus,
                )}
              >
                <span>
                  <IoWifi />
                </span>
                <p>
                  {user.connectionStatus === "good"
                    ? "عالی"
                    : user.connectionStatus === "bad"
                      ? "ضعیف"
                      : user.connectionStatus === "offline"
                        ? "آفلاین"
                        : "متوسط"}
                </p>
              </div>

              <div className={clsx("room-users-modal__body__card__body__role", openRoleInd === ind && "open")}>
                <div
                  className={clsx(
                    "room-users-modal__body__card__body__role__trigger",
                    user.isCurrentUser && "current",
                    user.role !== "admin" && "normal",
                  )}
                  onClick={() => setOpenRoleInd((prev) => (prev === ind ? null : user.isCurrentUser ? null : ind))}
                >
                  <span>{user.role === "admin" ? <BsPersonCheckFill /> : <BsFillPersonFill />}</span>
                  <p>{user.role === "admin" ? "کاربر ادمین" : "کاربر عادی"}</p>
                  <FaChevronDown />
                </div>

                <div className="room-users-modal__body__card__body__role__drop-down">
                  <span>{user.role !== "admin" ? <BsPersonCheckFill /> : <BsFillPersonFill />}</span>
                  <p>{user.role !== "admin" ? "کاربر ادمین" : "کاربر عادی"}</p>
                </div>
              </div>
            </div>

            <div className={clsx("room-users-modal__body__card__foot", user.isCurrentUser && "current")}>
              {user.isCurrentUser ? "شما" : "اخراج"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersModal;