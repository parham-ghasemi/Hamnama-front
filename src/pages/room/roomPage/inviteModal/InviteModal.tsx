import React from "react";
import { TbCheck, TbCopy, TbLink, TbShare3, TbX } from "react-icons/tb";
import "./InviteModal.scss";

interface InviteModalProps {
  isOpen: boolean;
  roomCode: string;
  copied: boolean;
  onClose: () => void;
  onCopy: () => void;
}

const InviteModal: React.FC<InviteModalProps> = ({ isOpen, roomCode, copied, onClose, onCopy }) => {
  if (!isOpen) return null;

  return (
    <div className="invite-modal" dir="rtl" role="dialog" aria-modal="true" aria-labelledby="invite-modal-title">
      <div className="invite-modal__ambient" aria-hidden="true" />
      <header className="invite-modal__head">
        <div className="invite-modal__identity">
          <div className="invite-modal__icon"><TbShare3 /></div>
          <div>
            <span className="invite-modal__eyebrow">اشتراک اتاق</span>
            <h2 id="invite-modal-title">دوستت را وارد اتاق کن</h2>
          </div>
        </div>
        <button type="button" className="invite-modal__close" onClick={onClose} aria-label="بستن">
          <TbX />
        </button>
      </header>

      <div className="invite-modal__body">

        <section className="invite-modal__code-card" aria-label="کد اتاق">
          <div className="invite-modal__code-label"><TbLink /> کد دعوت</div>
          <div className="invite-modal__code-row">
            <code>{roomCode}</code>
            <button type="button" className={copied ? "is-copied" : ""} onClick={onCopy}>
              {copied ? <TbCheck /> : <TbCopy />}
              <span>{copied ? "کپی شد" : "کپی کد"}</span>
            </button>
          </div>
        </section>

        <div className="invite-modal__tip">
          <span />
          <p>کد دعوت را می‌توانید بدون نگرانی از به‌هم‌ریختن فرمت، کپی و در پیام‌رسان موردنظرتان ارسال کنید.</p>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
