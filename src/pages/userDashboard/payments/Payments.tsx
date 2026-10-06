import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiChevronLeft,
  FiClock,
  FiCreditCard,
  FiXCircle,
} from 'react-icons/fi';
import { billingApi, type BillingPayment } from '../../../apiCalls/billingApi';
import { SEO } from '../../../components/seo/SEO';
import Skeleton from '../../../components/skeleton/Skeleton';
import { toast } from '../../../components/toast';
import { getApiErrorMessage } from '../../../lib/apiError';
import { toPersianNumerals } from '../../../helpers/NumberConversion';
import './Payments.scss';

const STATUS_META: Record<string, { label: string; className: string }> = {
  paid: { label: 'پرداخت شده', className: 'is-success' },
  pending: { label: 'در انتظار پرداخت', className: 'is-pending' },
  failed: { label: 'ناموفق', className: 'is-failed' },
  cancelled: { label: 'لغو شده', className: 'is-failed' },
};

const statusIcon = (status: string) => {
  if (status === 'paid') return <FiCheckCircle />;
  if (status === 'pending') return <FiClock />;
  return <FiXCircle />;
};

const dateLabel = (value: string) =>
  new Date(value).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const PaymentsSkeleton = () => (
  <div className="user-payments__list">
    {[0, 1, 2, 3].map((item) => (
      <div className="user-payments__payment" key={item} aria-hidden="true">
        <Skeleton variant="rect" width={52} height={52} />
        <div className="user-payments__payment__main">
          <Skeleton variant="text" width="110px" />
          <Skeleton variant="text" width="170px" />
        </div>
        <Skeleton variant="text" width="85px" />
        <Skeleton variant="pill" width="94px" height={30} />
      </div>
    ))}
  </div>
);

const Payments = () => {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const paymentsQuery = useQuery({
    queryKey: ['billing-payments', page],
    queryFn: () => billingApi.getPayments(page, 20).then((response) => response.data),
    staleTime: 10_000,
  });

  const reconcile = useMutation({
    mutationFn: (paymentID: string) => billingApi.reconcilePayment(paymentID),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: ['billing-payments'] });
      void queryClient.invalidateQueries({ queryKey: ['billing-plan-users'] });
      void queryClient.invalidateQueries({ queryKey: ['billing-current-plan'] });

      if (response.data.status === 'success') {
        toast.success('پرداخت تأیید شد و اشتراک فعال شد.');
      } else if (response.data.status === 'failed') {
        toast.error('این پرداخت تأیید نشد.');
      } else {
        toast.info('تأیید پرداخت هنوز تکمیل نشده است.');
      }
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'بررسی پرداخت ممکن نبود.')),
  });

  return (
    <>
      <SEO
        title="هم‌نما | پرداخت‌های شما"
        description="سوابق پرداخت‌های حساب هم‌نمای خود را مشاهده کنید."
        canonical="https://hamnama.net/user/payments"
        noindex
      />

      <section className="user-payments">
        <div className="user-payments__ambient user-payments__ambient--one" />
        <div className="user-payments__ambient user-payments__ambient--two" />

        <header className="user-payments__header">
          <div className="user-payments__header__icon">
            <FiCreditCard />
          </div>
          <div>
            <span>حساب کاربری</span>
            <h1>پرداخت‌های شما</h1>
            <p>سوابق سفارش‌ها و وضعیت تأیید پرداخت‌های حساب شما.</p>
          </div>
        </header>

        {paymentsQuery.isLoading ? (
          <PaymentsSkeleton />
        ) : paymentsQuery.error ? (
          <div className="user-payments__state">
            <FiAlertCircle />
            <h2>دریافت سوابق پرداخت ممکن نبود.</h2>
            <p>{getApiErrorMessage(paymentsQuery.error, 'لطفاً دوباره تلاش کنید.')}</p>
            <button type="button" onClick={() => void paymentsQuery.refetch()}>
              تلاش دوباره
            </button>
          </div>
        ) : paymentsQuery.data?.payments.length ? (
          <div className="user-payments__list">
            {paymentsQuery.data.payments.map((payment: BillingPayment) => {
              const meta = STATUS_META[payment.status] ?? {
                label: 'نامشخص',
                className: 'is-pending',
              };

              return (
                <article className="user-payments__payment" key={payment.id}>
                  <div className={`user-payments__payment__status-icon ${meta.className}`}>
                    {statusIcon(payment.status)}
                  </div>

                  <div className="user-payments__payment__main">
                    <div className="user-payments__payment__title-line">
                      <h2>{payment.plan_title}</h2>
                      <span>{toPersianNumerals(payment.duration_months)} ماهه</span>
                    </div>
                    <div className="user-payments__payment__meta">
                      <span>{dateLabel(payment.created_at)}</span>
                      <span dir="ltr">#{payment.id.slice(0, 8)}</span>
                    </div>
                  </div>

                  <div className="user-payments__payment__amount">
                    <span>مبلغ</span>
                    <strong>
                      {toPersianNumerals(payment.amount_toman.toLocaleString('fa-IR'))}
                      <small> تومان</small>
                    </strong>
                  </div>

                  <div className={`user-payments__payment__status ${meta.className}`}>
                    {meta.label}
                    {payment.status === 'pending' && payment.authority && (
                      <button
                        type="button"
                        disabled={reconcile.isPending}
                        onClick={() => reconcile.mutate(payment.id)}
                      >
                        {reconcile.isPending ? 'در حال بررسی...' : 'بررسی پرداخت'}
                      </button>
                    )}
                  </div>

                  <FiChevronLeft className="user-payments__payment__chevron" />
                </article>
              );
            })}
          </div>
        ) : (
          <div className="user-payments__state">
            <FiCreditCard />
            <h2>هنوز پرداختی ثبت نشده است.</h2>
            <p>سوابق خرید اشتراک شما پس از ثبت سفارش در این بخش نمایش داده می‌شود.</p>
          </div>
        )}

        {!!paymentsQuery.data?.pagination.pages &&
          paymentsQuery.data.pagination.pages > 1 && (
            <nav className="user-payments__pagination" aria-label="صفحه‌بندی پرداخت‌ها">
              <button
                type="button"
                disabled={page <= 1 || paymentsQuery.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                صفحه قبل
              </button>
              <span>
                {toPersianNumerals(paymentsQuery.data.pagination.page)} /{' '}
                {toPersianNumerals(paymentsQuery.data.pagination.pages)}
              </span>
              <button
                type="button"
                disabled={
                  page >= paymentsQuery.data.pagination.pages || paymentsQuery.isFetching
                }
                onClick={() =>
                  setPage((current) =>
                    Math.min(paymentsQuery.data?.pagination.pages ?? current, current + 1),
                  )
                }
              >
                صفحه بعد
              </button>
            </nav>
          )}
      </section>
    </>
  );
};

export default Payments;
