import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PiCheckCircleFill, PiUsersThreeFill } from 'react-icons/pi';
import { billingApi } from '../../apiCalls/billingApi';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/toast';
import { SEO } from '../../components/seo/SEO';
import './PlanInvite.scss';

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
      toast.error(getErrorMessage(error, 'ارسال درخواست عضویت ممکن نبود')),
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
        <div className="plan-invite__card">
          <PiUsersThreeFill className="plan-invite__icon" />

          {preview.isLoading ? (
            <p>در حال بررسی لینک دعوت...</p>
          ) : preview.error || !preview.data ? (
            <>
              <h1>لینک دعوت معتبر نیست</h1>
              <p>
                این لینک ممکن است منقضی شده باشد یا پلن دیگر فعال نباشد.
              </p>
              <Link to="/">بازگشت</Link>
            </>
          ) : (
            <>
              <h1>دعوت به {preview.data.plan_title}</h1>
              <p>
                <strong>{preview.data.owner_username}</strong> شما را به پلن خود
                دعوت کرده است.
              </p>

              <div className="plan-invite__meta">
                <span>
                  ظرفیت: {preview.data.max_users.toLocaleString('fa-IR')} نفر
                </span>
                <span>
                  اعضای فعلی:{' '}
                  {preview.data.member_count.toLocaleString('fa-IR')} نفر
                </span>
              </div>

              {alreadyOnPlan ? (
                <div className="plan-invite__notice">
                  <PiCheckCircleFill />
                  شما در حال حاضر عضو یک پلن فعال هستید.
                </div>
              ) : capacityFull ? (
                <div className="plan-invite__notice">
                  ظرفیت این پلن تکمیل شده است.
                </div>
              ) : (
                <button
                  type="button"
                  disabled={requestJoin.isPending}
                  onClick={() => requestJoin.mutate()}
                >
                  {requestJoin.isPending
                    ? 'در حال ارسال...'
                    : 'درخواست عضویت'}
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default PlanInvite;
