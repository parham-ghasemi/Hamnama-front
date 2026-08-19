import './About.scss';
import clsx from 'clsx';
import { PiEnvelopeSimpleFill, PiPhoneFill, PiUserFocusFill } from 'react-icons/pi';
import CinemaAmbience from '../home/ambience/CinemaAmbience';
import Reveal from '../home/reveal/Reveal';
import { useTheme } from '../../context/ThemeContext';
import { toPersianNumerals } from '../../helpers/NumberConversion';
import { SEO } from '../../components/seo/SEO';

/**
 * The two people behind هم‌نما.
 * Swap the placeholder values (name / image / phone / email) with the real
 * ones — nothing else needs to change.
 */
const people = [
  {
    key: 'founder',
    role: 'بنیان‌گذار',
    roleDesc: 'ایده‌پرداز و مسئول مسیر محصول',
    name: 'محمدرضا سلیمانی',
    image: '/about/founder.webp',
    phone: '09120000000',
    email: '---@hamnama.net',
  },
  {
    key: 'developer',
    role: 'توسعه‌دهنده',
    roleDesc: 'طراحی و پیاده‌سازی فنی هم‌نما',
    name: 'پرهام قاسمی',
    image: '/about/developer.webp',
    phone: '09912525964',
    email: 'parham.ghasemi.1388@gmail.com',
  },
];

const About = () => {
  const { isLight } = useTheme();

  return (
    <>
      <SEO
        title="درباره ما | هم‌نما"
        description="با تیم هم‌نما آشنا شوید؛ بنیان‌گذار و توسعه‌دهنده‌ای که هم‌نما را ساخته‌اند و راه‌های ارتباط مستقیم با آن‌ها."
        canonical="https://hamnama.net/about-us"
      />

      <div className={clsx('about-page', isLight && 'about-page--light')}>
        <CinemaAmbience />

        <Reveal className="about-page__hero" variant="fade">
          <span className="about-page__hero__badge">
            <PiUserFocusFill aria-hidden="true" />
            پشت پرده‌ی هم‌نما
          </span>

          <h1 className="about-page__hero__title">
            ما <span>هم‌نما</span> رو ساختیم!
          </h1>

          <p className="about-page__hero__text">
            هم‌نما از یک ایده‌ی ساده شروع شد: فاصله نباید مانع تماشای فیلم کنار آدم‌هایی
            باشه که دوستشون داری. امروز یک تیم کوچک ولی پرانرژی پشت این سایته و هر روز
            تلاش می‌کنه تجربه‌ی تماشای گروهی رو نرم‌تر، سریع‌تر و صمیمی‌تر کنه.
          </p>

          <div className="about-page__hero__stats">
            <div className="about-page__hero__stats__item">
              <strong>{toPersianNumerals(3)}</strong>
              <span>نفر تیم اصلی</span>
            </div>
            <div className="about-page__hero__stats__item">
              <strong>{toPersianNumerals(24)}/{toPersianNumerals(7)}</strong>
              <span>پشتیبانی و پیگیری</span>
            </div>
            <div className="about-page__hero__stats__item">
              <strong>{toPersianNumerals(1)}</strong>
              <span>هدف: تماشای کنار هم</span>
            </div>
          </div>
        </Reveal>

        <Reveal as="h2" className="about-page__team-title">
          آشنایی با <span>تیم ما</span>
        </Reveal>

        <Reveal className="about-page__team" variant="fade" delay={80}>
          <div className="about-page__team__blob" />

          {people.map((person) => (
            <article className="about-page__person" key={`about-person-${person.key}`}>
              <span className="about-page__person__role">{person.role}</span>

              <div className="about-page__person__avatar">
                <img src={person.image} alt={`${person.name} — ${person.role} هم‌نما`} loading="lazy" />
              </div>

              <h3 className="about-page__person__name">{person.name}</h3>
              <p className="about-page__person__desc">{person.roleDesc}</p>

              <div className="about-page__person__contact">
                <a
                  className="about-page__person__contact__row"
                  href={`tel:${person.phone}`}
                  dir="ltr"
                >
                  <span className="about-page__person__contact__row__icon" aria-hidden="true">
                    <PiPhoneFill />
                  </span>
                  <span className="about-page__person__contact__row__value">
                    {toPersianNumerals(person.phone)}
                  </span>
                </a>

                <a
                  className="about-page__person__contact__row"
                  href={`mailto:${person.email}`}
                  dir="ltr"
                >
                  <span className="about-page__person__contact__row__icon" aria-hidden="true">
                    <PiEnvelopeSimpleFill />
                  </span>
                  <span className="about-page__person__contact__row__value">{person.email}</span>
                </a>
              </div>

              <span className="about-page__person__sheen" aria-hidden="true" />
            </article>
          ))}
        </Reveal>

        <Reveal className="about-page__note" variant="fade">
          هر پیشنهاد، انتقاد یا ایده‌ای داری خوشحال می‌شیم مستقیم بهمون بگی؛ همین شماره‌ها
          و ایمیل‌ها به خود ما می‌رسه.
        </Reveal>
      </div>
    </>
  );
};

export default About;
