import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingApi, type BillingPayment } from '../../../apiCalls/billingApi';
import { SEO } from '../../../components/seo/SEO';
import { toast } from '../../../components/toast';
import './Payments.scss';

const statusLabel = (status: string) =>
  ({
    paid: 'پرداخت شده',
    pending: 'در انتظار پرداخت',
    failed: 'ناموفق',
    cancelled: 'لغو شده',
  })[status] ?? status;

const statusClass = (status: string) =>
  status === 'paid' ? 'green' : status === 'pending' ? 'amber' : 'red';

const dateLabel = (value: string) =>
  new Date(value).toLocaleDateString('fa-IR');

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

      if (response.data.status === 'success') {
        toast.success('پرداخت تایید و اشتراک فعال شد');
      } else if (response.data.status === 'failed') {
        toast.error('این پرداخت تایید نشد');
      } else {
        toast.info('تایید پرداخت هنوز تکمیل نشده است');
      }
    },
    onError: () => toast.error('بررسی پرداخت ممکن نبود'),
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

          <div className="user-payments__list-container__body-wrapper">
            {paymentsQuery.isLoading ? (
              <div className="user-payments__state">
                در حال دریافت سوابق پرداخت...
              </div>
            ) : paymentsQuery.error ? (
              <div className="user-payments__state">
                دریافت سوابق پرداخت ممکن نبود.
              </div>
            ) : paymentsQuery.data?.payments.length ? (
              paymentsQuery.data.payments.map((payment: BillingPayment) => (
                <div
                  key={payment.id}
                  className="user-payments__list-container__body-wrapper__row"
                >
                  <div className="user-payments__list-container__body-wrapper__row__cell">
                    {dateLabel(payment.created_at)}
                  </div>
                  <div className="user-payments__list-container__body-wrapper__row__cell">
                    <span className="user-payments__list-container__body-wrapper__row__cell__text">
                      {payment.plan_title}
                    </span>
                    {payment.duration_months.toLocaleString('fa-IR')} ماه
                  </div>
                  <div
                    className="user-payments__list-container__body-wrapper__row__cell"
                    title={payment.id}
                  >
                    {payment.id.slice(0, 8)}…
                  </div>
                  <div className="user-payments__list-container__body-wrapper__row__cell">
                    {payment.amount_toman.toLocaleString('fa-IR')} تومان
                  </div>
                  <div
                    className={`user-payments__list-container__body-wrapper__row__cell ${statusClass(payment.status)}`}
                  >
                    {statusLabel(payment.status)}
                    {payment.status === 'pending' && payment.authority && (
                      <button
                        type="button"
                        className="user-payments__reconcile"
                        disabled={reconcile.isPending}
                        onClick={() => reconcile.mutate(payment.id)}
                      >
                        بررسی
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="user-payments__state">
                هنوز پرداختی برای حساب شما ثبت نشده است.
              </div>
            )}
          </div>

          {!!paymentsQuery.data?.pagination.pages &&
            paymentsQuery.data.pagination.pages > 1 && (
              <div className="user-payments__pagination">
                <button
                  type="button"
                  disabled={page <= 1 || paymentsQuery.isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  صفحه قبل
                </button>
                <span>
                  {paymentsQuery.data.pagination.page.toLocaleString('fa-IR')} /{' '}
                  {paymentsQuery.data.pagination.pages.toLocaleString('fa-IR')}
                </span>
                <button
                  type="button"
                  disabled={
                    page >= paymentsQuery.data.pagination.pages ||
                    paymentsQuery.isFetching
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        paymentsQuery.data?.pagination.pages ?? current,
                        current + 1,
                      ),
                    )
                  }
                >
                  صفحه بعد
                </button>
              </div>
            )}
        </div>
      </div>
    </>
  );
};

export default Payments;
