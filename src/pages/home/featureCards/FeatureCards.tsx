import { PiArrowsCounterClockwiseBold, PiChatsTeardropDuotone, PiFileVideoFill, PiProjectorScreenFill } from 'react-icons/pi';
import './FeatureCards.scss';
import Reveal from '../reveal/Reveal';

const FeatureCards = () => {
  const cards = [
    {
      icon: <PiChatsTeardropDuotone />,
      title: 'ویس چت و چت'
    },
    {
      icon: <PiArrowsCounterClockwiseBold />,
      title: 'پخش همزمان آنلاین'
    },
    {
      icon: <PiProjectorScreenFill />,
      title: 'اشتراک صفحه نمایش'
    },
    {
      icon: <PiFileVideoFill />,
      title: 'انتخاب فایل از سیستم'
    }
  ]

  return (
    <div className='home-feature-cards'>
      {
        cards.map((card, ind) => (
          <Reveal
            className="home-feature-cards__card"
            key={`home-f-card-${ind}`}
            delay={ind * 90}
            variant='up'
          >
            <div className='home-feature-cards__card__glow'></div>
            <div className="home-feature-cards__card__icon">
              {card.icon}
            </div>

            <div className="home-feature-cards__card__title">
              {card.title}
            </div>
          </Reveal>
        ))
      }
    </div>
  )
}

export default FeatureCards
