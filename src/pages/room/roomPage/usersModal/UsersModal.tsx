import clsx from "clsx";
import "./UsersModal.scss";
import { BsPeopleFill, BsShieldFillCheck } from "react-icons/bs";
import { FaCheck, FaChevronDown } from "react-icons/fa6";
import { IoClose, IoWifi } from "react-icons/io5";
import { useState } from "react";
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

interface UsersModalProps {
  isCurrentAdmin: boolean;
  isOpen: boolean;
  users: UserRow[];
  onChangeRole: (userId: string, role: "admin" | "member") => void;
  onKick: (userId: string) => void;
  roleLoadingId?: string | null;
  kickLoadingId?: string | null;
}

const statusLabel: Record<ConnectionStatus, string> = {
  good: "اتصال عالی",
  medium: "اتصال متوسط",
  bad: "اتصال ضعیف",
  offline: "آفلاین",
};

const UsersModal = ({
  isCurrentAdmin,
  isOpen,
  users,
  onChangeRole,
  onKick,
  roleLoadingId = null,
  kickLoadingId = null,
}: UsersModalProps) => {
  const [openRoleId, setOpenRoleId] = useState<string | null>(null);

  return (
    <div className={clsx("room-users-modal", isOpen && "open")}>
      <header className="room-users-modal__head">
        <div className="room-users-modal__head__icon"><BsPeopleFill /></div>
        <div className="room-users-modal__head__content">
          <strong>اعضای اتاق</strong>
          <span>{users.length.toLocaleString("fa-IR")} نفر حاضر در اتاق</span>
        </div>
        <span className="room-users-modal__head__live"><span /> زنده</span>
      </header>

      <div className="room-users-modal__body">
        {users.map((user) => {
          const canManage = isCurrentAdmin && !user.isCurrentUser;
          const isRoleLoading = roleLoadingId === user.userId;
          const isKickLoading = kickLoadingId === user.userId;
          const online = user.connectionStatus !== "offline";

          return (
            <article className="room-users-modal__body__card" key={user.userId}>
              <div className="room-users-modal__body__card__identity">
                <div className="room-users-modal__body__card__identity__avatar">
                  {user.avatar ? (
                    <img src={`${import.meta.env['VITE_BASE_URL'] ?? ''}${user.avatar}`} alt={user.name} />
                  ) : (
                    <span>{user.name[0]?.toUpperCase()}</span>
                  )}
                  <i className={clsx("room-users-modal__body__card__identity__avatar__dot", online && "online")} />
                </div>
                <div className="room-users-modal__body__card__identity__text">
                  <div>
                    <strong>{user.isCurrentUser ? "شما" : user.name}</strong>
                    {user.role === "admin" && <span className="room-users-modal__admin-badge"><BsShieldFillCheck /> مدیر</span>}
                  </div>
                  <span>{statusLabel[user.connectionStatus]}</span>
                </div>
              </div>

              <div className="room-users-modal__body__card__details">
                <div className={clsx("room-users-modal__status", user.connectionStatus)}>
                  <IoWifi />
                  <span>{user.connectionStatus === "good" ? "پایدار" : user.connectionStatus === "medium" ? "متوسط" : user.connectionStatus === "bad" ? "ضعیف" : "قطع"}</span>
                </div>

                {canManage ? (
                  <div className="room-users-modal__role">
                    <button
                      type="button"
                      className={clsx("room-users-modal__role__trigger", openRoleId === user.userId && "open")}
                      onClick={() => setOpenRoleId((current) => current === user.userId ? null : user.userId)}
                      disabled={isRoleLoading || isKickLoading}
                    >
                      <span>{user.role === "admin" ? "مدیر" : "عضو"}</span>
                      <FaChevronDown />
                    </button>
                    {openRoleId === user.userId && (
                      <div className="room-users-modal__role__menu">
                        {(["member", "admin"] as const).map((role) => (
                          <button
                            key={role}
                            type="button"
                            className={clsx(role === user.role && "selected")}
                            onClick={() => {
                              setOpenRoleId(null);
                              if (role !== user.role) onChangeRole(user.userId, role);
                            }}
                          >
                            <span>{role === "admin" ? "مدیر" : "عضو"}</span>
                            {role === user.role && <FaCheck />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="room-users-modal__role__static">{user.role === "admin" ? "مدیر اتاق" : "عضو اتاق"}</span>
                )}
              </div>

              {canManage ? (
                <button
                  type="button"
                  className="room-users-modal__body__card__kick"
                  onClick={() => onKick(user.userId)}
                  disabled={isKickLoading || isRoleLoading}
                >
                  {isKickLoading ? "در حال اخراج..." : <><IoClose /> اخراج از اتاق</>}
                </button>
              ) : (
                <span className="room-users-modal__body__card__current">{user.isCurrentUser ? "این حساب شماست" : "مدیر اتاق"}</span>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default UsersModal;
