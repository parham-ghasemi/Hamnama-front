import './MediaTypeModal.scss';
import clsx from "clsx";
import { BsLink45Deg } from "react-icons/bs";
import { IoClose, IoTvOutline } from "react-icons/io5";
import { TbArchiveFilled, TbPlayerPlay } from 'react-icons/tb';

const MediaTypeModal = ({
  openArchive,
  isOpen,
  closeModal,
  onShareScreen,
  onChooseLink,
}: {
  isOpen: boolean;
  openArchive: () => void;
  closeModal: () => void;
  onShareScreen: () => void;
  onChooseLink: () => void;
}) => {
  const handleOpenArchive = () => {
    closeModal();
    openArchive();
  };

  const handleShareScreen = () => {
    closeModal();
    onShareScreen();
  };

  return (
    <div className={clsx("media-type-modal", isOpen && "open")}>
      <header className="media-type-modal__head">
        <div className="media-type-modal__head-left">
          <TbPlayerPlay />
          <div>
            <strong>انتخاب منبع پخش</strong>
            <span>چگونه می‌خواهید محتوا را تماشا کنید؟</span>
          </div>
        </div>
        <button
          type="button"
          className="media-type-modal__close"
          onClick={closeModal}
          aria-label="بستن"
        >
          <IoClose />
        </button>
      </header>

      <div className="media-type-modal__body">
        <button
          type="button"
          className="media-type-modal__option media-type-modal__option--link"
          onClick={onChooseLink}
        >
          <div className="media-type-modal__option-icon">
            <BsLink45Deg />
          </div>
          <div className="media-type-modal__option-text">
            <strong>پخش با لینک</strong>
            <span>لینک مستقیم ویدیو را وارد کنید</span>
          </div>
          <span className="media-type-modal__option-arrow">←</span>
        </button>

        <button
          type="button"
          className="media-type-modal__option media-type-modal__option--archive"
          onClick={handleOpenArchive}
        >
          <div className="media-type-modal__option-icon">
            <TbArchiveFilled />
          </div>
          <div className="media-type-modal__option-text">
            <strong>آرشیو فیلم و سریال</strong>
            <span>از مجموعه کامل فیلم‌ها و سریال‌ها انتخاب کنید</span>
          </div>
          <span className="media-type-modal__option-arrow">←</span>
        </button>

        <button
          type="button"
          className="media-type-modal__option media-type-modal__option--screen"
          onClick={handleShareScreen}
        >
          <div className="media-type-modal__option-icon">
            <IoTvOutline />
          </div>
          <div className="media-type-modal__option-text">
            <strong>اشتراک‌گذاری صفحه</strong>
            <span>صفحه نمایش خود را با دیگران به اشتراک بگذارید</span>
          </div>
          <span className="media-type-modal__option-arrow">←</span>
        </button>
      </div>
    </div>
  );
};

export default MediaTypeModal;
