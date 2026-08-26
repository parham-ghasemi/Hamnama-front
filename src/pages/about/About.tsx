import './About.scss';
import clsx from 'clsx';
import {
  PiChatsCircleFill,
  PiCodeFill,
  PiCompassFill,
  PiEnvelopeSimpleFill,
  PiLightbulbFilamentFill,
  PiPhoneFill,
  PiRocketLaunchFill,
  PiShieldCheckFill,
  PiSparkleFill,
  PiUserFocusFill,
  PiUsersThreeFill,
} from 'react-icons/pi';
import CinemaAmbience from '../home/ambience/CinemaAmbience';
import Reveal from '../home/reveal/Reveal';
import { useTheme } from '../../context/ThemeContext';
import { toPersianNumerals } from '../../helpers/NumberConversion';
import { SEO } from '../../components/seo/SEO';

/** Contact details of the website owner. Swap with the real values. */
const contact = {
  email: 'info@hamnama.net',
  phone: '09120000000',
};

/** The developer behind هم‌نما. */
const developer = {
  name: 'پرهام قاسمی',
  role: 'طراحی و توسعه‌ی هم‌نما',
  email: 'parham.ghasemi.1388@gmail.com',
  phone: '09912525964',
};

/** What we care about — not a feature list, that already lives on the home page. */
const values = [
  {
    key: 'together',
    icon: <PiUsersThreeFill />,
    title: 'با هم بودن، مهم‌تره',
    text: 'هدف ما پخش فیلم نیست؛ هدف اینه که حس نشستن کنار دوستات رو داشته باشی، حتی وقتی چند شهر باهاش فاصله داری.',
  },
  {
    key: 'simple',
    icon: <PiSparkleFill />,
    title: 'سادگی رو جدی می‌گیریم',
    text: 'اگه یه کار به آموزش نیاز داشته باشه، طراحیش درست نیست. تلاش می‌کنیم هر بخش هم‌نما همون اول قابل فهم باشه.',
  },
  {
    key: 'privacy',
    icon: <PiShieldCheckFill />,
    title: 'حریم خصوصی، قابل مذاکره نیست',
    text: 'اتاق‌ها فقط با لینک خودت باز می‌شن، مکالمه‌های شما جایی ذخیره یا تحلیل نمی‌شه و کنترل همیشه دست شماست.',
  },
  {
    key: 'listen',
    icon: <PiChatsCircleFill />,
    title: 'صدای شما رو می‌شنویم',
    text: 'تیم کوچکیم، یعنی پیام‌هاتون گم نمی‌شه. هر پیشنهاد و انتقادی مستقیم به خود ما می‌رسه.',
  },
];

/** The short story of how هم‌نما came to be. */
const journey = [
  {
    key: 'idea',
    icon: <PiLightbulbFilamentFill />,
    title: 'ایده',
    text: 'همه‌چیز از یه گروه دوستانه شروع شد که هر هفته دلشون می‌خواست با هم فیلم ببینن، ولی هرکدوم یه شهر بودن.',
  },
  {
    key: 'build',
    icon: <PiRocketLaunchFill />,
    title: 'ساخت اولین نسخه',
    text: 'به‌جای یه راه‌حل موقت، تصمیم گرفتیم این تجربه رو برای همه بسازیم. اولین نسخه‌ی هم‌نما همین‌جوری متولد شد.',
  },
  {
    key: 'today',
    icon: <PiCompassFill />,
    title: 'امروز',
    text: 'هم‌نما هر روز داره بهتر می‌شه؛ قدم‌به‌قدم داریم به سالن سینمایی تبدیلش می‌کنیم که هرکسی، هرجا که باشه، توش جا داره.',
  },
];

