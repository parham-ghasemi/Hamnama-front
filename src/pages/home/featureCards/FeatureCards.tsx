import { PiArrowsCounterClockwiseBold, PiChatsTeardropDuotone, PiFileVideoFill, PiProjectorScreenFill } from 'react-icons/pi';
import './FeatureCards.scss';

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
          <div className="home-feature-cards__card" key={`home-f-card-${ind}`}>
            <div className="home-feature-cards__card__icon">
              {card.icon}
            </div>

            <div className="home-feature-cards__card__sep" />

            <div className="home-feature-cards__card__title">
              {card.title}
            </div>
          </div>
        ))
      }
    </div>
  )
}

export default FeatureCards