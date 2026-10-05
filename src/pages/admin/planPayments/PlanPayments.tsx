import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { FiCheck, FiCreditCard, FiPercent, FiSave, FiTag } from 'react-icons/fi';
import {
  billingAdminApi,
  type AdminBillingPlan,
} from '../../../apiCalls/adminApi';
import { toast } from '../../../components/toast';
import './PlanPayments.scss';

const errorText = (error: unknown, fallback: string) => {
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

const PlanPayments = () => {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ['admin-billing-settings'],
    queryFn: () => billingAdminApi.getBillingSettings().then((r) => r.data),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const plansQuery = useQuery({
    queryKey: ['admin-billing-plans'],
    queryFn: () => billingAdminApi.getBillingPlans().then((r) => r.data),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const codesQuery = useQuery({
    queryKey: ['admin-discount-codes'],
    queryFn: () => billingAdminApi.getDiscountCodes().then((r) => r.data),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const [paid, setPaid] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [overlayTitle, setOverlayTitle] = useState('');
  const [overlayMessage, setOverlayMessage] = useState('');
  const [offerEdits, setOfferEdits] = useState<
    Record<string, { price: string; discount: string }>
  >({});
  const [planDiscounts, setPlanDiscounts] = useState<Record<string, string>>(
    {},
  );
  const [code, setCode] = useState('');
  const [codeDiscount, setCodeDiscount] = useState('');
  const [codeExpiry, setCodeExpiry] = useState('');
  const [codeMaxUses, setCodeMaxUses] = useState('');

  useEffect(() => {
    if (!settingsQuery.data) return;

    setPaid(settingsQuery.data.is_paid);
    setGlobalDiscount(settingsQuery.data.global_discount_percent);
    setOverlayTitle(settingsQuery.data.free_overlay_title);
    setOverlayMessage(settingsQuery.data.free_overlay_message);
  }, [settingsQuery.data]);

  useEffect(() => {
    if (!plansQuery.data) return;

    const offers: Record<string, { price: string; discount: string }> = {};
    const discounts: Record<string, string> = {};

    plansQuery.data.plans.forEach((plan) => {
      discounts[plan.id] = String(plan.discount_percent);

      plan.durations.forEach((offer) => {
        offers[offer.id] = {
          price: String(offer.base_price_irr),
          discount: String(offer.discount_percent),
        };
      });
    });

    setOfferEdits(offers);
    setPlanDiscounts(discounts);
  }, [plansQuery.data]);

  const settingsMutation = useMutation({
    mutationFn: () =>
      billingAdminApi.updateBillingSettings({
        is_paid: paid,
        global_discount_percent: Number(globalDiscount),
        free_overlay_title: overlayTitle,
        free_overlay_message: overlayMessage,
      }),
    onSuccess: () => {
      toast.success('تنظیمات ذخیره شد');
      void queryClient.invalidateQueries({
        queryKey: ['admin-billing-settings'],
      });
      void queryClient.invalidateQueries({ queryKey: ['billing-public'] });
    },
    onError: (error) =>
      toast.error(errorText(error, 'ذخیره تنظیمات ممکن نبود')),
  });

  const updatePlanDiscountMutation = useMutation({
    mutationFn: (payload: { id: string; discount: number }) =>
      billingAdminApi.updateBillingPlanDiscount(payload.id, payload.discount),
    onSuccess: () => {
      toast.success('تخفیف پلن ذخیره شد');
      void queryClient.invalidateQueries({
        queryKey: ['admin-billing-plans'],
      });
      void queryClient.invalidateQueries({ queryKey: ['billing-public'] });
    },
    onError: (error) =>
      toast.error(errorText(error, 'ذخیره تخفیف پلن ممکن نبود')),
  });

  const updateOfferMutation = useMutation({
    mutationFn: (payload: { id: string; price: number; discount: number }) =>
      billingAdminApi.updateBillingOffer(payload.id, {
        base_price_irr: payload.price,
        discount_percent: payload.discount,
      }),
    onSuccess: () => {
      toast.success('قیمت و تخفیف ذخیره شد');
      void queryClient.invalidateQueries({
        queryKey: ['admin-billing-plans'],
      });
      void queryClient.invalidateQueries({ queryKey: ['billing-public'] });
    },
    onError: (error) =>
      toast.error(errorText(error, 'ذخیره قیمت ممکن نبود')),
  });

  const createCodeMutation = useMutation({
    mutationFn: () =>
      billingAdminApi.createDiscountCode({
        code: code.trim().toUpperCase(),
        discount_percent: Number(codeDiscount),
        expires_at: new Date(codeExpiry).toISOString(),
        max_uses: codeMaxUses.trim() ? Number(codeMaxUses) : null,
      }),
    onSuccess: () => {
      setCode('');
      setCodeDiscount('');
      setCodeExpiry('');
      setCodeMaxUses('');
      toast.success('کد تخفیف ساخته شد');
      void queryClient.invalidateQueries({
        queryKey: ['admin-discount-codes'],
      });
    },
    onError: (error) => toast.error(errorText(error, 'ساخت کد تخفیف ممکن نبود')),
  });

  const busy =
    settingsMutation.isPending ||
    updatePlanDiscountMutation.isPending ||
    updateOfferMutation.isPending;
  const hasUnpriced = useMemo(
    () =>
      plansQuery.data?.plans.some((plan) =>
        plan.durations.some((offer) => offer.base_price_irr <= 0),
      ) ?? true,
    [plansQuery.data],
  );

  return (
    <section className="admin-billing">
      <header className="admin-billing__header">
        <div>
          <span>Plans & Payments</span>
          <h1>پلن‌ها و پرداخت‌ها</h1>
          <p>کنترل قیمت‌ها، تخفیف‌ها و وضعیت پرداخت پولی سایت.</p>
        </div>
        <FiCreditCard aria-hidden />
      </header>

      <div className="admin-billing__mode">
        <div>
          <strong>حالت سایت</strong>
          <span>{paid ? 'نسخه پولی فعال است' : 'نسخه رایگان فعال است'}</span>
        </div>
        <label className="admin-billing__switch">
          <input
            type="checkbox"
            checked={paid}
            onChange={(event) => setPaid(event.target.checked)}
            disabled={busy}
          />
          <span />
        </label>
        {paid && hasUnpriced && (
          <small>
            قبل از فعال‌سازی نسخه پولی، هر ۹ قیمت باید مقدار معتبر داشته باشند.
          </small>
        )}
      </div>

      <div className="admin-billing__settings admin-billing__card">
        <div className="admin-billing__section-title">
          <FiPercent />
          <h2>تخفیف سراسری و گیت رایگان</h2>
        </div>

        <div className="admin-billing__form-grid">
          <label>
            تخفیف کل سایت (%)
            <input
              type="number"
              min={0}
              max={100}
              value={globalDiscount}
              onChange={(event) => setGlobalDiscount(Number(event.target.value))}
            />
          </label>
          <label>
            عنوان گیت رایگان
            <input
              value={overlayTitle}
              onChange={(event) => setOverlayTitle(event.target.value)}
            />
          </label>
          <label className="wide">
            پیام گیت رایگان
            <textarea
              value={overlayMessage}
              onChange={(event) => setOverlayMessage(event.target.value)}
              rows={3}
            />
          </label>
        </div>

        <button
          className="admin-billing__primary"
          type="button"
          disabled={settingsMutation.isPending}
          onClick={() => settingsMutation.mutate()}
        >
          <FiSave />
          ذخیره تنظیمات
        </button>
      </div>

      <div className="admin-billing__card">
        <div className="admin-billing__section-title">
          <FiCreditCard />
          <h2>قیمت ثابت ۳ پلن × ۳ مدت</h2>
        </div>
        <p className="admin-billing__hint">
          قیمت‌ها در بانک اطلاعاتی ریال هستند و هیچ قیمت یا مبلغ پرداختی از
          فرانت‌اند قابل اعتماد نیست. یک تومان برابر ۱۰ ریال نمایش داده می‌شود.
        </p>

        {plansQuery.isLoading ? (
          <p>در حال بارگذاری...</p>
        ) : (
          plansQuery.data?.plans.map((plan: AdminBillingPlan) => (
            <div className="admin-billing__plan" key={plan.id}>
              <div className="admin-billing__plan-head">
                <div>
                  <h3>{plan.title}</h3>
                  <span>حداکثر {plan.max_users} نفر</span>
                </div>
                <label>
                  تخفیف پلن (%)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={
                      planDiscounts[plan.id] ?? String(plan.discount_percent)
                    }
                    onChange={(event) =>
                      setPlanDiscounts((state) => ({
                        ...state,
                        [plan.id]: event.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    disabled={updatePlanDiscountMutation.isPending}
                    onClick={() =>
                      updatePlanDiscountMutation.mutate({
                        id: plan.id,
                        discount: Number(
                          planDiscounts[plan.id] ?? plan.discount_percent,
                        ),
                      })
                    }
                  >
                    ذخیره
                  </button>
                </label>
              </div>

              <div className="admin-billing__offers">
                {plan.durations.map((offer) => {
                  const value =
                    offerEdits[offer.id] ?? {
                      price: String(offer.base_price_irr),
                      discount: String(offer.discount_percent),
                    };

                  return (
                    <div className="admin-billing__offer" key={offer.id}>
                      <div>
                        <strong>{offer.months} ماه</strong>
                        <span>
                          {Number(value.price || 0).toLocaleString('en-US')} ریال
                        </span>
                      </div>

                      <label>
                        قیمت ریالی
                        <input
                          type="number"
                          min={10}
                          step={10}
                          value={value.price}
                          onChange={(event) =>
                            setOfferEdits((state) => ({
                              ...state,
                              [offer.id]: {
                                ...value,
                                price: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>

                      <label>
                        تخفیف مدت (%)
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={value.discount}
                          onChange={(event) =>
                            setOfferEdits((state) => ({
                              ...state,
                              [offer.id]: {
                                ...value,
                                discount: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>

                      <button
                        type="button"
                        disabled={updateOfferMutation.isPending}
                        onClick={() =>
                          updateOfferMutation.mutate({
                            id: offer.id,
                            price: Number(value.price),
                            discount: Number(value.discount),
                          })
                        }
                      >
                        ذخیره
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="admin-billing__card">
        <div className="admin-billing__section-title">
          <FiTag />
          <h2>کدهای تخفیف</h2>
        </div>

        <div className="admin-billing__code-form">
          <label>
            کد
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="HAMNAMA10"
            />
          </label>
          <label>
            درصد
            <input
              type="number"
              min={1}
              max={100}
              value={codeDiscount}
              onChange={(event) => setCodeDiscount(event.target.value)}
            />
          </label>
          <label>
            تاریخ انقضا
            <input
              type="datetime-local"
              value={codeExpiry}
              onChange={(event) => setCodeExpiry(event.target.value)}
            />
          </label>
          <label>
            حداکثر استفاده
            <input
              type="number"
              min={1}
              value={codeMaxUses}
              onChange={(event) => setCodeMaxUses(event.target.value)}
              placeholder="نامحدود"
            />
          </label>
          <button
            className="admin-billing__primary"
            type="button"
            disabled={
              !code || !codeExpiry || !codeDiscount || createCodeMutation.isPending
            }
            onClick={() => createCodeMutation.mutate()}
          >
            <FiCheck />
            ساخت کد
          </button>
        </div>

        <div className="admin-billing__codes">
          {codesQuery.data?.codes.map((item) => (
            <div className="admin-billing__code-row" key={item.id}>
              <strong>{item.code}</strong>
              <span>{item.discount_percent}%</span>
              <span>{new Date(item.expires_at).toLocaleString('fa-IR')}</span>
              <span>
                {item.used_count + item.reserved_count}
                {item.max_uses != null ? ` / ${item.max_uses}` : ''} استفاده
              </span>
              <b>{item.active ? 'فعال' : 'منقضی'}</b>
            </div>
          ))}
          {!codesQuery.isLoading && !codesQuery.data?.codes.length && (
            <p>کد تخفیفی ساخته نشده است.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default PlanPayments;