const About = () => {
  const { isLight } = useTheme();

  return (
    <>
      <SEO
        title="درباره ما | هم‌نما"
        description="هم‌نما جاییه که با دوستات وارد یک اتاق می‌شی، همزمان فیلم می‌بینی و همون‌جا چت می‌کنی. با ما بیشتر آشنا شو."
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

        {/* ---- Story ---------------------------------------------------- */}
        <section className="about-page__section">
          <Reveal as="h2" className="about-page__section__title">
            چرا <span>هم‌نما رو ساختیم؟</span>
          </Reveal>

          <Reveal className="about-page__story" variant="fade" delay={60}>
            <div className="about-page__story__blob" />

            <p>
              هم‌نما یک سالن سینمای آنلاینه که به‌جای صندلی، لینک داره. کافیه یک اتاق
              بسازی و لینکش رو بفرستی تا دوستات از هر شهر و هر ساعتی کنارت بشینن، همون
              فیلم رو دقیقاً در همون لحظه ببینن و همون‌جا درباره‌اش حرف بزنن.
            </p>
            <p>
              چیزی که ما رو به ساختن هم‌نما رسوند، دلتنگیِ همون شب‌های سینما رفتن دسته‌جمعی
              بود. برای همین به‌جای یک سرویس پخش دیگه، یک اتاق مشترک ساختیم که حس با هم
              بودن توش گم نشه. جزئیات فنی‌اش وظیفه‌ی ماست؛ تنها کاری که شما می‌کنید، انتخاب
              فیلم و زدن دکمه‌ی پخشه.
            </p>
          </Reveal>
        </section>

        {/* ---- Values ------------------------------------------------------ */}
        <section className="about-page__section">
          <Reveal as="h2" className="about-page__section__title">
            چیزهایی که <span>براش می‌جنگیم</span>
          </Reveal>

          <div className="about-page__values">
            {values.map((value, ind) => (
              <Reveal
                as="article"
                className="about-page__value"
                key={`about-value-${value.key}`}
                variant="up"
                delay={ind * 90}
              >
                <span className="about-page__value__icon" aria-hidden="true">
                  <span className="about-page__value__icon__glow" />
                  {value.icon}
                </span>
                <h3 className="about-page__value__title">{value.title}</h3>
                <p className="about-page__value__text">{value.text}</p>
                <span className="about-page__value__sheen" aria-hidden="true" />
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---- Journey -------------------------------------------------- */}
        <section className="about-page__section">
          <Reveal as="h2" className="about-page__section__title">
            مسیر ما <span>تا اینجا</span>
          </Reveal>

          <div className="about-page__journey">
            {journey.map((item, ind) => (
              <Reveal
                as="article"
                className="about-page__journey__item"
                key={`about-journey-${item.key}`}
                variant="up"
                delay={ind * 110}
              >
                <span className="about-page__journey__item__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="about-page__journey__item__content">
                  <h3 className="about-page__journey__item__title">{item.title}</h3>
                  <p className="about-page__journey__item__text">{item.text}</p>
                </span>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---- Contact --------------------------------------------------- */}
        <section className="about-page__section">
          <Reveal as="h2" className="about-page__section__title">
            راه‌های <span>ارتباط با ما</span>
          </Reveal>

          <Reveal className="about-page__contact" variant="fade" delay={60}>
            <p className="about-page__contact__lead">
              هر پیشنهاد، انتقاد، گزارش خطا یا درخواست همکاری داری مستقیم بهمون بگو؛ این
              شماره و ایمیل به خود ما می‌رسه و معمولاً کمتر از یک روز کاری جواب می‌دیم.
            </p>

            <div className="about-page__contact__rows">
              <a className="about-page__contact__row" href={`mailto:${contact.email}`} dir="ltr">
                <span className="about-page__contact__row__icon" aria-hidden="true">
                  <PiEnvelopeSimpleFill />
                </span>
                <span className="about-page__contact__row__body">
                  <span className="about-page__contact__row__label">ایمیل</span>
                  <span className="about-page__contact__row__value">{contact.email}</span>
                </span>
              </a>

              <a className="about-page__contact__row" href={`tel:${contact.phone}`} dir="ltr">
                <span className="about-page__contact__row__icon" aria-hidden="true">
                  <PiPhoneFill />
                </span>
                <span className="about-page__contact__row__body">
                  <span className="about-page__contact__row__label">تلفن</span>
                  <span className="about-page__contact__row__value">
                    {toPersianNumerals(contact.phone)}
                  </span>
                </span>
              </a>
            </div>
          </Reveal>
        </section>

        {/* ---- Developer credit -------------------------------------------- */}
        <Reveal className="about-page__credit" variant="fade">
          <span className="about-page__credit__badge" aria-hidden="true">
            <span className="about-page__credit__badge__glow" />
            <PiCodeFill />
          </span>

          <span className="about-page__credit__info">
            <span className="about-page__credit__label">{developer.role}</span>
            <strong className="about-page__credit__name">{developer.name}</strong>
          </span>

          <span className="about-page__credit__divider" aria-hidden="true" />

          <span className="about-page__credit__links">
            <a href={`mailto:${developer.email}`} aria-label={developer.email} dir="ltr">
              <PiEnvelopeSimpleFill aria-hidden="true" />
            </a>
            <a href={`tel:${developer.phone}`} aria-label={toPersianNumerals(developer.phone)} dir="ltr">
              <PiPhoneFill aria-hidden="true" />
            </a>
          </span>
        </Reveal>
      </div>
    </>
  );
};

export default About;