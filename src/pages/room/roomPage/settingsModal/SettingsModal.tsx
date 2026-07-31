import clsx from "clsx";
import "./SettingsModal.scss";
import { AiTwotoneSetting, AiTwotoneThunderbolt } from "react-icons/ai";
import { IoLockClosed, IoLockOpen, IoSunnySharp } from "react-icons/io5";
import { BsMoonFill } from "react-icons/bs";
import { useState } from "react";

const SettingsModal = ({
  isOpen,
  isPublic,
  mediaControlPermission,
}: {
  isOpen: boolean;
  isPublic: boolean;
  mediaControlPermission: "admin" | "everyone";
  playbackTime: number;
  currentlyPlaying?: string | null;
  createdAt: string;
}) => {

  const [theme, setTheme] = useState('default')

  const handleThemeSelect = (nextTheme: string) => {
    const roomContainer = document.querySelector('.room-page');
    roomContainer?.setAttribute('data-theme', nextTheme)
    setTheme(nextTheme)
  };

  return (
    <div className={clsx("room-settings-modal", isOpen && "open")}>
      <div className="room-settings-modal__head">
        <span>تنظیمات</span>
        <AiTwotoneSetting />
      </div>

      <div className="room-settings-modal__body">
        <div className="room-settings-modal__body__row">
          <h5>وضعیت اتاق</h5>
          <div className="room-settings-modal__body__row__items room-settings-modal__body__row__items--2">
            <div className={clsx("room-settings-modal__body__row__items__item", !isPublic && "active")}>
              <IoLockClosed />
              <span>خصوصی</span>
            </div>
            <div className={clsx("room-settings-modal__body__row__items__item", isPublic && "active")}>
              <IoLockOpen />
              <span>عمومی</span>
            </div>
          </div>
        </div>

        <div className="room-settings-modal__body__row">
          <h5>دسترسی کنترل اتاق</h5>
          <div className="room-settings-modal__body__row__items room-settings-modal__body__row__items--2">
            <div
              className={clsx(
                "room-settings-modal__body__row__items__item",
                mediaControlPermission === "admin" && "active",
              )}
            >
              <IoLockClosed />
              <span>فقط مدیران</span>
            </div>
            <div
              className={clsx(
                "room-settings-modal__body__row__items__item",
                mediaControlPermission === "everyone" && "active",
              )}
            >
              <IoLockOpen />
              <span>همه کاربران</span>
            </div>
          </div>
        </div>

        <div className="room-settings-modal__body__row">
          <h5>حالت پس زمینه</h5>
          <div className="room-settings-modal__body__row__items room-settings-modal__body__row__items--3">
            <button
              type="button"
              className={clsx("room-settings-modal__body__row__items__item", theme === "dark" && "active")}
              onClick={() => handleThemeSelect("dark")}
            >
              <BsMoonFill />
              <span>تیره</span>
            </button>
            <button
              type="button"
              className={clsx("room-settings-modal__body__row__items__item", theme === "default" && "active")}
              onClick={() => handleThemeSelect("default")}
            >
              <AiTwotoneThunderbolt />
              <span>پیش فرض</span>
            </button>
            <button
              type="button"
              className={clsx("room-settings-modal__body__row__items__item", theme === "light" && "active")}
              onClick={() => handleThemeSelect("light")}
            >
              <IoSunnySharp />
              <span>روشن</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;