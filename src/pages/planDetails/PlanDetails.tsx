import './PlanDetails.scss';
import { PiCalendarMinus, PiCaretDownFill, PiCheckCircleFill, PiHeartFill, PiUserFill, PiUsersFill } from 'react-icons/pi';

const PlanDetails = () => {
  const plans = [
    {
      icon: <PiUsersFill />,
      title: 'پلن گروهی',
      price: 110000,
      durations: ["۱ ماهه", "۳ ماهه", "٦ ماهه"],
      discount: { percent: 15, newPrice: 79000, daysLeft: 30 },
      features: [
        ' تماشای همزمان فیلم به صورت همزمان .',
        ' تماشای همزمان فیلم به صورت همزمان .',
        ' تماشای همزمان فیلم به صورت همزمان .',
        ' تماشای همزمان فیلم به صورت همزمان .',
        ' تماشای همزمان فیلم به صورت همزمان .',
      ]
    },
    {
      icon: <PiHeartFill />,
      title: 'پلن کاپلی',
      durations: ["۱ ماهه", "۳ ماهه", "٦ ماهه"],
      price: 110000,
      discount: { percent: 15, newPrice: 79000, daysLeft: 30 },
      features: [
        ' تماشای همزمان فیلم به صورت همزمان .',
        ' تماشای همزمان فیلم به صورت همزمان .',
        ' تماشای همزمان فیلم به صورت همزمان .',
        ' تماشای همزمان فیلم به صورت همزمان .',
        ' تماشای همزمان فیلم به صورت همزمان .',
      ]
    },
    {
      icon: <PiUserFill />,
      title: 'پلن تک نفره',
      durations: ["۱ ماهه", "۳ ماهه", "٦ ماهه"],
      price: 110000,
      discount: { percent: 15, newPrice: 79000, daysLeft: 30 },
      features: [
        ' تماشای همزمان فیلم به صورت همزمان .',
        ' تماشای همزمان فیلم به صورت همزمان .',
        ' تماشای همزمان فیلم به صورت همزمان .',
        ' تماشای همزمان فیلم به صورت همزمان .',
        ' تماشای همزمان فیلم به صورت همزمان .',
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
                plan.durations.map((dur, ind) => (
                  <div className='plan-details__card__durations__card plan-details__card__durations__card--selected' key={`duration-mont-${ind}`}>
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
                      {plan.price}
                    </div>

                    <div className="plan-details__card__current-price__discount__discount-percent">
                      <PiCaretDownFill />
                      {`${plan.discount.percent}%`}
                    </div>
                  </div>
                )
              }
              <p className='plan-details__card__current-price__main'>
                {plan.discount ? plan.discount.newPrice.toLocaleString().replace(',', "،") : plan.price}
              </p>
            </div>

            <button className='plan-details__card__buyBtn'>
              خرید
            </button>

            <ul className='plan-details__card__features'>
              {
                plan.features.map((feat, ind) => (
                  <li key={`planfeatureinplansrom-${ind}`}>
                    <PiCheckCircleFill />
                    {feat}
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