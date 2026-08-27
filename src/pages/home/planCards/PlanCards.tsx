import { PiCaretDownFill, PiHeartFill, PiTicketFill } from 'react-icons/pi';
import './PlanCards.scss';
import { BsPeopleFill, BsPersonFill } from 'react-icons/bs';
import { Link } from 'react-router-dom';
import { toPersianNumerals } from '../../../helpers/NumberConversion';
import Reveal from '../reveal/Reveal';
import FreeGate from '../freeGate/FreeGate';
import type { JSX } from 'react';

interface plan {
  icon: JSX.Element,
  title: string,
  desc: string,
  numberOfUsers: number,
  price: string,
  // price: number,
  discount?: { percent: number, newPrice: number, daysLeft: number },
}

const PlanCards = () => {
  const plans: plan[] = [
    {
      icon: <BsPeopleFill />,
      title: 'پلن گروهی',
      desc: 'مناسب جمع دوستان و خانوادگی',
      numberOfUsers: 7,
      price: '000،000',
      // discount: { percent: 15, newPrice: 79000, daysLeft: 30 },
    },
    {
      icon: <PiHeartFill />,
      title: 'پلن کاپلی',
      desc: 'با پارتنرت فیلم ببین',
      numberOfUsers: 2,
      price: '000،000',
      // discount: { percent: 15, newPrice: 79000, daysLeft: 30 },
    },
    {
      icon: <BsPersonFill />,
      title: 'پلن تک نفره',
      desc: 'مناسب خرید تنها',
      numberOfUsers: 1,
      price: '000،000',
      // discount: { percent: 15, newPrice: 79000, daysLeft: 30 },
    },
  ] as plan[]

  return (
    <Reveal className='home-planCards' variant='fade'>
      {/* <div className='home-planCards__blob-top'></div> */}
      <div className='home-planCards__blob-bottom'></div>

      {
        plans.map((plan, ind) => (
          <FreeGate
            className='home-planCards__gate'
            key={`homeplancards-${ind}`}
            radius={26}
          >
            <div className='home-planCards__card'>
              <div className="home-planCards__card__icon">
                {plan.icon}
              </div>

              <h4 className='home-planCards__card__title'>{plan.title}</h4>
              <p className='home-planCards__card__desc'>{plan.desc}</p>

              <div className='home-planCards__card__sep' />

              <p className='home-planCards__card__users-title'>تعداد کاربر</p>
              <p className='home-planCards__card__users'>
                {`${toPersianNumerals(plan.numberOfUsers)} نفر`}
              </p>

              <div className='home-planCards__card__price-container'>
                {
                  plan.discount && (
                    <div className='home-planCards__card__price-container__discount'>
                      <div className="home-planCards__card__price-container__discount__old-price">
                        {
                          toPersianNumerals(
                            plan.price.toLocaleString().replace(',', "،")
                          )
                        }
                      </div>

                      <div className="home-planCards__card__price-container__discount__discount-percent">
                        <PiCaretDownFill />
                        {`${toPersianNumerals(plan.discount.percent)}%`}
                      </div>
                    </div>
                  )
                }
                <div className='home-planCards__card__price-container__current-price'>
                  <p className='home-planCards__card__price-container__current-price__main'>
                    {toPersianNumerals(plan.discount ? plan.discount.newPrice.toLocaleString().replace(',', "،") : plan.price)}
                    <span>
                      هــــزار تومــان
                    </span>
                  </p>

                  {
                    plan.discount && (
                      <p className='home-planCards__card__price-container__current-price__sub'>
                        {`مدت زمان ${toPersianNumerals(plan.discount.daysLeft)} روز `}
                      </p>
                    )
                  }
                </div>
              </div>

              <button className='home-planCards__card__buyBtn'>
                <PiTicketFill aria-hidden='true' />
                خرید
              </button>

              <Link to={'/plan-details'} className="home-planCards__card__more">مشاهده تمام ویژگی ها</Link>
            </div>
          </FreeGate>
        ))
      }
    </Reveal>
  )
}

export default PlanCards
