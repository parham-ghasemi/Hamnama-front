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
    description: 'وقتی چیزی درست نبود، سریع خبر بده.',
  },
  {
    icon: <PiHeartStraightFill />,
    title: 'علاقه‌مندی‌ها',
    description: 'انتخاب‌هایت را برای بعد نگه دار.',
  },
  {
    icon: <PiSlidersHorizontal />,
    title: 'فیلتر و مرتب‌سازی',
    description: 'بین هزاران عنوان، دقیق‌تر بگرد.',
  },
  {
    icon: <PiFilmStripFill />,
    title: 'انتخاب نوع',
    description: 'فیلم یا سریال، همان چیزی که می‌خواهی.',
  },
  {
    icon: <PiMagnifyingGlassBold />,
    title: 'جست‌وجوی سریع',
    description: 'اسم موردنظرت را مستقیم پیدا کن.',
  },
];

const Archive = () => {
  const nav = useNavigate();

  return (
    <section className="home-archive" aria-labelledby="home-archive-title">
      <div className="home-archive__glow" aria-hidden="true" />

      <Reveal as="h2" id="home-archive-title" className="home-archive__title" variant="up">
        فیلم و سریال موردنظرت را <span>راحت‌تر پیدا کن</span>
      </Reveal>

      <div className="home-archive__layout">
        <Reveal className="home-archive__content" variant="up" delay={110}>
          <div className="home-archive__intro">
            <span className="home-archive__intro__eyebrow">
              <PiFilmStripFill aria-hidden="true" />
              آرشیو بزرگ هم‌نما
            </span>
            <p className="home-archive__description">
              بیشتر از <strong>۲۰٬۰۰۰ فیلم و سریال</strong> منتظرته؛ با ابزارهای آرشیو، عنوانی که
              دنبالش هستی را سریع پیدا کن و مستقیم وارد اتاق تماشا شو.
            </p>
          </div>

          <div className="home-archive__features" aria-label="امکانات آرشیو">
            {archiveFeatures.map((feature, index) => (
              <div className="home-archive__feature" key={`home-archive-feature-${index}`}>
                <span className="home-archive__feature__icon" aria-hidden="true">
                  {feature.icon}
                </span>
                <span className="home-archive__feature__body">
                  <strong>{feature.title}</strong>
                  <span>{feature.description}</span>
                </span>
              </div>
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
            <span className="home-archive__hint">انتخاب کن، اتاق بساز و با دوستات شروع کن</span>
          </div>
        </Reveal>

        <Reveal className="home-archive__preview-wrap" variant="fade" delay={170}>
          <div className="home-archive__preview-glow" aria-hidden="true" />
          <figure className="home-archive__preview">
            <img
              src=""
              alt="اسکرین‌شات آرشیو فیلم و سریال هم‌نما"
              className="home-archive__preview__image"
            />
          </figure>
        </Reveal>
      </div>
    </section>
  );
};

export default Archive;
