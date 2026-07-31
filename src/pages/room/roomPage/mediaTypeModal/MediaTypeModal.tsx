import './MediaTypeModal.scss';
import clsx from "clsx"
import { BsDisplay, BsLink45Deg } from "react-icons/bs"
import { IoOptionsOutline, IoTvOutline } from "react-icons/io5"
import { TbArchiveFilled } from 'react-icons/tb';

const MediaTypeModal = ({ openArchive, isOpen, closeModal, onShareScreen }: { isOpen: boolean, openArchive: () => void, closeModal: () => void, onShareScreen: () => void }) => {
  const handleOpenArchive = () => {
    closeModal()
    openArchive()
  }

  const handleShareScreen = () => {
    closeModal()
    onShareScreen()
  }

  return (
    <div className={clsx("media-type-modal", isOpen && 'open')}>
      <div className="media-type-modal__head">
        <span>حالت پخش رو انتخاب کنید</span>
        <BsDisplay />
        <IoOptionsOutline />
      </div>

      <div className="media-type-modal__body">
        <div className="media-type-modal__body__card">
          <span><BsLink45Deg /></span>
          <p>پخش با لینک</p>
        </div>

        <div className="media-type-modal__body__card" onClick={handleOpenArchive}>
          <span><TbArchiveFilled /></span>
          <p>آرشیو فیلم و سریال</p>
        </div>

        <div className="media-type-modal__body__card" onClick={handleShareScreen}>
          <span><IoTvOutline /></span>
          <p>اشتراک گذاری صفحه</p>
        </div>
      </div>
    </div>
  )
}

export default MediaTypeModal