import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PiCalendarMinus,
  PiCaretDownFill,
  PiCheckCircleFill,
  PiHeartFill,
  PiSpinner,
  PiUserFill,
  PiUsersFill,
} from 'react-icons/pi';
import { toast } from '../../components/toast';
import { SEO } from '../../components/seo/SEO';
import { billingApi, type BillingPlan } from '../../apiCalls/billingApi';
import { useAuth } from '../../context/AuthContext';
import './PlanDetails.scss';

const ICONS: Record<string, ReactNode> = {
  single: <PiUserFill />,
  couple: <PiHeartFill />,
  group: <PiUsersFill />,
};

const FEATURES = [
  'تماشای همزمان فیلم و سریال',
  'اتاق خصوصی برای اعضای پلن',
  'گفتگوی متنی همزمان',
  'همراهی چند کاربر با یک اشتراک',
  'پشتیبانی از امکانات کامل هم‌نما',
];

const durationLabel = (months: number) =>
  `${months.toLocaleString('fa-IR')} ماهه`;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    const data = error.response?.data;

    if (typeof data === 'string' && data) {
      return data;
    }

    if (
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof data.message === 'string'
    ) {
      return data.message;
    }
  }

  return fallback;
};

const PlanDetails = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['billing-public'],
    queryFn: () => billingApi.getPublicConfig().then((response) => response.data),
    staleTime: 30_000,
  });
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [quotes, setQuotes] = useState<Record<string, number>>({});

  const quoteMutation = useMutation({
    mutationFn: (payload: {
      plan_id: string;
      duration_months: number;
      discount_code?: string;
    }) => billingApi.quote(payload),
    onSuccess: (response, variables) => {
      setQuotes((current) => ({
        ...current,
        [`${variables.plan_id}-${variables.duration_months}`]:
          response.data.final_price_toman,
      }));
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, 'کد تخفیف معتبر نیست')),
  });

  const payMutation = useMutation({
    mutationFn: (payload: {
      plan_id: string;
      duration_months: number;
      discount_code?: string;
    }) => billingApi.createPayment(payload),
    onSuccess: (response) => {
      window.location.href = response.data.payment_url;
    },
    onError: (error) => toast.error(getErrorMessage(error, 'پرداخت آغاز نشد')),
  });

  const wantedPlan = params.get('plan');
  const plans = (data?.plans ?? []).slice().sort((a, b) =>
    ['single', 'couple', 'group'].indexOf(a.id) -
    ['single', 'couple', 'group'].indexOf(b.id),
  );

  return (
    <>
      <SEO
        title="هم‌نما | پلن‌ها و قیمت‌ها"
        description="پلن‌های هم‌نما را بررسی کنید و بهترین گزینه را برای تماشای فیلم و سریال به همراه دوستانتان انتخاب کنید."
        canonical="https://hamnama.net/plan-details"
      />

      <div className="plan-details">
        {isLoading ? (
          <div className="plan-details__loading">در حال دریافت قیمت‌ها...</div>
        ) : (
          plans.map((plan: BillingPlan) => {
            const months =
              selected[plan.id] ?? plan.durations[0]?.months ?? 1;
            const offer =
              plan.durations.find((duration) => duration.months === months) ??
              plan.durations[0];
            const key = `${plan.id}-${months}`;
            const code = (codes[plan.id] ?? '').trim();
            const displayedPrice = quotes[key] ?? offer?.price_toman ?? 0;
            const alreadyOnPlan = !!user?.current_plan;

            return (
              <div
                className="plan-details__card"
                key={plan.id}
                data-selected={wantedPlan === plan.id}
              >
                <div className="plan-details__card__icon">
                  {ICONS[plan.id]}
                </div>

                <h4 className="plan-details__card__title">{plan.title}</h4>
                <p>
                  ظرفیت: {plan.max_users.toLocaleString('fa-IR')} نفر
                </p>

                <div className="plan-details__card__durations">
                  {plan.durations.map((duration) => (
                    <button
                      type="button"
                      className={`plan-details__card__durations__card ${
                        duration.months === months
                          ? 'plan-details__card__durations__card--selected'
                          : ''
                      }`}
                      key={duration.id}
                      onClick={() => {
                        setSelected((current) => ({
                          ...current,
                          [plan.id]: duration.months,
                        }));
                        setQuotes((current) => {
                          const next = { ...current };
                          delete next[key];
                          return next;
                        });
                      }}
                    >
                      <span>{durationLabel(duration.months)}</span>
                      <PiCalendarMinus />
                    </button>
                  ))}
                </div>

                <div className="plan-details__card__current-price">
                  {offer && offer.discount_percent > 0 && (
                    <div className="plan-details__card__current-price__discount">
                      <div className="plan-details__card__current-price__discount__old-price">
                        {offer.base_price_toman.toLocaleString('fa-IR')}
                      </div>
                      <div className="plan-details__card__current-price__discount__discount-percent">
                        <PiCaretDownFill />
                        {offer.discount_percent.toLocaleString('fa-IR')}%
                      </div>
                    </div>
                  )}

                  <p className="plan-details__card__current-price__main">
                    {displayedPrice.toLocaleString('fa-IR')}
                    <span className="plan-details__card__current-price__currency">
                      تومان
                    </span>
                  </p>
                </div>

                <div className="plan-details__coupon">
                  <input
                    value={code}
                    onChange={(event) =>
                      setCodes((current) => ({
                        ...current,
                        [plan.id]: event.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="کد تخفیف (اختیاری)"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!code) return;

                      quoteMutation.mutate({
                        plan_id: plan.id,
                        duration_months: months,
                        discount_code: code,
                      });
                    }}
                    disabled={!code || quoteMutation.isPending}
                  >
                    {quoteMutation.isPending ? <PiSpinner /> : 'اعمال'}
                  </button>
                </div>

                <button
                  className="plan-details__card__buyBtn"
                  type="button"
                  disabled={
                    alreadyOnPlan ||
                    !offer ||
                    offer.price_toman <= 0 ||
                    payMutation.isPending
                  }
                  onClick={() => {
                    if (!user) {
                      navigate(
                        `/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`,
                      );
                      return;
                    }

                    payMutation.mutate({
                      plan_id: plan.id,
                      duration_months: months,
                      discount_code: code || undefined,
                    });
                  }}
                >
                  {alreadyOnPlan
                    ? 'پلن فعلی شماست'
                    : payMutation.isPending
                      ? 'در حال انتقال به درگاه...'
                      : 'خرید'}
                </button>

                <ul className="plan-details__card__features">
                  {FEATURES.map((feature, index) => (
                    <li key={index}>
                      <PiCheckCircleFill className="plan-details__card__features__icon" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default PlanDetails;
