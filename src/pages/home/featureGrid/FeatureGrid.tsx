import {
  PiArchiveFill,
  PiChatsCircleFill,
  PiClockFill,
  PiDevicesFill,
  PiFilmReelFill,
  PiFilmStripBold,
  PiFolderOpenFill,
  PiUserPlusFill,
} from 'react-icons/pi';
import './FeatureGrid.scss';
import { BsMusicPlayerFill } from 'react-icons/bs';
import Reveal from '../reveal/Reveal';

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
      desc: "پخش موزیک همزمان با دوستان",
      comingSoon: true,
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
      desc: "ذخیره و دسترسی به فیلم‌های تماشا شده"
    },
    {
      icon: <PiUserPlusFill />,
      title: "دعوت دوستان",
      desc: "دعوت دوستان به تماشای گروهی"
    },
    {
      icon: <PiDevicesFill />,
      title: "موبایل و دسکتاپ",
      desc: "دسترسی از هر دستگاهی"
    },
  ];

  return (
    <div className="home-feature-grid">
      {
        gridItems.map((item, indx) => (
          <Reveal
            className={`home-feature-grid__item${item.comingSoon
              ? ' home-feature-grid__item--coming-soon'
              : ''
              }`}
            key={`homefeature-grid-${indx}`}
            delay={(indx % 3) * 70}
          >
            <div className="home-feature-grid__item__right">
              <div className="home-feature-grid__item__right__glow"></div>
              {item.icon}
            </div>

            <div className="home-feature-grid__item__left">
              <div className="home-feature-grid__item__left__title-row">
                <p className="home-feature-grid__item__left__title">
                  {item.title}
                </p>

                {item.comingSoon && (
                  <span className="home-feature-grid__item__coming-soon">
                    به‌زودی
                  </span>
                )}
              </div>

              <p className="home-feature-grid__item__left__desc">
                {item.desc}
              </p>
            </div>
          </Reveal>
        ))
      }
    </div>
  );
};

export default FeatureGrid;