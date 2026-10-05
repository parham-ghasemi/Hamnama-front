import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { BsPlusLg } from 'react-icons/bs';
import {
  FiCheck,
  FiCopy,
  FiRefreshCw,
  FiUserX,
  FiX,
} from 'react-icons/fi';
import { billingApi, type PlanMember } from '../../../apiCalls/billingApi';
import { toast } from '../../../components/toast';
import { toPersianNumerals } from '../../../helpers/NumberConversion';
import './PlanUsers.scss';

const errorText = (error: unknown) => {
  if (error instanceof AxiosError) {
    const data = error.response?.data;

    if (typeof data === 'string') {
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

  return '';
};

const PlanUsers = () => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['billing-plan-users'],
    queryFn: () => billingApi.getPlanUsers().then((response) => response.data),
    retry: false,
  });

  const refresh = useMutation({
    mutationFn: billingApi.refreshPlanInvite,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['billing-plan-users'] });
      toast.success('لینک دعوت جدید ساخته شد');
    },
    onError: (error) =>
      toast.error(errorText(error) || 'ساخت لینک دعوت ممکن نبود'),
  });

  const accept = useMutation({
    mutationFn: billingApi.acceptJoinRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['billing-plan-users'] });
      toast.success('درخواست عضویت تایید شد');
    },
    onError: (error) =>
      toast.error(errorText(error) || 'تایید درخواست ممکن نبود'),
  });

  const reject = useMutation({
    mutationFn: billingApi.rejectJoinRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['billing-plan-users'] });
      toast.success('درخواست رد شد');
    },
    onError: (error) => toast.error(errorText(error) || 'رد درخواست ممکن نبود'),
  });

  const kick = useMutation({
    mutationFn: billingApi.kickMember,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['billing-plan-users'] });
      toast.success('کاربر از پلن حذف شد');
    },
    onError: (error) => toast.error(errorText(error) || 'حذف کاربر ممکن نبود'),
  });

  const inviteUrl = query.data
    ? `${window.location.origin}${query.data.invite_url}`
    : '';

  const copyInvite = async () => {
    if (!inviteUrl) return;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('لینک دعوت کپی شد');
    } catch {
      toast.error('کپی لینک دعوت ممکن نبود');
    }
  };

  if (query.isLoading) {
    return (
      <div className="plan-users">
        <div className="plan-users__state">در حال دریافت اعضای پلن...</div>
      </div>
    );
  }

  if (query.error || !query.data) {
    return (
      <div className="plan-users">
        <div className="plan-users__state">
          شما در حال حاضر پلن فعالی ندارید.
          <button
            type="button"
            onClick={() => window.location.assign('/plan-details')}
          >
            انتخاب پلن
          </button>
        </div>
      </div>
    );
  }

  const { plan, members, pending_requests: requests } = query.data;
  const owner = plan.is_plan_admin;
  const frozen = plan.status === 'frozen';

  return (
    <div className="plan-users">
      {frozen && (
        <div className="plan-users__notice">
          پلن شما موقتاً متوقف شده است و با بازگشت سایت به نسخه پولی، مدت توقف
          به اعتبار پلن اضافه خواهد شد.
        </div>
      )}

      <div className="plan-users__summary">
        <div>
          <span>پلن شما</span>
          <strong>{plan.title}</strong>
        </div>
        <div>
          <span>اعضا</span>
          <strong>
            {toPersianNumerals(plan.member_count)} /{' '}
            {toPersianNumerals(plan.max_users)}
          </strong>
        </div>
        <div>
          <span>وضعیت</span>
          <strong>{frozen ? 'متوقف' : 'فعال'}</strong>
        </div>
      </div>

      {owner && (
        <div className="plan-users__invite">
          <div>
            <strong>دعوت به پلن</strong>
            <p>
              لینک زیر را برای کاربر موردنظر بفرستید. فقط شما به عنوان مدیر پلن
              می‌توانید درخواست‌ها را تایید کنید.
            </p>
          </div>

          <div className="plan-users__invite__actions">
            <button type="button" onClick={() => void copyInvite()}>
              <FiCopy />
              کپی لینک
            </button>
            <button
              type="button"
              disabled={refresh.isPending}
              onClick={() => refresh.mutate()}
            >
              <FiRefreshCw className={refresh.isPending ? 'is-spin' : ''} />
              لینک جدید
            </button>
          </div>

          <code>{inviteUrl}</code>
        </div>
      )}

      {owner && requests.length > 0 && (
        <section className="plan-users__requests">
          <h3>درخواست‌های عضویت</h3>

          {requests.map((request) => (
            <div className="plan-users__request" key={request.id}>
              <div>
                <strong>{request.username}</strong>
                <span>
                  {new Date(request.created_at).toLocaleDateString('fa-IR')}
                </span>
              </div>

              <div>
                <button
                  type="button"
                  disabled={accept.isPending || reject.isPending}
                  onClick={() => accept.mutate(request.id)}
                >
                  <FiCheck />
                  تایید
                </button>
                <button
                  type="button"
                  disabled={accept.isPending || reject.isPending}
                  onClick={() => reject.mutate(request.id)}
                >
                  <FiX />
                  رد
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="plan-users__cards">
        <h3>اعضای پلن</h3>

        <div className="plan-users__cards__grid">
          {members.map((member: PlanMember) => (
            <div className="plan-users__cards__card" key={member.user_id}>
              <div className="plan-users__cards__card__user-info">
                {member.profile_picture ? (
                  <img
                    src={`${import.meta.env.VITE_BASE_URL ?? ''}${member.profile_picture}`}
                    alt=""
                  />
                ) : (
                  <p>{member.username[0]}</p>
                )}
                <span>
                  {member.username}
                  {member.is_plan_admin ? ' (مدیر)' : ''}
                </span>
              </div>

              <div className="plan-users__cards__card__since">
                مدت عضویت:{' '}
                {toPersianNumerals(
                  Math.max(member.days_since_joined, 0),
                )}{' '}
                روز
              </div>

              {owner && !member.is_plan_admin && (
                <button
                  className="plan-users__cards__card__kick"
                  type="button"
                  disabled={kick.isPending}
                  onClick={() => kick.mutate(member.user_id)}
                >
                  <FiUserX />
                  اخراج کاربر
                </button>
              )}
            </div>
          ))}

          {owner && members.length < plan.max_users && (
            <button
              className="plan-users__cards__card plan-users__cards__card--add"
              type="button"
              onClick={() => void copyInvite()}
            >
              <span className="plan-users__cards__card__add-icon">
                <BsPlusLg strokeWidth={1} />
              </span>
              <span className="plan-users__cards__card__add-text">
                افزودن کاربر
              </span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

export default PlanUsers;
