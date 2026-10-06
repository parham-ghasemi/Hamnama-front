import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  PiArrowLeftBold,
  PiCheckCircleFill,
  PiClockFill,
  PiCreditCardFill,
  PiSpinner,
  PiXCircleFill,
} from 'react-icons/pi';
import { billingApi } from '../../apiCalls/billingApi';
import { getApiErrorMessage } from '../../lib/apiError';
import { toast } from '../../components/toast';
import { useAuth } from '../../context/AuthContext';
import { SEO } from '../../components/seo/SEO';
import './PaymentResult.scss';

const PaymentResult = () => {
  const [params] = useSearchParams();
  const status = params.get('status');
  const paymentID = params.get('payment_id');
  const { user, fetchUser } = useAuth();
  const queryClient = useQueryClient();
  const [reconciling, setReconciling] = useState(false);

  useEffect(() => {
    if (status !== 'success') return;

    void Promise.all([
      fetchUser(),
      queryClient.invalidateQueries({ queryKey: ['billing-public'] }),
      queryClient.invalidateQueries({ queryKey: ['billing-payments'] }),
      queryClient.invalidateQueries({ queryKey: ['billing-plan-users'] }),
      queryClient.invalidateQueries({ queryKey: ['billing-current-plan'] }),
    ]);
    // fetchUser is recreated by AuthContext on render. The callback status is
    // the only dependency that should trigger this refresh sequence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, status]);

  useEffect(() => {
    if (status !== 'success' || !user?.current_plan) return;

    toast.success('پرداخت با موفقیت انجام شد.', {
      description: `اشتراک ${user.current_plan.title} برای حساب شما فعال شد.`,
    });
  }, [status, user?.current_plan?.title]);

  const reconcile = async () => {
    if (!paymentID || reconciling) return;

    setReconciling(true);

    try {
      const response = await billingApi.reconcilePayment(paymentID);

      if (response.data.status === 'success') {
        await fetchUser();
        await queryClient.invalidateQueries({ queryKey: ['billing-payments'] });
        await queryClient.invalidateQueries({ queryKey: ['billing-plan-users'] });
        window.location.replace(
          `/payment-result?status=success&payment_id=${encodeURIComponent(paymentID)}`,
        );
        return;
      }

      if (response.data.status === 'failed') {
        window.location.replace(
          `/payment-result?status=failed&payment_id=${encodeURIComponent(paymentID)}`,
        );
        return;
      }

      toast.info('تأیید پرداخت هنوز تکمیل نشده است. کمی بعد دوباره بررسی کنید.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'بررسی پرداخت ممکن نبود.'));
    } finally {
      setReconciling(false);
    }
  };

  const successful = status === 'success';
  const failed = status === 'failed';
  const processing = !successful && !failed;

  const eyebrow = successful
    ? 'تراکنش تکمیل شد'
    : failed
      ? 'تراکنش ناموفق'
      : 'در انتظار تأیید';

  return (
    <>
      <SEO
        title="هم‌نما | نتیجه پرداخت"
        description="نتیجه پرداخت اشتراک هم‌نما"
        noindex
      />

      <main className="payment-result">
        <div className="payment-result__grain" aria-hidden="true" />
        <div className="payment-result__blob payment-result__blob--one" aria-hidden="true" />
        <div className="payment-result__blob payment-result__blob--two" aria-hidden="true" />

        <section className="payment-result__card">
          <div className="payment-result__spot" aria-hidden="true" />

          <div className={`payment-result__mark payment-result__mark--${successful ? 'success' : failed ? 'failed' : 'pending'}`}>
            {successful ? (
              <PiCheckCircleFill />
            ) : failed ? (
              <PiXCircleFill />
            ) : (
              <PiClockFill />
            )}
          </div>

          <span className="payment-result__eyebrow">
            <PiCreditCardFill />
            {eyebrow}
          </span>

          <h1>
            {successful
              ? 'پرداختت با موفقیت روی پرده رفت.'
              : failed
                ? 'پرداخت کامل نشد.'
                : 'هنوز داریم نتیجه را بررسی می‌کنیم.'}
          </h1>

          <p className="payment-result__description">
            {successful
              ? user?.current_plan
                ? `اشتراک ${user.current_plan.title} برای حساب شما فعال شده است. می‌توانید از امکانات اشتراک استفاده کنید.`
                : 'پرداخت ثبت شده است و اطلاعات اشتراک شما در حال بروزرسانی است.'
              : failed
                ? 'پرداخت تأیید نشد یا لغو شده است. هیچ اشتراکی بدون تأیید نهایی سرور فعال نمی‌شود.'
                : 'ممکن است بازگشت از درگاه قبل از پایان تأیید انجام شده باشد. وضعیت را دوباره بررسی کنید؛ تا قبل از تأیید، اشتراک فعال نمی‌شود.'}
          </p>

          {paymentID && (
            <div className="payment-result__reference" dir="ltr">
              <span>شناسه پرداخت</span>
              <code>{paymentID}</code>
            </div>
          )}

          <div className="payment-result__actions">
            {successful && (
              <Link className="payment-result__actions__primary" to="/user/payments">
                <span>مشاهده پرداخت‌ها</span>
                <PiArrowLeftBold />
              </Link>
            )}

            {processing && paymentID && (
              <button
                type="button"
                className="payment-result__actions__primary"
                onClick={() => void reconcile()}
                disabled={reconciling}
              >
                {reconciling ? (
                  <>
                    <PiSpinner className="is-spin" />
                    بررسی پرداخت
                  </>
                ) : (
                  <>
                    بررسی دوباره
                    <PiArrowLeftBold />
                  </>
                )}
              </button>
            )}

            <Link className="payment-result__actions__ghost" to={successful ? '/user/info' : '/plan-details'}>
              <span>{successful ? 'بازگشت به حساب' : 'بازگشت به پلن‌ها'}</span>
            </Link>
          </div>

          <div className="payment-result__code" aria-hidden="true">
            <span />
            HAMNAMA PAYMENT
            <span />
          </div>
        </section>
      </main>
    </>
  );
};

export default PaymentResult;
