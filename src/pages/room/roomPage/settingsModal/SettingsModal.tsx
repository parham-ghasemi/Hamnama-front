import clsx from "clsx";
import "./SettingsModal.scss";
import { AiTwotoneThunderbolt } from "react-icons/ai";
import { IoImageOutline, IoLockClosed, IoLockOpen, IoSunnySharp, IoVolumeHigh } from "react-icons/io5";
import { BsMoonFill } from "react-icons/bs";
import { useEffect, useState } from "react";
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

interface SettingsModalProps {
  isOpen: boolean;
  isCreator: boolean;
  roomName: string;
  roomImage?: string;
  isPublic: boolean;
  mediaControlPermission: "admin" | "everyone";
  soundVolumes: RoomSoundVolumes;
  onSoundVolumesChange: (volumes: RoomSoundVolumes) => void;
  onSaveRoomSettings: (settings: {
    name: string;
    isPublic: boolean;
    mediaControlPermission: "admin" | "everyone";
  }) => Promise<void>;
  onUploadRoomImage: (file: File) => Promise<void>;
  onDeleteRoomImage: () => Promise<void>;
}

const SettingsModal = ({
  isOpen,
  isCreator,
  roomName,
  roomImage,
  isPublic,
  mediaControlPermission,
  soundVolumes,
  onSoundVolumesChange,
  onSaveRoomSettings,
  onUploadRoomImage,
  onDeleteRoomImage,
}: SettingsModalProps) => {
  const [theme, setTheme] = useState("default");
  const [draftName, setDraftName] = useState(roomName);
  const [draftPublic, setDraftPublic] = useState(isPublic);
  const [draftPermission, setDraftPermission] = useState<"admin" | "everyone">(mediaControlPermission);
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setDraftName(roomName);
    setDraftPublic(isPublic);
    setDraftPermission(mediaControlPermission);
  }, [isOpen, roomName, isPublic, mediaControlPermission]);

  const handleThemeSelect = (nextTheme: string) => {
    const roomContainer = document.querySelector(".room-page");
    roomContainer?.setAttribute("data-theme", nextTheme);
    setTheme(nextTheme);
  };

  const updateSoundVolume = (key: RoomSoundKey, value: number) => {
    onSoundVolumesChange({ ...soundVolumes, [key]: value });
  };

  const handleSave = async () => {
    if (!isCreator || saving || (draftPublic && !draftName.trim())) return;
    setSaving(true);
    try {
      await onSaveRoomSettings({
        name: draftName.trim(),
        isPublic: draftPublic,
        mediaControlPermission: draftPermission,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImage = async (file: File | null) => {
    if (!file || !isCreator || imageBusy) return;
    setImageBusy(true);
    try {
      await onUploadRoomImage(file);
    } finally {
      setImageBusy(false);
    }
  };

  const imageUrl = roomImage ? `${import.meta.env.VITE_BASE_URL ?? ""}${roomImage}` : "";

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
        <div className="room-settings-modal__identity-card">
          <div className="room-settings-modal__identity-card__preview">
            {imageUrl ? <img src={imageUrl} alt="" /> : <IoImageOutline />}
          </div>
          <div className="room-settings-modal__identity-card__copy">
            <strong>{isCreator ? "اطلاعات اتاق" : (roomName || "اتاق")}</strong>
            <span>نام و تصویر اتاق فقط توسط سازنده قابل تغییر است.</span>
          </div>
          {isCreator && (
            <label className="room-settings-modal__identity-card__upload">
              <span>{imageBusy ? "در حال آپلود…" : "تغییر تصویر"}</span>
              <input type="file" accept="image/*" disabled={imageBusy} onChange={(event) => void handleImage(event.target.files?.[0] ?? null)} />
            </label>
          )}
          {isCreator && roomImage && (
            <button type="button" className="room-settings-modal__identity-card__remove" disabled={imageBusy} onClick={async () => { setImageBusy(true); try { await onDeleteRoomImage(); } finally { setImageBusy(false); } }}>
              حذف تصویر
            </button>
          )}
        </div>

        {isCreator && (
          <div className="room-settings-modal__body__row">
            <h5>نام اتاق</h5>
            <input className="room-settings-modal__name-input" value={draftName} maxLength={120} onChange={(event) => setDraftName(event.target.value)} placeholder={draftPublic ? "نام اتاق عمومی" : "نام اختیاری"} />
            {draftPublic && !draftName.trim() && <small className="room-settings-modal__validation">برای اتاق عمومی وارد کردن نام الزامی است.</small>}
          </div>
        )}

        <div className="room-settings-modal__body__row">
          <h5>وضعیت اتاق</h5>
          <div className="room-settings-modal__body__row__items room-settings-modal__body__row__items--2">
            <button type="button" disabled={!isCreator} className={clsx("room-settings-modal__body__row__items__item", !draftPublic && "active", !isCreator && "readonly")} onClick={() => setDraftPublic(false)}><IoLockClosed /><span>خصوصی</span></button>
            <button type="button" disabled={!isCreator} className={clsx("room-settings-modal__body__row__items__item", draftPublic && "active", !isCreator && "readonly")} onClick={() => setDraftPublic(true)}><IoLockOpen /><span>عمومی</span></button>
          </div>
        </div>

        <div className="room-settings-modal__body__row">
          <h5>دسترسی کنترل اتاق</h5>
          <div className="room-settings-modal__body__row__items room-settings-modal__body__row__items--2">
            <button type="button" disabled={!isCreator} className={clsx("room-settings-modal__body__row__items__item", draftPermission === "admin" && "active", !isCreator && "readonly")} onClick={() => setDraftPermission("admin")}><IoLockClosed /><span>فقط مدیران</span></button>
            <button type="button" disabled={!isCreator} className={clsx("room-settings-modal__body__row__items__item", draftPermission === "everyone" && "active", !isCreator && "readonly")} onClick={() => setDraftPermission("everyone")}><IoLockOpen /><span>همه کاربران</span></button>
          </div>
        </div>

        {isCreator && (
          <button type="button" className="room-settings-modal__save" disabled={saving || (draftPublic && !draftName.trim())} onClick={() => void handleSave()}>
            {saving ? "در حال ذخیره…" : "ذخیره تغییرات اتاق"}
          </button>
        )}

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
            <div><strong>صداهای رویداد</strong><span>ولوم هر صدای اتاق را جداگانه تنظیم کن</span></div>
            <IoVolumeHigh aria-hidden="true" />
          </div>
          <div className="room-settings-modal__sound-card__controls">
            {(Object.keys(SOUND_LABELS) as RoomSoundKey[]).map((key) => (
              <label key={key}><span>{SOUND_LABELS[key]}</span><strong>{soundVolumes[key]}%</strong><input type="range" min="0" max="100" step="5" value={soundVolumes[key]} onChange={(event) => updateSoundVolume(key, Number(event.target.value))} /></label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
