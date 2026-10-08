import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PiArrowLeftBold,
  PiCalendarMinus,
  PiCheckCircleFill,
  PiHeartFill,
  PiSpinner,
  PiTagFill,
  PiTicketFill,
  PiUserFill,
  PiUsersFill,
} from 'react-icons/pi';
import { billingApi, type BillingPlan } from '../../apiCalls/billingApi';
import { getApiErrorMessage } from '../../lib/apiError';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/toast';
import { SEO } from '../../components/seo/SEO';
import Skeleton from '../../components/skeleton/Skeleton';
import { toPersianNumerals } from '../../helpers/NumberConversion';
import './PlanDetails.scss';

const ICONS: Record<string, ReactNode> = {
  single: <PiUserFill />,
  couple: <PiHeartFill />,
  group: <PiUsersFill />,
};

const DESCRIPTIONS: Record<string, string> = {
  single: 'مناسب خرید تنها',
  couple: 'با پارتنرت فیلم ببین',
  group: 'مناسب جمع دوستان و خانوادگی',
};

const FEATURES = [
  'تماشای همزمان فیلم و سریال',
  'اتاق خصوصی برای اعضای پلن',
  'گفت‌وگو و تعامل هنگام تماشا',
  'مدیریت اعضای پلن',
];

const PLAN_ORDER = ['single', 'couple', 'group'];

const formatDuration = (months: number) =>
  `${toPersianNumerals(months)} ماهه`;

const formatPrice = (amount: number) =>
  `${toPersianNumerals(amount.toLocaleString('fa-IR'))} تومان`;

const PlanCardSkeleton = () => (
  <article className="plan-details__card plan-details__card--skeleton" aria-hidden="true">
    <Skeleton variant="rect" width={72} height={72} radius={17} />
    <Skeleton variant="text" width="42%" height={28} />
    <Skeleton variant="text" width="64%" />
    <div className="plan-details__card__skeleton-sep" />
    <Skeleton variant="text" width="30%" />
    <Skeleton variant="text" width="22%" height={24} />
    <div className="plan-details__card__skeleton-durations">
      {[0, 1, 2].map((item) => (
        <Skeleton key={item} variant="rect" height={46} radius={12} />
      ))}
    </div>
    <Skeleton variant="text" width="44%" height={42} />
    <Skeleton variant="rect" width="100%" height={44} radius={13} />
  </article>
);

