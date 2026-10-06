import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  PiArrowLeftBold,
  PiCheckCircleFill,
  PiClockFill,
  PiSpinner,
  PiUsersThreeFill,
  PiXCircleFill,
} from 'react-icons/pi';
import { billingApi } from '../../apiCalls/billingApi';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/toast';
import { getApiErrorMessage } from '../../lib/apiError';
import Skeleton from '../../components/skeleton/Skeleton';
import { SEO } from '../../components/seo/SEO';
import './PlanInvite.scss';

const PlanInvite = () => {
  const [params] = useSearchParams();
  const token = (params.get('token') ?? '').trim();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const preview = useQuery({
    queryKey: ['plan-invite', token],
    queryFn: () => billingApi.previewInvite(token).then((response) => response.data),
    enabled: token.length > 0,
    staleTime: 20_000,
  });

  const requestJoin = useMutation({
    mutationFn: () => billingApi.requestPlanJoin(token),
    onSuccess: () => {
      toast.success('درخواست عضویت ارسال شد', {
        description: 'مدیر پلن باید درخواست شما را تایید کند.',
      });
      void queryClient.invalidateQueries({ queryKey: ['plan-invite', token] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'ارسال درخواست عضویت ممکن نبود.')),
  });

  const redirect = useMemo(
    () => `/plan-invite?token=${encodeURIComponent(token)}`,
    [token],
  );

  useEffect(() => {
    if (!isLoading && !user) {
      navigate(`/auth?redirect=${encodeURIComponent(redirect)}`, {
        replace: true,
      });
    }
  }, [isLoading, user, navigate, redirect]);

  if (!isLoading && !user) {
    return null;
  }

  const capacityFull =
    !!preview.data &&
    preview.data.member_count >= preview.data.max_users;
  const alreadyOnPlan = !!user?.current_plan;

  return (
    <>
      <SEO
        title="هم‌نما | دعوت به پلن"
        description="دعوت به عضویت در پلن هم‌نما"
        noindex
      />

      <main className="plan-invite">
        <div className="plan-invite__grain" aria-hidden="true" />
        <div className="plan-invite__blob plan-invite__blob--one" aria-hidden="true" />
        <div className="plan-invite__blob plan-invite__blob--two" aria-hidden="true" />

        <section className="plan-invite__card" aria-labelledby="plan-invite-title">
          <div className="plan-invite__spot" aria-hidden="true" />

          {preview.isLoading ? (
            <div className="plan-invite__loading">
              <div className="plan-invite__mark plan-invite__mark--pending">
                <PiClockFill />
              </div>
              <span className="plan-invite__eyebrow">در حال دریافت دعوت</span>
              <Skeleton variant="text" width="72%" height={34} />
              <Skeleton variant="text" width="88%" height={18} />
              <div className="plan-invite__loading__stats">
                <Skeleton variant="rect" width="100%" height={72} />
                <Skeleton variant="rect" width="100%" height={72} />
              </div>
              <div className="plan-invite__loading__button">
                <Skeleton variant="rect" width="100%" height={48} />
              </div>
            </div>
          ) : preview.error || !preview.data ? (
            <>
              <div className="plan-invite__mark plan-invite__mark--failed">
                <PiXCircleFill />
              </div>

              <span className="plan-invite__eyebrow">دعوت نامعتبر</span>

              <h1 id="plan-invite-title">این دعوت روی پرده نیست.</h1>

              <p className="plan-invite__description">
                این لینک ممکن است منقضی شده باشد یا پلن دیگر فعال نباشد.
              </p>

              <div className="plan-invite__actions">
                <Link className="plan-invite__actions__primary" to="/">
                  <span>بازگشت به خانه</span>
                  <PiArrowLeftBold />
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="plan-invite__mark plan-invite__mark--invite">
                <PiUsersThreeFill />
              </div>

              <span className="plan-invite__eyebrow">دعوت به عضویت</span>

              <h1 id="plan-invite-title">
                دعوت به {preview.data.plan_title}
              </h1>

              <p className="plan-invite__description">
                <strong>{preview.data.owner_username}</strong> شما را به پلن خود دعوت کرده است.
              </p>

              <div className="plan-invite__meta">
                <div className="plan-invite__meta__item">
                  <span>ظرفیت پلن</span>
                  <strong>{preview.data.max_users.toLocaleString('fa-IR')}</strong>
                  <small>نفر</small>
                </div>
                <div className="plan-invite__meta__item">
                  <span>اعضای فعلی</span>
                  <strong>{preview.data.member_count.toLocaleString('fa-IR')}</strong>
                  <small>نفر</small>
                </div>
              </div>

              {alreadyOnPlan ? (
                <div className="plan-invite__notice plan-invite__notice--muted">
                  <PiCheckCircleFill />
                  <span>شما در حال حاضر عضو یک پلن فعال هستید.</span>
                </div>
              ) : capacityFull ? (
                <div className="plan-invite__notice plan-invite__notice--muted">
                  <PiUsersThreeFill />
                  <span>ظرفیت این پلن تکمیل شده است.</span>
                </div>
              ) : (
                <div className="plan-invite__actions">
                  <button
                    type="button"
                    className="plan-invite__actions__primary"
                    disabled={requestJoin.isPending}
                    onClick={() => requestJoin.mutate()}
                  >
                    {requestJoin.isPending ? (
                      <>
                        <PiSpinner className="is-spin" />
                        <span>در حال ارسال...</span>
                      </>
                    ) : (
                      <>
                        <span>درخواست عضویت</span>
                        <PiArrowLeftBold />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          <div className="plan-invite__code" aria-hidden="true">
            <span />
            HAMNAMA INVITATION
            <span />
          </div>
        </section>
      </main>
    </>
  );
};

export default PlanInvite;
