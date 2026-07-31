import './PlanDetails.scss';
import {
  PiCalendarMinus,
  PiCaretDownFill,
  PiCheckCircleFill,
  PiHeartFill,
  PiUserFill,
  PiUsersFill
} from 'react-icons/pi';

const PlanDetails = () => {
  const plans = [
    {
      icon: <PiUserFill />,
      title: 'پلن تک نفره',
      durations: ["۱ ماهه", "۳ ماهه", "٦ ماهه"],
      price: 110000,
      discount: { percent: 15, newPrice: 79000, daysLeft: 30 },
      features: [
        'تماشای همزمان فیلم به صورت همزمان.',
        'تماشای همزمان فیلم به صورت همزمان.',
        'تماشای همزمان فیلم به صورت همزمان.',
        'تماشای همزمان فیلم به صورت همزمان.',
        'تماشای همزمان فیلم به صورت همزمان.',
      ]
    },
    {
      icon: <PiHeartFill />,
      title: 'پلن کاپلی',
      durations: ["۱ ماهه", "۳ ماهه", "٦ ماهه"],
      price: 110000,
      discount: { percent: 15, newPrice: 79000, daysLeft: 30 },
      features: [
        'تماشای همزمان فیلم به صورت همزمان.',
        'تماشای همزمان فیلم به صورت همزمان.',
        'تماشای همزمان فیلم به صورت همزمان.',
        'تماشای همزمان فیلم به صورت همزمان.',
        'تماشای همزمان فیلم به صورت همزمان.',
      ]
    },
    {
      icon: <PiUsersFill />,
      title: 'پلن گروهی',
      price: 110000,
      durations: ["۱ ماهه", "۳ ماهه", "٦ ماهه"],
      discount: { percent: 15, newPrice: 79000, daysLeft: 30 },
      features: [
        'تماشای همزمان فیلم به صورت همزمان.',
        'تماشای همزمان فیلم به صورت همزمان.',
        'تماشای همزمان فیلم به صورت همزمان.',
        'تماشای همزمان فیلم به صورت همزمان.',
        'تماشای همزمان فیلم به صورت همزمان.',
      ]
    },
  ]

  return (
    <div className='plan-details'>
      {
        plans.map((plan, ind) => (
          <div className='plan-details__card' key={`homeplancards-${ind}`}>
            <div className="plan-details__card__icon">
              {plan.icon}
            </div>

            <h4 className='plan-details__card__title'>{plan.title}</h4>

            <div className='plan-details__card__durations'>
              {
                plan.durations.map((dur, index) => (
                  <div
                    className={`plan-details__card__durations__card ${index === 0 ? 'plan-details__card__durations__card--selected' : ''}`}
                    key={`duration-mont-${index}`}
                  >
                    <span>{dur}</span>
                    <PiCalendarMinus />
                  </div>
                ))
              }
            </div>

            <div className='plan-details__card__current-price'>
              {
                plan.discount && (
                  <div className='plan-details__card__current-price__discount'>
                    <div className="plan-details__card__current-price__discount__old-price">
                      {plan.price.toLocaleString('fa-IR')}
                    </div>

                    <div className="plan-details__card__current-price__discount__discount-percent">
                      <PiCaretDownFill />
                      {`${plan.discount.percent.toLocaleString('fa-IR')}%`}
                    </div>
                  </div>
                )
              }
              <p className='plan-details__card__current-price__main'>
                {plan.discount ? plan.discount.newPrice.toLocaleString('fa-IR') : plan.price.toLocaleString('fa-IR')}
                <span className="plan-details__card__current-price__currency"> تومان</span>
              </p>
            </div>

            <button className='plan-details__card__buyBtn'>
              خرید
            </button>

            <ul className='plan-details__card__features'>
              {
                plan.features.map((feat, index) => (
                  <li key={`planfeatureinplansrom-${index}`}>
                    <PiCheckCircleFill className="plan-details__card__features__icon" />
                    <span>{feat}</span>
                  </li>
                ))
              }
            </ul>

          </div>
        ))
      }
    </div>
  )
}

export default PlanDetails