const PlanDetails = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [quotes, setQuotes] = useState<Record<string, number>>({});
  const [quoteKeyInFlight, setQuoteKeyInFlight] = useState<string | null>(null);

  const configQuery = useQuery({
    queryKey: ['billing-public'],
    queryFn: () => billingApi.getPublicConfig().then((response) => response.data),
    staleTime: 30_000,
  });

  const quoteMutation = useMutation({
    mutationFn: (payload: {
      plan_id: string;
      duration_months: number;
      discount_code?: string;
    }) => billingApi.quote(payload),
    onSuccess: (response, variables) => {
      const key = `${variables.plan_id}-${variables.duration_months}`;
      setQuotes((current) => ({
        ...current,
        [key]: response.data.final_price_toman,
      }));
      setQuoteKeyInFlight(null);
      toast.success('کد تخفیف با موفقیت اعمال شد.');
    },
    onError: (error) => {
      setQuoteKeyInFlight(null);
      toast.error(getApiErrorMessage(error, 'کد تخفیف قابل استفاده نیست.'));
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (payload: {
      plan_id: string;
      duration_months: number;
      discount_code?: string;
    }) => billingApi.createPayment(payload),
    onSuccess: (response) => {
      window.location.assign(response.data.payment_url);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'شروع پرداخت ممکن نبود.'));
    },
  });

  const plans = (configQuery.data?.plans ?? [])
    .slice()
    .sort((a, b) => PLAN_ORDER.indexOf(a.id) - PLAN_ORDER.indexOf(b.id));

  const currentPlanId = user?.current_plan?.plan_id ?? null;

  const applyCoupon = (plan: BillingPlan, months: number) => {
    const code = (codes[plan.id] ?? '').trim().toUpperCase();
    if (!code) return;

    const key = `${plan.id}-${months}`;
    setQuoteKeyInFlight(key);
    quoteMutation.mutate({
      plan_id: plan.id,
      duration_months: months,
      discount_code: code,
    });
  };

  const goToLogin = () => {
    navigate(
      `/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`,
    );
  };

  return (
    <>
      <SEO
        title="هم‌نما | پلن‌ها و قیمت‌ها"
        description="پلن مناسب خود را برای تماشای همزمان با دوستانتان انتخاب کنید."
        canonical="https://hamnama.net/plan-details"
      />

      <main className="plan-details">
        <div className="plan-details__blob" aria-hidden="true" />

        <header className="plan-details__header">
          <span>پلن‌های هم‌نما</span>
          <h1>پلن مناسب خودت را انتخاب کن</h1>
          <p>
            ظرفیت و مدت را انتخاب کن. قیمت‌ها و تخفیف‌ها همیشه از سرور دریافت
            می‌شوند.
          </p>
        </header>

        {configQuery.isLoading ? (
          <section className="plan-details__grid" aria-label="در حال بارگذاری پلن‌ها">
            {[0, 1, 2].map((item) => (
              <PlanCardSkeleton key={item} />
            ))}
          </section>
        ) : configQuery.error ? (
          <section className="plan-details__state">
            <h2>دریافت اطلاعات پلن‌ها ممکن نبود.</h2>
            <p>{getApiErrorMessage(configQuery.error, 'لطفاً دوباره تلاش کنید.')}</p>
            <button type="button" onClick={() => void configQuery.refetch()}>
              تلاش دوباره
            </button>
          </section>
        ) : (
          <section className="plan-details__grid">
            {plans.map((plan: BillingPlan) => {
              const months =
                selected[plan.id] ?? plan.durations[0]?.months ?? 1;
              const offer =
                plan.durations.find((duration) => duration.months === months) ??
                plan.durations[0];
              const key = `${plan.id}-${months}`;
              const code = (codes[plan.id] ?? '').trim().toUpperCase();
              const displayedPrice = quotes[key] ?? offer?.price_toman ?? 0;
              const isCurrent = currentPlanId === plan.id;
              const hasAnotherPlan = Boolean(
                currentPlanId && currentPlanId !== plan.id,
              );
              const hasPrice = Boolean(offer && offer.price_toman > 0);
              const isQuoting = quoteKeyInFlight === key;

              return (
                <article className="plan-details__card" key={plan.id}>
                  <div className="plan-details__card__icon">{ICONS[plan.id]}</div>

                  <h2 className="plan-details__card__title">{plan.title}</h2>
                  <p className="plan-details__card__description">
                    {DESCRIPTIONS[plan.id]}
                  </p>

                  <div className="plan-details__card__sep" />

                  <div className="plan-details__card__users">
                    <span>تعداد کاربر</span>
                    <strong>{toPersianNumerals(plan.max_users)} نفر</strong>
                  </div>

                  <div className="plan-details__card__durations">
                    {plan.durations.map((duration) => {
                      const active = duration.months === months;

                      return (
                        <button
                          type="button"
                          key={duration.id}
                          className={active ? 'is-active' : ''}
                          aria-pressed={active}
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
                          <span>{formatDuration(duration.months)}</span>
                          <PiCalendarMinus />
                        </button>
                      );
                    })}
                  </div>

                  <div className="plan-details__card__price">
                    {offer && offer.discount_percent > 0 ? (
                      <div className="plan-details__card__price__discount">
                        <span>{formatPrice(offer.base_price_toman)}</span>
                        <strong>
                          {toPersianNumerals(offer.discount_percent)}٪ تخفیف
                        </strong>
                      </div>
                    ) : null}
                    <div className="plan-details__card__price__main">
                      {hasPrice
                        ? toPersianNumerals(
                          displayedPrice.toLocaleString('fa-IR'),
                        )
                        : '—'}
                      <span> تومان</span>
                    </div>
                    <small>مدت {toPersianNumerals(months)} ماه</small>
                  </div>

                  <div className="plan-details__card__coupon">
                    <PiTagFill aria-hidden="true" />
                    <input
                      type="text"
                      value={code}
                      onChange={(event) => {
                        const value = event.target.value.toUpperCase();
                        setCodes((current) => ({
                          ...current,
                          [plan.id]: value,
                        }));
                        setQuotes((current) => {
                          const next = { ...current };
                          delete next[key];
                          return next;
                        });
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          applyCoupon(plan, months);
                        }
                      }}
                      placeholder="کد تخفیف دارید؟"
                      aria-label={`کد تخفیف ${plan.title}`}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      disabled={!code || quoteMutation.isPending}
                      onClick={() => applyCoupon(plan, months)}
                    >
                      {isQuoting ? <PiSpinner className="is-spin" /> : 'اعمال'}
                    </button>
                  </div>

                  <button
                    className="plan-details__card__buy"
                    type="button"
                    disabled={
                      isCurrent ||
                      hasAnotherPlan ||
                      !hasPrice ||
                      !configQuery.data?.is_paid ||
                      paymentMutation.isPending
                    }
                    onClick={() => {
                      if (!user) {
                        goToLogin();
                        return;
                      }

                      paymentMutation.mutate({
                        plan_id: plan.id,
                        duration_months: months,
                        discount_code: code || undefined,
                      });
                    }}
                  >
                    {isCurrent ? (
                      <>
                        <PiCheckCircleFill />
                        پلن فعلی
                      </>
                    ) : hasAnotherPlan ? (
                      <>
                        <PiCheckCircleFill />
                        عضو پلن دیگری هستید
                      </>
                    ) : !configQuery.data?.is_paid ? (
                      'در نسخه رایگان امکان خرید وجود ندارد'
                    ) : !hasPrice ? (
                      'قیمت هنوز تنظیم نشده است'
                    ) : paymentMutation.isPending ? (
                      <>
                        <PiSpinner className="is-spin" />
                        در حال انتقال به درگاه
                      </>
                    ) : !user ? (
                      <>
                        <PiArrowLeftBold />
                        ورود برای خرید
                      </>
                    ) : (
                      <>
                        <PiTicketFill />
                        خرید پلن
                      </>
                    )}
                  </button>

                  <ul className="plan-details__card__features">
                    {FEATURES.map((feature) => (
                      <li key={feature}>
                        <PiCheckCircleFill />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </>
  );
};

export default PlanDetails;
