import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingApi, type BillingPayment } from '../../../apiCalls/billingApi';
import { SEO } from '../../../components/seo/SEO';
import Skeleton from '../../../components/skeleton/Skeleton';
import { toast } from '../../../components/toast';
import { getApiErrorMessage } from '../../../lib/apiError';
import { toPersianNumerals } from '../../../helpers/NumberConversion';
import './Payments.scss';

const PAYMENT_STATUS: Record<string, { label: string; className: 'green' | 'red' }> = {
  paid: { label: 'پرداخت شده', className: 'green' },
  pending: { label: 'در انتظار پرداخت', className: 'red' },
  failed: { label: 'پرداخت ناموفق', className: 'red' },
  cancelled: { label: 'لغو شده', className: 'red' },
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

const formatAmount = (value: number) =>
  toPersianNumerals(value.toLocaleString('fa-IR').replace(/٬/g, '،'));

const PaymentsSkeleton = () => (
  <div className="user-payments__list-container__body-wrapper" aria-busy="true" aria-label="در حال بارگذاری پرداخت‌ها">
    {[0, 1, 2, 3].map((item) => (
      <div
        className="user-payments__list-container__body-wrapper__row user-payments__list-container__body-wrapper__row--skeleton"
        key={item}
      >
        {[0, 1, 2, 3, 4].map((cell) => (
          <div
            className="user-payments__list-container__body-wrapper__row__cell"
            key={cell}
          >
            <Skeleton variant="text" width={cell === 1 ? 120 : 86} height={18} />
          </div>
        ))}
      </div>
    ))}
  </div>
);

const Payments = () => {
  const queryClient = useQueryClient();
  const paymentsQuery = useQuery({
    queryKey: ['billing-payments', 1],
    queryFn: () => billingApi.getPayments(1, 20).then((response) => response.data),
    staleTime: 10_000,
  });

  const reconcile = useMutation({
    mutationFn: (paymentId: string) => billingApi.reconcilePayment(paymentId),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: ['billing-payments'] });
      void queryClient.invalidateQueries({ queryKey: ['billing-current-plan'] });
      void queryClient.invalidateQueries({ queryKey: ['billing-plan-users'] });

      if (response.data.status === 'success') {
        toast.success('پرداخت با موفقیت تأیید شد و پلن شما فعال شد.');
      } else if (response.data.status === 'failed') {
        toast.error('پرداخت شما تأیید نشد.');
      } else {
        toast.info('وضعیت پرداخت هنوز مشخص نشده است.');
      }
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'بررسی پرداخت ممکن نبود.'));
    },
  });

  return (
    <>
      <SEO
        title="هم‌نما | پرداخت‌های شما"
        description="پرداخت‌های خود را در هم‌نما مدیریت و بررسی کنید."
        canonical="https://hamnama.net/user/payments"
        noindex
      />

      <div className="user-payments">
        <div className="user-payments__blob" />

        <div className="user-payments__list-container">
          <div className="user-payments__list-container__header">
            <div className="user-payments__list-container__header__cell">
              تاریخ سفارش
            </div>
            <div className="user-payments__list-container__header__cell">
              نوع سفارش
            </div>
            <div className="user-payments__list-container__header__cell">
              شماره سفارش
            </div>
            <div className="user-payments__list-container__header__cell">
              مبلغ پرداختی
            </div>
            <div className="user-payments__list-container__header__cell">
              وضعیت پرداخت
            </div>
          </div>

          {paymentsQuery.isLoading ? (
            <PaymentsSkeleton />
          ) : paymentsQuery.error ? (
            <div className="user-payments__state">
              <strong>دریافت سوابق پرداخت ممکن نبود.</strong>
              <span>{getApiErrorMessage(paymentsQuery.error, 'لطفاً دوباره تلاش کنید.')}</span>
              <button type="button" onClick={() => void paymentsQuery.refetch()}>
                تلاش دوباره
              </button>
            </div>
          ) : paymentsQuery.data?.payments.length ? (
            <div className="user-payments__list-container__body-wrapper">
              {paymentsQuery.data.payments.map((payment: BillingPayment) => {
                const status =
                  PAYMENT_STATUS[payment.status] ?? {
                    label: 'نامشخص',
                    className: 'red' as const,
                  };

                return (
                  <div
                    key={payment.id}
                    className="user-payments__list-container__body-wrapper__row"
                  >
                    <div className="user-payments__list-container__body-wrapper__row__cell">
                      {toPersianNumerals(formatDate(payment.created_at))}
                    </div>

                    <div className="user-payments__list-container__body-wrapper__row__cell">
                      <span className="user-payments__list-container__body-wrapper__row__cell__text">
                        {payment.plan_title}
                      </span>
                      {toPersianNumerals(payment.duration_months)} ماهه
                    </div>

                    <div className="user-payments__list-container__body-wrapper__row__cell" dir="ltr">
                      {payment.id.slice(0, 8)}
                    </div>

                    <div className="user-payments__list-container__body-wrapper__row__cell">
                      {formatAmount(payment.amount_toman)}
                      <span className="user-payments__list-container__body-wrapper__row__cell__text">
                        تومان
                      </span>
                    </div>

                    <div
                      className={`user-payments__list-container__body-wrapper__row__cell ${status.className}`}
                    >
                      <span>{status.label}</span>
                      {payment.status === 'pending' && payment.authority ? (
                        <button
                          type="button"
                          className="user-payments__reconcile"
                          disabled={reconcile.isPending}
                          onClick={() => reconcile.mutate(payment.id)}
                        >
                          {reconcile.isPending ? 'در حال بررسی...' : 'بررسی پرداخت'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="user-payments__state">
              <strong>هنوز پرداختی ثبت نشده است.</strong>
              <span>سوابق پرداخت‌های شما پس از اولین خرید در این بخش نمایش داده می‌شود.</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Payments;
