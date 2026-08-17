import './Home.scss'
import Steps from './steps/Steps'
import FeatureCards from './featureCards/FeatureCards'
import PlanCards from './planCards/PlanCards'
import FeatureGrid from './featureGrid/FeatureGrid'
import Faq from './faq/Faq'
import CinemaAmbience from './ambience/CinemaAmbience'
import Reveal from './reveal/Reveal'
import { useTheme } from '../../context/ThemeContext'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import { toPersianNumerals } from '../../helpers/NumberConversion'
import { PiTicketFill, PiPlayFill } from 'react-icons/pi'
import { SEO } from '../../components/seo/SEO'

const Home = () => {
  const { isLight } = useTheme();
  const nav = useNavigate();

  return (
    <>
      <SEO
        title="HamNama | Watch Movies & Series Together"
        description="Watch movies and series together with your friends on HamNama. Create shared rooms, chat, and enjoy your favorite content together."
        canonical="https://hamnama.net/"
      />
      <div className='home-page'>

        <CinemaAmbience />

        <div className={clsx("home-page__hero", isLight && "home-page__hero--light")}>
          <div className="img">
            <img
              src="/homepage/lightheroimg.webp"
              className='light'
              alt=""
            />
            <img
              src="/homepage/heroimg.webp"
              className='dark'
              alt=""
            />
          </div>

          <h1>
            با <span>دوستان خود</span> همزمان فیلم ببینید!
          </h1>
        </div>

        <h2 className='home-page__button-title'>
          <span className='home-page__button-title__text'>اتاق سینمایی بسازید و در کنار هم فیلم تماشا کنید.</span>
        </h2>

        <Reveal className="home-page__buttons" delay={80}>
          <button className='home-page__buttons__subs' onClick={() => nav('/plan-details')}>
            <span className='home-page__buttons__icon' aria-hidden='true'><PiTicketFill /></span>
            <span className='home-page__buttons__label'>خرید اشتراک</span>
            <span className='home-page__buttons__sheen' aria-hidden='true' />
          </button>

          <button className='home-page__buttons__watch' onClick={() => nav('/join-room')}>
            <span className='home-page__buttons__icon' aria-hidden='true'><PiPlayFill /></span>
            <span className='home-page__buttons__label'>شروع به تماشا</span>
            <span className='home-page__buttons__sheen' aria-hidden='true' />
          </button>
        </Reveal>

        <Reveal as='h2' className='home-page__steps-title'>
          {toPersianNumerals(3)} قدم تا <span>فیلم دیدن</span> کنار یکدیگر!
        </Reveal>
        <Steps />

        <Reveal as='h2' className='home-page__features-title'>
          لذت <span>تماشای گروهی فیلم</span> به سبک جدید
        </Reveal>
        <FeatureCards />

        <Reveal as='h2' className='home-page__plans-title'>
          پلن <span>مناسب خودت</span> رو انتخاب کن!
        </Reveal>
        <PlanCards />

        <FeatureGrid />

        <Reveal as='h2' className='home-page__faq-title'>سوالات متداول</Reveal>
        <h3 className='home-page__faq-subtitle'>آموزش قدم به قدم استفاده از سایت هم‌نما</h3>
        <Faq />
      </div>
    </>
  )
}

export default Home
