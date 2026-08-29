import clsx from "clsx";
import "./SettingsModal.scss";
import { AiTwotoneSetting, AiTwotoneThunderbolt } from "react-icons/ai";
import { IoLockClosed, IoLockOpen, IoSunnySharp } from "react-icons/io5";
import { BsMoonFill } from "react-icons/bs";
import { useState } from "react";

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

const SettingsModal = ({
  isOpen,
  isPublic,
  mediaControlPermission,
  subtitleSettings,
  onSubtitleSettingsChange,
}: {
  isOpen: boolean;
  isPublic: boolean;
  mediaControlPermission: "admin" | "everyone";
  playbackTime?: number;
  currentlyPlaying?: string | null;
  createdAt?: string;
  subtitleSettings: SubtitleSettings;
  onSubtitleSettingsChange: (settings: SubtitleSettings) => void;
}) => {
  const [theme, setTheme] = useState("default");

  const handleThemeSelect = (nextTheme: string) => {
    const roomContainer = document.querySelector(".room-page");
    roomContainer?.setAttribute("data-theme", nextTheme);
    setTheme(nextTheme);
  };

  const updateSubtitle = <K extends keyof SubtitleSettings>(key: K, value: SubtitleSettings[K]) => {
    onSubtitleSettingsChange({ ...subtitleSettings, [key]: value });
  };

  return (
    <div className={clsx("room-settings-modal", isOpen && "open")}>
      <div className="room-settings-modal__head">
        <div>
          <span>تنظیمات اتاق</span>
          <small>ظاهر اتاق و زیرنویس را مطابق سلیقه‌ات تنظیم کن</small>
        </div>
        <AiTwotoneSetting />
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

        <div className="room-settings-modal__subtitle-card">
          <div className="room-settings-modal__subtitle-card__head">
            <div><strong>ظاهر زیرنویس</strong><span>پیش‌نمایش لحظه‌ای روی پلیر</span></div>
            <span className="room-settings-modal__subtitle-card__badge">زنده</span>
          </div>

          <div className="room-settings-modal__subtitle-card__preview">
            <span style={{
              fontSize: `${subtitleSettings.fontSize}px`,
              fontWeight: subtitleSettings.fontWeight,
              opacity: subtitleSettings.opacity / 100,
              background: `rgba(0,0,0,${subtitleSettings.backgroundOpacity / 100})`,
            }}>این یک پیش‌نمایش زیرنویس است</span>
          </div>

          <div className="room-settings-modal__subtitle-controls">
            <label><span>اندازه متن</span><strong>{subtitleSettings.fontSize}px</strong><input type="range" min="14" max="34" step="1" value={subtitleSettings.fontSize} onChange={(event) => updateSubtitle("fontSize", Number(event.target.value))} /></label>
            <label><span>شفافیت متن</span><strong>{subtitleSettings.opacity}%</strong><input type="range" min="60" max="100" step="5" value={subtitleSettings.opacity} onChange={(event) => updateSubtitle("opacity", Number(event.target.value))} /></label>
            <label><span>پس‌زمینه</span><strong>{subtitleSettings.backgroundOpacity}%</strong><input type="range" min="0" max="90" step="5" value={subtitleSettings.backgroundOpacity} onChange={(event) => updateSubtitle("backgroundOpacity", Number(event.target.value))} /></label>
          </div>

          <div className="room-settings-modal__subtitle-offset">
            <div>
              <strong>هماهنگ‌سازی زمان زیرنویس</strong>
              <span>مقدار مثبت یعنی زیرنویس دیرتر نمایش داده می‌شود.</span>
            </div>
            <label>
              <span>تاخیر</span>
              <input
                type="number"
                min="-10000"
                max="10000"
                step="100"
                value={subtitleSettings.offsetMs}
                onChange={(event) => updateSubtitle("offsetMs", Number(event.target.value) || 0)}
              />
              <small>ms</small>
            </label>
            <div className="room-settings-modal__subtitle-offset__presets">
              {[-1000, -500, 0, 500, 1000].map((value) => (
                <button key={value} type="button" className={clsx(subtitleSettings.offsetMs === value && "active")} onClick={() => updateSubtitle("offsetMs", value)}>
                  {value === 0 ? "۰" : `${value > 0 ? "+" : ""}${value / 1000}s`}
                </button>
              ))}
            </div>
          </div>

          <div className="room-settings-modal__subtitle-actions">
            <div className="room-settings-modal__subtitle-segment">
              <span>ضخامت</span>
              {([500, 700, 800] as const).map((weight) => <button key={weight} type="button" className={clsx(subtitleSettings.fontWeight === weight && "active")} onClick={() => updateSubtitle("fontWeight", weight)}>{weight === 500 ? "عادی" : weight === 700 ? "نیمه‌پر" : "پررنگ"}</button>)}
            </div>
            <div className="room-settings-modal__subtitle-segment">
              <span>جایگاه</span>
              <button type="button" className={clsx(subtitleSettings.position === "low" && "active")} onClick={() => updateSubtitle("position", "low")}>پایین</button>
              <button type="button" className={clsx(subtitleSettings.position === "middle" && "active")} onClick={() => updateSubtitle("position", "middle")}>میانی</button>
            </div>
          </div>

          <button type="button" className="room-settings-modal__subtitle-reset" onClick={() => onSubtitleSettingsChange(DEFAULT_SUBTITLE_SETTINGS)}>بازنشانی تنظیمات زیرنویس</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
