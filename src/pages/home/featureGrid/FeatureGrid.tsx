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
      icon: <PiChatsCircleFill />,
      title: "تماشای گروهی",
      desc: "با دوستات همزمان فیلم ببین",
    },
    {
      icon: <PiClockFill />,
      title: "همگام‌سازی پخش",
      desc: "پخش برای همه یکی می‌مونه",
    },
    {
      icon: <PiFilmReelFill />,
      title: "آرشیو بزرگ فیلم",
      desc: "هزاران فیلم و سریال در دسترس",
    },
    {
      icon: <PiUserPlusFill />,
      title: "دعوت دوستان",
      desc: "با یک کد به روم اضافه‌شون کن",
    },
    {
      icon: <PiFolderOpenFill />,
      title: "پخش فایل شخصی",
      desc: "فایل خودت رو هم پخش کن",
    },
    {
      icon: <PiArchiveFill />,
      title: "دسترسی سریع",
      desc: "فیلم‌های مورد علاقه‌ات رو پیدا کن",
    },
    {
      icon: <PiDevicesFill />,
      title: "روی هر دستگاه",
      desc: "موبایل، دسکتاپ و بیشتر",
    },
    {
      icon: <BsMusicPlayerFill />,
      title: "رادیو موزیک",
      desc: "همزمان با دوستات موزیک گوش کن",
      comingSoon: true,
    },
    {
      icon: <PiFilmStripBold />,
      title: "اتاق‌های خصوصی",
      desc: "روم بساز و خودت مدیریت کن",
    },
  ];

  return (
    <div className="home-feature-grid">
      {gridItems.map((item, indx) => (
        <Reveal
          className={`home-feature-grid__item${item.comingSoon
            ? ' home-feature-grid__item--coming-soon'
            : ''
            }`}
          key={`homefeature-grid-${indx}`}
          delay={(indx % 3) * 70}
        >
          <div className="home-feature-grid__item__right">
            <div className="home-feature-grid__item__right__glow" />
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
      ))}
    </div>
  );
};

export default FeatureGrid;