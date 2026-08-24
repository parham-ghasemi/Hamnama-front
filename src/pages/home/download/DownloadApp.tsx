import { FaAndroid, FaApple, FaWindows } from 'react-icons/fa';
import { PiHourglassMediumFill } from 'react-icons/pi';
import './DownloadApp.scss';
import Reveal from '../reveal/Reveal';

const platforms = [
  {
    key: 'android',
    icon: <FaAndroid />,
    title: 'اندروید',
    desc: 'تماشای گروهی، همیشه توی جیبت',
  },
  {
    key: 'windows',
    icon: <FaWindows />,
    title: 'ویندوز',
    desc: 'تجربه‌ی کامل سینمای خانگی روی دسکتاپ',
  },
  {
    key: 'ios',
    icon: <FaApple />,
    title: 'آیفون',
    desc: 'ساده، روان و همیشه همراهت',
  },
];

/**
 * "Coming soon" showcase for the native apps.
 * Nothing is downloadable yet, so every card is intentionally inert and
 * carries a soft "به زودی" badge instead of a call to action.
 */
const DownloadApp = () => {
  return (
    <Reveal className="home-download" variant="fade">
      <div className="home-download__blob" />

      <p className="home-download__subtitle">
        نسخه‌ی اپلیکیشن هم‌نما در حال ساخته شدنه؛ خیلی زود می‌تونی روی این پلتفرم‌ها نصبش کنی.
      </p>

      <div className="home-download__cards">
        {platforms.map((platform) => (
          <div className="home-download__card" key={`home-download-${platform.key}`}>
            <span className="home-download__card__badge">
              <PiHourglassMediumFill aria-hidden="true" />
              به زودی
            </span>

            <span className="home-download__card__icon" aria-hidden="true">
              {platform.icon}
            </span>

            <h4 className="home-download__card__title">{platform.title}</h4>
            <p className="home-download__card__desc">{platform.desc}</p>

            <span className="home-download__card__status">
              <span className="home-download__card__status__bar">
                <span className="home-download__card__status__bar__fill" />
              </span>
              در حال توسعه
            </span>

            <span className="home-download__card__sheen" aria-hidden="true" />
          </div>
        ))}
      </div>

      <p className="home-download__note">
        تا اون موقع از نسخه‌ی تحت وب استفاده کن؛ همه‌ی امکانات همین حالا در دسترسه.
      </p>
    </Reveal>
  );
};

export default DownloadApp;
