import clsx from "clsx";
import "./SettingsModal.scss";
import { AiTwotoneThunderbolt } from "react-icons/ai";
import { IoLockClosed, IoLockOpen, IoSunnySharp, IoVolumeHigh } from "react-icons/io5";
import { BsMoonFill } from "react-icons/bs";
import { useState } from "react";
import { FaGear } from "react-icons/fa6";

export interface SubtitleSettings {
  fontSize: number;
  opacity: number;
  backgroundOpacity: number;
  fontWeight: 500 | 700 | 800;
  position: "low" | "middle";
  offsetMs: number;
}

export const DEFAULT_SUBTITLE_SETTINGS: SubtitleSettings = {
  fontSize: 20,
  opacity: 100,
  backgroundOpacity: 72,
  fontWeight: 500,
  position: "low",
  offsetMs: 0,
};

export type RoomSoundKey =
  | "userJoined"
  | "otherUserJoined"
  | "otherUserLeft"
  | "newChatMessage"
  | "adminAnnouncement";

export type RoomSoundVolumes = Record<RoomSoundKey, number>;

const SOUND_LABELS: Record<RoomSoundKey, string> = {
  userJoined: "ورود شما به اتاق",
  otherUserJoined: "ورود کاربر دیگر",
  otherUserLeft: "خروج کاربر دیگر",
  newChatMessage: "پیام جدید چت",
  adminAnnouncement: "اعلان مدیریت",
};

const SettingsModal = ({
  isOpen,
  isPublic,
  mediaControlPermission,
  soundVolumes,
  onSoundVolumesChange,
}: {
  isOpen: boolean;
  isPublic: boolean;
  mediaControlPermission: "admin" | "everyone";
  playbackTime?: number;
  currentlyPlaying?: string | null;
  createdAt?: string;
  soundVolumes: RoomSoundVolumes;
  onSoundVolumesChange: (volumes: RoomSoundVolumes) => void;
}) => {
  const [theme, setTheme] = useState("default");

  const handleThemeSelect = (nextTheme: string) => {
    const roomContainer = document.querySelector(".room-page");
    roomContainer?.setAttribute("data-theme", nextTheme);
    setTheme(nextTheme);
  };

  const updateSoundVolume = (key: RoomSoundKey, value: number) => {
    onSoundVolumesChange({ ...soundVolumes, [key]: value });
  };

  return (
    <div className={clsx("room-settings-modal", isOpen && "open")}>
      <div className="room-settings-modal__head">
        <div>
          <span>تنظیمات اتاق</span>
          <small>ظاهر اتاق و تنظیمات صدا را مطابق سلیقه‌ات تنظیم کن</small>
        </div>
        <FaGear />
      </div>

      <div className="room-settings-modal__body">
        <div className="room-settings-modal__body__row">
          <h5>وضعیت اتاق</h5>
          <div className="room-settings-modal__body__row__items room-settings-modal__body__row__items--2">
            <div className={clsx("room-settings-modal__body__row__items__item", !isPublic && "active")}><IoLockClosed /><span>خصوصی</span></div>
            <div className={clsx("room-settings-modal__body__row__items__item", isPublic && "active")}><IoLockOpen /><span>عمومی</span></div>
          </div>
        </div>

        <div className="room-settings-modal__body__row">
          <h5>دسترسی کنترل اتاق</h5>
          <div className="room-settings-modal__body__row__items room-settings-modal__body__row__items--2">
            <div className={clsx("room-settings-modal__body__row__items__item", mediaControlPermission === "admin" && "active")}><IoLockClosed /><span>فقط مدیران</span></div>
            <div className={clsx("room-settings-modal__body__row__items__item", mediaControlPermission === "everyone" && "active")}><IoLockOpen /><span>همه کاربران</span></div>
          </div>
        </div>

        <div className="room-settings-modal__body__row">
          <h5>حالت پس زمینه</h5>
          <div className="room-settings-modal__body__row__items room-settings-modal__body__row__items--3">
            <button type="button" className={clsx("room-settings-modal__body__row__items__item", theme === "dark" && "active")} onClick={() => handleThemeSelect("dark")}><BsMoonFill /><span>تیره</span></button>
            <button type="button" className={clsx("room-settings-modal__body__row__items__item", theme === "default" && "active")} onClick={() => handleThemeSelect("default")}><AiTwotoneThunderbolt /><span>پیش فرض</span></button>
            <button type="button" className={clsx("room-settings-modal__body__row__items__item", theme === "light" && "active")} onClick={() => handleThemeSelect("light")}><IoSunnySharp /><span>روشن</span></button>
          </div>
        </div>

        <div className="room-settings-modal__sound-card">
          <div className="room-settings-modal__sound-card__head">
            <div>
              <strong>صداهای رویداد</strong>
              <span>ولوم هر صدای اتاق را جداگانه تنظیم کن</span>
            </div>
            <IoVolumeHigh aria-hidden="true" />
          </div>

          <div className="room-settings-modal__sound-card__controls">
            {(Object.keys(SOUND_LABELS) as RoomSoundKey[]).map((key) => (
              <label key={key}>
                <span>{SOUND_LABELS[key]}</span>
                <strong>{soundVolumes[key]}%</strong>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={soundVolumes[key]}
                  onChange={(event) => updateSoundVolume(key, Number(event.target.value))}
                />
              </label>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
