import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PiArrowLeftBold,
  PiCalendarBlankFill,
  PiCheckCircleFill,
  PiHeartFill,
  PiLightningFill,
  PiLockKeyFill,
  PiSpinner,
  PiTagFill,
  PiUserFill,
  PiUsersThreeFill,
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
  group: <PiUsersThreeFill />,
};

const DESCRIPTIONS: Record<string, string> = {
  single: 'برای تماشای دونفره؟ این انتخاب برای خودت و تجربه شخصی توست.',
  couple: 'برای دو نفر؛ خودت به‌علاوه یک همراه برای شب‌های فیلم.',
  group: 'برای جمع‌های بزرگ‌تر؛ تا ۱۰ نفر در یک اشتراک کنار هم.',
};

const FEATURES = [
  'ساخت و ورود به اتاق‌های تماشا',
  'اتاق خصوصی ویژه اعضای یک پلن',
  'گفتگوی همزمان هنگام تماشا',
  'مدیریت اعضای پلن توسط مدیر',
  'دسترسی به همه امکانات نسخه پولی',
];

const PLAN_ORDER = ['single', 'couple', 'group'];

const formatDuration = (months: number) =>
  `${toPersianNumerals(months)} ماهه`;

const formatPrice = (amount: number) =>
  `${toPersianNumerals(amount.toLocaleString('fa-IR'))} تومان`;

const PlanCardSkeleton = () => (
  <article className="plan-details__card plan-details__card--skeleton" aria-hidden="true">
    <Skeleton variant="circle" width={76} height={76} />
    <Skeleton variant="text" width="42%" height={28} />
    <Skeleton variant="text" width="74%" />
    <div className="plan-details__card__skeleton-divider" />
    <div className="plan-details__card__skeleton-duration">
      {[0, 1, 2].map((item) => (
        <Skeleton key={item} variant="rect" height={62} />
      ))}
    </div>
    <Skeleton variant="rect" width="88%" height={96} />
    <Skeleton variant="rect" width="92%" height={50} />
    <Skeleton variant="text" width="78%" />
    <Skeleton variant="text" width="84%" />
  </article>
);

const PlanDetails = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const wantedPlan = params.get('plan');
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
      toast.success('کد تخفیف اعمال شد');
      setQuoteKeyInFlight(null);
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
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'شروع پرداخت ممکن نبود.')),
  });

  const plans = useMemo(
    () =>
      (configQuery.data?.plans ?? []).slice().sort(
        (a, b) => PLAN_ORDER.indexOf(a.id) - PLAN_ORDER.indexOf(b.id),
      ),
    [configQuery.data?.plans],
  );

  const currentPlanId = user?.current_plan?.plan_id ?? null;
  const currentPlanTitle = user?.current_plan?.title ?? null;

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
        description="پلن مناسب خودت را انتخاب کن و با همراهانت در هم‌نما تماشا کن."
        canonical="https://hamnama.net/plan-details"
      />

      <main className="plan-details">
        <div className="plan-details__ambient plan-details__ambient--one" />
        <div className="plan-details__ambient plan-details__ambient--two" />

        <header className="plan-details__header">
          <div className="plan-details__header__eyebrow">
            <PiLightningFill />
            انتخاب اشتراک هم‌نما
          </div>
          <h1>پلنی را انتخاب کن که با <span>جمع شما</span> جور است.</h1>
          <p>
            قیمت‌ها لحظه‌ای از سرور دریافت می‌شوند. مدت، ظرفیت اعضا و تخفیف را
            انتخاب کن و ادامه مسیر را به درگاه امن بسپار.
          </p>

          {currentPlanTitle && (
            <div className="plan-details__header__current">
              <PiLockKeyFill />
              پلن فعلی شما: <strong>{currentPlanTitle}</strong>
            </div>
          )}
        </header>

        {configQuery.isLoading ? (
          <section className="plan-details__grid" aria-label="در حال بارگذاری پلن‌ها">
            {[0, 1, 2].map((item) => (
              <PlanCardSkeleton key={item} />
            ))}
          </section>
        ) : configQuery.error ? (
          <section className="plan-details__state plan-details__state--error">
            <PiLockKeyFill />
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
              const isSelected = wantedPlan === plan.id;
              const hasPrice = Boolean(offer && offer.price_toman > 0);
              const isQuoting = quoteKeyInFlight === key;

              return (
                <article
                  className={`plan-details__card${isSelected ? ' plan-details__card--featured' : ''}`}
                  key={plan.id}
                >
                  <div className="plan-details__card__spot" aria-hidden="true" />

                  <div className="plan-details__card__icon">{ICONS[plan.id]}</div>

                  {isSelected && (
                    <span className="plan-details__card__badge">انتخاب پیشنهادی شما</span>
                  )}

                  <h2 className="plan-details__card__title">{plan.title}</h2>
                  <p className="plan-details__card__description">
                    {DESCRIPTIONS[plan.id]}
                  </p>

                  <div className="plan-details__card__separator" />

                  <div className="plan-details__card__capacity">
                    <span>ظرفیت پلن</span>
                    <strong>{toPersianNumerals(plan.max_users)} نفر</strong>
                  </div>

                  <div className="plan-details__card__durations" role="tablist">
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
                          <PiCalendarBlankFill />
                          <span>{formatDuration(duration.months)}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="plan-details__card__price">
                    {offer && offer.discount_percent > 0 && (
                      <div className="plan-details__card__price__discount">
                        <span>
                          {formatPrice(offer.base_price_toman)}
                        </span>
                        <strong>
                          {toPersianNumerals(offer.discount_percent)}٪ تخفیف
                        </strong>
                      </div>
                    )}
                    <div className="plan-details__card__price__value">
                      {hasPrice ? toPersianNumerals(displayedPrice.toLocaleString('fa-IR')) : '—'}
                      <small>تومان</small>
                    </div>
                    <span className="plan-details__card__price__caption">
                      برای {toPersianNumerals(months)} ماه دسترسی
                    </span>
                  </div>

                  <div className="plan-details__card__coupon">
                    <div className="plan-details__card__coupon__field">
                      <PiTagFill />
                      <input
                        type="text"
                        value={code}
                        onChange={(event) =>
                          setCodes((current) => ({
                            ...current,
                            [plan.id]: event.target.value,
                          }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') applyCoupon(plan, months);
                        }}
                        placeholder="کد تخفیف"
                        aria-label={`کد تخفیف پلن ${plan.title}`}
                        autoComplete="off"
                      />
                    </div>
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
                        پلن فعلی شماست
                      </>
                    ) : hasAnotherPlan ? (
                      <>
                        <PiLockKeyFill />
                        عضو پلن دیگری هستید
                      </>
                    ) : !configQuery.data?.is_paid ? (
                      'در نسخه رایگان غیرفعال است'
                    ) : !hasPrice ? (
                      'قیمت هنوز تنظیم نشده است'
                    ) : paymentMutation.isPending ? (
                      <>
                        <PiSpinner className="is-spin" />
                        انتقال به درگاه
                      </>
                    ) : !user ? (
                      <>
                        <PiArrowLeftBold />
                        ورود و خرید
                      </>
                    ) : (
                      <>
                        <PiArrowLeftBold />
                        خرید اشتراک
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
