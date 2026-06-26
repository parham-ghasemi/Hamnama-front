import { PiArchiveFill, PiChatsCircleFill, PiClockFill, PiDevicesFill, PiFilmReelFill, PiFilmStripBold, PiFolderOpenFill, PiHexagonFill, PiMusicNotesFill } from 'react-icons/pi';
import './FeatureGrid.scss';
import { BsMusicPlayerFill } from 'react-icons/bs';

const FeatureGrid = () => {
  const gridItems = [
    {
      icon: <PiFilmReelFill />,
      title: "پخش فیلم با تمام فرمت ها",
      desc: "پشتیبانی از MP4, MKV, AVI و..."
    },
    {
      icon: <PiFolderOpenFill />,
      title: "پخش با لینک و فایل",
      desc: "آپلود مستقیم یا پخش از لینک"
    },
    {
      icon: <BsMusicPlayerFill />,
      title: "رادیو موزیک",
      desc: "پخش موزیک همزمان با دوستان"
    },
    {
      icon: <PiChatsCircleFill />,
      title: "چت گروهی",
      desc: "گفتگو در حین تماشا"
    },
    {
      icon: <PiFilmStripBold />,
      title: "پخش فیلم با تمام فرمت ها",
      desc: "پشتیبانی از MP4, MKV, AVI و..."
    },
    {
      icon: <PiClockFill />,
      title: "کنترل همزمان پخش",
      desc: "Play, Pause, Seek همزمان"
    },
    {
      icon: <PiArchiveFill />,
      title: "آرشیو فیلم",
      desc: "ذخیره و دسترسی به فیلم های تماشا شده"
    },
    {
      icon: <PiHexagonFill />,
      title: "اتاق های خصوصی",
      desc: "لابی امن با رمز عبور"
    },
    {
      icon: <PiDevicesFill />,
      title: "موبایل و دسکتاپ",
      desc: "دسترسی از هر دستگاهی"
    },
  ]

  return (
    <div className="home-feature-grid">
      <div className="home-feature-grid__blob"></div>
      {
        gridItems.map((item, indx) => (
          <div className="home-feature-grid__item" key={`homefeature-grid-${indx}`}>
            <div className="home-feature-grid__item__right">
              {item.icon}
            </div>

            <div className="home-feature-grid__item__left">
              <p className="home-feature-grid__item__left__title">
                {item.title}
              </p>

              <p className="home-feature-grid__item__left__desc">
                {item.desc}
              </p>
            </div>
          </div>
        ))
      }
    </div>
  )
}

export default FeatureGrid