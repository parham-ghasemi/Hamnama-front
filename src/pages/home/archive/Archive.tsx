import {
  PiArrowLeftBold,
  PiFilmStripFill,
  PiHeartStraightFill,
  PiMagnifyingGlassBold,
  PiSlidersHorizontal,
  PiWarningCircleBold,
} from 'react-icons/pi';
import './Archive.scss';
import { useNavigate } from 'react-router-dom';
import Reveal from '../reveal/Reveal';

const archiveFeatures = [
  {
    icon: <PiWarningCircleBold />,
    title: 'گزارش خرابی',
  },
  {
    icon: <PiHeartStraightFill />,
    title: 'علاقه‌مندی‌ها',
  },
  {
    icon: <PiSlidersHorizontal />,
    title: 'فیلتر و مرتب‌سازی',
  },
  {
    icon: <PiFilmStripFill />,
    title: 'انتخاب نوع',
  },
  {
    icon: <PiMagnifyingGlassBold />,
    title: 'جست‌وجوی سریع',
  },
];

const Archive = () => {
  const nav = useNavigate();

  return (
    <section className="home-archive" aria-labelledby="home-archive-title">
      <div className="home-archive__glow" aria-hidden="true" />

      <Reveal className="home-archive__header" variant="up">
        <span className="home-archive__eyebrow">
          <PiFilmStripFill aria-hidden="true" />
          آرشیو هم‌نما
        </span>

        <h2 id="home-archive-title" className="home-archive__title">
          فیلم و سریال موردنظرت را <span>راحت‌تر پیدا کن</span>
        </h2>
      </Reveal>

      <div className="home-archive__inner">
        <Reveal className="home-archive__copy" variant="up">
          <h3 className="home-archive__subheading">
            همه‌چیز برای پیدا کردن فیلم بعدی
          </h3>

          <p className="home-archive__description">
            از بین <strong>بیش از ۲۰٬۰۰۰ فیلم و سریال</strong> بگرد، چیزی که می‌خواهی را
            سریع پیدا کن و با ابزارهای آرشیو، انتخابت را دقیق‌تر کن.
          </p>

          <div className="home-archive__features" aria-label="امکانات آرشیو">
            {archiveFeatures.map((feature, index) => (
              <Reveal
                as="span"
                className="home-archive__feature"
                key={`home-archive-feature-${index}`}
                delay={index * 60}
                variant="up"
              >
                <span className="home-archive__feature__icon" aria-hidden="true">
                  {feature.icon}
                </span>
                <span>{feature.title}</span>
              </Reveal>
            ))}
          </div>

          <div className="home-archive__actions">
            <button
              type="button"
              className="home-archive__cta"
              onClick={() => nav('/join-room')}
            >
              <span>ساخت اتاق و ورود به آرشیو</span>
              <span className="home-archive__cta__icon" aria-hidden="true">
                <PiArrowLeftBold />
              </span>
              <span className="home-archive__cta__sheen" aria-hidden="true" />
            </button>

            <span className="home-archive__hint">
              جست‌وجو، انتخاب و شروع تماشا؛ همه‌چیز یک‌جا
            </span>
          </div>
        </Reveal>

        <Reveal className="home-archive__visual" variant="fade" delay={120}>
          <div className="home-archive__visual__film-glow" aria-hidden="true" />
          <div className="home-archive__screen">
            <img
              src="/homepage/Archive.webp"
              alt="تصویر آرشیو فیلم و سریال هم‌نما"
              className="home-archive__screen__image"
            />
          </div>

          <div className="home-archive__visual__caption">
            <span className="home-archive__visual__caption__dot" />
            <span>بیش از ۲۰٬۰۰۰ انتخاب برای یک شب سینمایی</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default Archive;
