import { PiCaretDownFill, PiHeartFill, PiTicketFill } from 'react-icons/pi';
import './PlanCards.scss';
import { BsPeopleFill, BsPersonFill } from 'react-icons/bs';
import { Link } from 'react-router-dom';
import { toPersianNumerals } from '../../../helpers/NumberConversion';
import Reveal from '../reveal/Reveal';

const PlanCards = () => {
  const plans = [
    {
      icon: <BsPeopleFill />,
      title: 'پلن گروهی',
      desc: 'مناسب جمع دوستان و خانوادگی',
      numberOfUsers: 7,
      price: 110000,
      discount: { percent: 15, newPrice: 79000, daysLeft: 30 },
    },
    {
      icon: <PiHeartFill />,
      title: 'پلن کاپلی',
      desc: 'با پارتنرت فیلم ببین',
      numberOfUsers: 2,
      price: 110000,
      discount: { percent: 15, newPrice: 79000, daysLeft: 30 },
    },
    {
      icon: <BsPersonFill />,
      title: 'پلن تک نفره',
      desc: 'مناسب خرید تنها',
      numberOfUsers: 1,
      price: 110000,
      discount: { percent: 15, newPrice: 79000, daysLeft: 30 },
    },
  ]

  return (
    <Reveal className='home-v2-planCards' variant='fade'>
      {/* <div className='home-v2-planCards__blob-top'></div> */}
      <div className='home-v2-planCards__blob-bottom'></div>

      {
        plans.map((plan, ind) => (
          <div className='home-v2-planCards__card' key={`homeplancards-${ind}`}>
            <div className="home-v2-planCards__card__icon">
              {plan.icon}
            </div>

            <h4 className='home-v2-planCards__card__title'>{plan.title}</h4>
            <p className='home-v2-planCards__card__desc'>{plan.desc}</p>

            <div className='home-v2-planCards__card__sep' />

            <p className='home-v2-planCards__card__users-title'>تعداد کاربر</p>
            <p className='home-v2-planCards__card__users'>
              {`${toPersianNumerals(plan.numberOfUsers)} نفر`}
            </p>

            <div className='home-v2-planCards__card__price-container'>
              {
                plan.discount && (
                  <div className='home-v2-planCards__card__price-container__discount'>
                    <div className="home-v2-planCards__card__price-container__discount__old-price">
                      {
                        toPersianNumerals(
                          plan.price.toLocaleString().replace(',', "،")
                        )
                      }
                    </div>

                    <div className="home-v2-planCards__card__price-container__discount__discount-percent">
                      <PiCaretDownFill />
                      {`${toPersianNumerals(plan.discount.percent)}%`}
                    </div>
                  </div>
                )
              }
              <div className='home-v2-planCards__card__price-container__current-price'>
                <p className='home-v2-planCards__card__price-container__current-price__main'>
                  {toPersianNumerals(plan.discount ? plan.discount.newPrice.toLocaleString().replace(',', "،") : plan.price)}
                  <span>
                    هــــزار تومان
                  </span>
                </p>

                <p className='home-v2-planCards__card__price-container__current-price__sub'>
                  {`مدت زمان ${toPersianNumerals(plan.discount.daysLeft)} روز `}
                </p>
              </div>
            </div>

            <button className='home-v2-planCards__card__buyBtn'>
              <PiTicketFill aria-hidden='true' />
              خرید
            </button>

            <Link to={'/plan-details'} className="home-v2-planCards__card__more">مشاهده تمام ویژگی ها</Link>
          </div>
        ))
      }
    </Reveal>
  )
}

export default PlanCards
