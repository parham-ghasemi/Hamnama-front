import clsx from "clsx";
import "./SettingsModal.scss";
import { AiTwotoneSetting, AiTwotoneThunderbolt } from "react-icons/ai";
import { IoLockClosed, IoLockOpen, IoSunnySharp } from "react-icons/io5";
import { BsMoonFill } from "react-icons/bs";

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
            <div className="room-settings-modal__body__row__items__item">
              <BsMoonFill />
              <span>تیره</span>
            </div>
            <div className="room-settings-modal__body__row__items__item">
              <AiTwotoneThunderbolt />
              <span>پیش فرض</span>
            </div>
            <div className="room-settings-modal__body__row__items__item">
              <IoSunnySharp />
              <span>روشن</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;