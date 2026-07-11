import './Home.scss'
import Steps from './steps/Steps'
import FeatureCards from './featureCards/FeatureCards'
import PlanCards from './planCards/PlanCards'
import FeatureGrid from './featureGrid/FeatureGrid'
import Faq from './faq/Faq'
import { useTheme } from '../../context/ThemeContext'
import clsx from 'clsx'

const Home = () => {
  const { isLight } = useTheme();

  return (
    <div className='home-page'>

      <div className={clsx("home-page__hero", isLight && "home-page__hero--light")}>
        <div className="img">
          <img
            src="/homepage/lightheroimg.png"
            className='light'
            alt=""
          />
          <img
            src="/homepage/heroimg.png"
            className='dark'
            alt=""
          />
        </div>

        <h1>
          با <span>دوستان خود</span> همزمان فیلم ببینید!
        </h1>
      </div>

      <h2 className='home-page__button-title'>اتاق سینمایی بسازید و در کنار هم فیلم تماشا کنید.</h2>

      <div className="home-page__buttons">
        <button className='home-page__buttons__subs'>خرید اشتراک</button>
        <button className='home-page__buttons__watch'>شروع به تماشا</button>
      </div>

      <h2 className='home-page__steps-title'> 3 قدم تا <span>فیلم دیدن</span> کنار یکدیگر!</h2>
      <Steps />


      <h2 className='home-page__features-title'>لذت <span>تماشای گروهی فیلم</span> به سبک جدید</h2>
      <FeatureCards />

      <h2 className='home-page__plans-title'>پلن <span>مناسب خودت</span> رو انتخاب کن!</h2>
      <PlanCards />

      <FeatureGrid />

      <h2 className='home-page__faq-title'>سوالات متداول</h2>
      <h3 className='home-page__faq-subtitle'>آموزش قدم به قدم استفاده از سایت هم‌نما</h3>
      <Faq />


    </div>
  )
}

export default Home