import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BsPeopleFill, BsPersonFill } from 'react-icons/bs';
import {
  PiCaretDownFill,
  PiHeartFill,
  PiTicketFill,
} from 'react-icons/pi';
import type { JSX } from 'react';
import { billingApi, type BillingPlan } from '../../../apiCalls/billingApi';
import { toPersianNumerals } from '../../../helpers/NumberConversion';
import FreeGate from '../freeGate/FreeGate';
import Reveal from '../reveal/Reveal';
import './PlanCards.scss';

const ICONS: Record<string, JSX.Element> = {
  group: <BsPeopleFill />,
  couple: <PiHeartFill />,
  single: <BsPersonFill />,
};

const DESCS: Record<string, string> = {
  group: 'مناسب جمع دوستان و خانوادگی',
  couple: 'با پارتنرت فیلم ببین',
  single: 'مناسب خرید تنها',
};

const PlanCards = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['billing-public'],
    queryFn: () => billingApi.getPublicConfig().then((response) => response.data),
    staleTime: 30_000,
  });

  const plans = (data?.plans ?? []).slice();

  return (
    <Reveal className="home-planCards" variant="fade">
      <div className="home-planCards__blob-bottom" />

      {isLoading
        ? [0, 1, 2].map((index) => (
          <div className="home-planCards__card" key={index} />
        ))
        : plans.map((plan: BillingPlan) => {
          const offer =
            plan.durations.find((duration) => duration.months === 1) ??
            plan.durations[0];
          const hasPrice = (offer?.price_toman ?? 0) > 0;

          return (
            <FreeGate
              className="home-planCards__gate"
              key={plan.id}
              radius={26}
            >
              <div className="home-planCards__card">
                <div className="home-planCards__card__icon">
                  {ICONS[plan.id]}
                </div>

                <h4 className="home-planCards__card__title">{plan.title}</h4>
                <p className="home-planCards__card__desc">
                  {DESCS[plan.id]}
                </p>

                <div className="home-planCards__card__sep" />

                <p className="home-planCards__card__users-title">تعداد کاربر</p>
                <p className="home-planCards__card__users">
                  {toPersianNumerals(plan.max_users)} نفر
                </p>

                <div className="home-planCards__card__price-container">
                  {offer && offer.discount_percent > 0 && (
                    <div className="home-planCards__card__price-container__discount">
                      <div className="home-planCards__card__price-container__discount__old-price">
                        {toPersianNumerals(
                          offer.base_price_toman.toLocaleString('fa-IR'),
                        )}
                      </div>
                      <div className="home-planCards__card__price-container__discount__discount-percent">
                        <PiCaretDownFill />
                        {toPersianNumerals(offer.discount_percent)}%
                      </div>
                    </div>
                  )}

                  <div className="home-planCards__card__price-container__current-price">
                    <p className="home-planCards__card__price-container__current-price__main">
                      {hasPrice
                        ? toPersianNumerals(
                          offer!.price_toman.toLocaleString('fa-IR'),
                        )
                        : '—'}
                      <span> تومان</span>
                    </p>
                    <p className="home-planCards__card__price-container__current-price__sub">
                      مدت ۱ ماه
                    </p>
                  </div>
                </div>

                <button
                  className="home-planCards__card__buyBtn"
                  type="button"
                  onClick={() =>
                    navigate(`/plan-details?plan=${plan.id}`)
                  }
                  disabled={!hasPrice}
                >
                  <PiTicketFill aria-hidden="true" />
                  خرید
                </button>

                <button
                  type="button"
                  className="home-planCards__card__more"
                  onClick={() =>
                    navigate(`/plan-details?plan=${plan.id}`)
                  }
                >
                  مشاهده تمام ویژگی ها
                </button>
              </div>
            </FreeGate>
          );
        })}
    </Reveal>
  );
};

export default PlanCards;
