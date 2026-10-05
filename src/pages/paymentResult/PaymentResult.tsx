import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  PiCheckCircleFill,
  PiSpinner,
  PiXCircleFill,
} from 'react-icons/pi';
import { billingApi } from '../../apiCalls/billingApi';
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
    // fetchUser is intentionally excluded: it is recreated by AuthContext on render.
    // Running this effect only for the callback status prevents an invalidation loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, status]);

  useEffect(() => {
    if (status !== 'success' || !user?.current_plan) return;

    toast.success('پرداخت با موفقیت انجام شد', {
      description: `شما اکنون روی ${user.current_plan.title} هستید.`,
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
        await queryClient.invalidateQueries({
          queryKey: ['billing-plan-users'],
        });
        window.location.replace(
          `/payment-result?status=success&payment_id=${encodeURIComponent(paymentID)}`,
        );
      } else if (response.data.status === 'failed') {
        window.location.replace(
          `/payment-result?status=failed&payment_id=${encodeURIComponent(paymentID)}`,
        );
      } else {
        toast.info('تایید پرداخت هنوز تکمیل نشده است. دوباره بررسی کنید.');
      }
    } catch {
      toast.error('بررسی پرداخت ممکن نبود');
    } finally {
      setReconciling(false);
    }
  };

  const successful = status === 'success';
  const failed = status === 'failed';
  const processing = status === 'processing' || (!successful && !failed);

  return (
    <>
      <SEO
        title="هم‌نما | نتیجه پرداخت"
        description="نتیجه پرداخت اشتراک هم‌نما"
        noindex
      />

      <main className="payment-result">
        <div className="payment-result__card">
          {successful ? (
            <PiCheckCircleFill className="payment-result__icon payment-result__icon--success" />
          ) : failed ? (
            <PiXCircleFill className="payment-result__icon payment-result__icon--failed" />
          ) : (
            <PiSpinner className="payment-result__icon payment-result__icon--pending" />
          )}

          <h1>
            {successful
              ? 'پرداخت موفق بود'
              : failed
                ? 'پرداخت انجام نشد'
                : 'در حال بررسی پرداخت'}
          </h1>

          <p>
            {successful ? (
              user?.current_plan ? (
                `پرداخت ثبت شد و ${user.current_plan.title} برای حساب شما فعال است.`
              ) : (
                'پرداخت ثبت شد. وضعیت اشتراک حساب شما در حال بروزرسانی است.'
              )
            ) : failed ? (
              'پرداخت تایید نشد یا لغو شد. هیچ پلنی بدون تایید سرور فعال نمی‌شود.'
            ) : (
              'پرداخت به درگاه گزارش شده، اما تأیید یا ثبت نهایی در سرور کامل نشده است. می‌توانید دوباره بررسی کنید.'
            )}
          </p>

          <div className="payment-result__actions">
            {successful && (
              <Link to="/user/payments">مشاهده پرداخت‌ها</Link>
            )}

            {processing && paymentID && (
              <button
                type="button"
                onClick={() => void reconcile()}
                disabled={reconciling}
              >
                {reconciling
                  ? 'در حال بررسی...'
                  : 'بررسی دوباره پرداخت'}
              </button>
            )}

            <Link to={successful ? '/user/info' : '/plan-details'}>
              ادامه
            </Link>
          </div>
        </div>
      </main>
    </>
  );
};

export default PaymentResult;
