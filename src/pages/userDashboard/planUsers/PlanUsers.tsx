import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BsPersonPlusFill } from 'react-icons/bs';
import {
  FiCheck,
  FiClock,
  FiCopy,
  FiRefreshCw,
  FiShield,
  FiUser,
  FiUserX,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { billingApi, type PlanMember } from '../../../apiCalls/billingApi';
import { toast } from '../../../components/toast';
import { getApiErrorMessage, getApiErrorStatus } from '../../../lib/apiError';
import Skeleton from '../../../components/skeleton/Skeleton';
import { toPersianNumerals } from '../../../helpers/NumberConversion';
import './PlanUsers.scss';

const PlanUsersSkeleton = () => (
  <div className="plan-users">
    <div className="plan-users__hero plan-users__hero--skeleton">
      <Skeleton variant="text" width="110px" height={16} />
      <Skeleton variant="text" width="260px" height={34} />
      <Skeleton variant="text" width="420px" />
      <div className="plan-users__hero__stats">
        {[0, 1, 2].map((item) => (
          <div key={item} className="plan-users__hero__stat">
            <Skeleton variant="text" width="62px" />
            <Skeleton variant="text" width="90px" height={23} />
          </div>
        ))}
      </div>
    </div>

    <div className="plan-users__content">
      <section className="plan-users__panel plan-users__panel--members">
        <div className="plan-users__panel__heading">
          <Skeleton variant="text" width="120px" height={22} />
          <Skeleton variant="pill" width="74px" height={28} />
        </div>
        <div className="plan-users__member-grid">
          {[0, 1, 2].map((item) => (
            <div className="plan-users__member plan-users__member--skeleton" key={item}>
              <Skeleton variant="circle" width={48} height={48} />
              <div>
                <Skeleton variant="text" width="110px" />
                <Skeleton variant="text" width="82px" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="plan-users__aside">
        <Skeleton variant="rect" width="100%" height={185} />
        <Skeleton variant="rect" width="100%" height={130} />
      </aside>
    </div>
  </div>
);

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
      toast.success('لینک دعوت جدید ساخته شد.');
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'ساخت لینک دعوت ممکن نبود.')),
  });

  const accept = useMutation({
    mutationFn: billingApi.acceptJoinRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['billing-plan-users'] });
      toast.success('درخواست عضویت تأیید شد.');
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'تأیید درخواست ممکن نبود.')),
  });

  const reject = useMutation({
    mutationFn: billingApi.rejectJoinRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['billing-plan-users'] });
      toast.success('درخواست رد شد.');
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'رد درخواست ممکن نبود.')),
  });

  const kick = useMutation({
    mutationFn: billingApi.kickMember,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['billing-plan-users'] });
      toast.success('کاربر از پلن حذف شد.');
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'حذف کاربر ممکن نبود.')),
  });

  if (query.isLoading) return <PlanUsersSkeleton />;

  if (query.error || !query.data) {
    const status = getApiErrorStatus(query.error);
    const hasNoPlan = status === 404 || !query.error;

    return (
      <div className="plan-users plan-users--state">
        <div className="plan-users__state-card">
          <div className="plan-users__state-card__icon">
            <FiUsers />
          </div>
          <span>{hasNoPlan ? 'اشتراک شما' : 'مدیریت اشتراک'}</span>
          <h1>
            {hasNoPlan
              ? 'هنوز عضوی از یک پلن نیستید'
              : 'دریافت اطلاعات پلن ممکن نبود'}
          </h1>
          <p>
            {hasNoPlan
              ? 'برای اضافه‌کردن اعضا یا ساخت اتاق خصوصی، ابتدا یک پلن انتخاب کنید.'
              : getApiErrorMessage(query.error, 'لطفاً دوباره تلاش کنید.')}
          </p>
          <button
            type="button"
            onClick={() =>
              hasNoPlan
                ? window.location.assign('/plan-details')
                : void query.refetch()
            }
          >
            {hasNoPlan ? 'مشاهده پلن‌ها' : 'تلاش دوباره'}
          </button>
        </div>
      </div>
    );
  }

  const { plan, members, pending_requests: requests } = query.data;
  const owner = plan.is_plan_admin;
  const frozen = plan.status === 'frozen';
  const inviteUrl = query.data.invite_url
    ? `${window.location.origin}${query.data.invite_url}`
    : '';
  const memberSlots = Math.max(plan.max_users - members.length, 0);

  const copyInvite = async () => {
    if (!inviteUrl) return;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('لینک دعوت کپی شد.');
    } catch {
      toast.error('کپی لینک دعوت ممکن نبود.');
    }
  };

  return (
    <div className="plan-users">
      {frozen && (
        <div className="plan-users__notice">
          <FiClock />
          <p>
            <strong>پلن موقتاً متوقف است.</strong>
            {' '}
            زمانی که سایت دوباره پولی شود، مدت توقف به اعتبار پلن شما اضافه
            خواهد شد.
          </p>
        </div>
      )}

      <header className="plan-users__hero">
        <div className="plan-users__hero__backdrop" aria-hidden="true" />
        <div className="plan-users__hero__heading">
          <span>اشتراک شما</span>
          <h1>{plan.title}</h1>
          <p>
            {owner
              ? 'مدیریت اعضا، درخواست‌های عضویت و لینک دعوت پلن از همین‌جا انجام می‌شود.'
              : 'اعضای این پلن را ببینید و وضعیت اشتراک خود را مدیریت کنید.'}
          </p>
        </div>

        <div className="plan-users__hero__stats">
          <div className="plan-users__hero__stat">
            <span>اعضا</span>
            <strong>
              {toPersianNumerals(members.length)} /{' '}
              {toPersianNumerals(plan.max_users)}
            </strong>
          </div>
          <div className="plan-users__hero__stat">
            <span>وضعیت</span>
            <strong>{frozen ? 'متوقف' : 'فعال'}</strong>
          </div>
          <div className="plan-users__hero__stat">
            <span>مدت</span>
            <strong>{toPersianNumerals(plan.duration_months)} ماه</strong>
          </div>
        </div>
      </header>

      <div className="plan-users__content">
        <section className="plan-users__panel plan-users__panel--members">
          <div className="plan-users__panel__heading">
            <div>
              <span>اعضای فعلی</span>
              <h2>همراهان پلن</h2>
            </div>
            <span className="plan-users__count">
              {toPersianNumerals(members.length)} نفر
            </span>
          </div>

          <div className="plan-users__member-grid">
            {members.map((member: PlanMember) => (
              <article className="plan-users__member" key={member.user_id}>
                <div className="plan-users__member__avatar">
                  {member.profile_picture ? (
                    <img
                      src={`${import.meta.env.VITE_BASE_URL ?? ''}${member.profile_picture}`}
                      alt={member.username}
                    />
                  ) : (
                    <FiUser />
                  )}
                </div>
                <div className="plan-users__member__identity">
                  <strong>{member.username}</strong>
                  <span>
                    {member.is_plan_admin ? 'مدیر پلن' : 'عضو پلن'}
                    {' · '}
                    {toPersianNumerals(Math.max(member.days_since_joined, 0))} روز
                  </span>
                </div>

                {member.is_plan_admin ? (
                  <span className="plan-users__member__owner">
                    <FiShield /> مدیر
                  </span>
                ) : owner ? (
                  <button
                    type="button"
                    className="plan-users__member__remove"
                    disabled={kick.isPending}
                    onClick={() => kick.mutate(member.user_id)}
                    aria-label={`حذف ${member.username} از پلن`}
                    title="حذف از پلن"
                  >
                    <FiUserX />
                  </button>
                ) : null}
              </article>
            ))}

            {owner && memberSlots > 0 && (
              <button
                type="button"
                className="plan-users__member plan-users__member--add"
                onClick={() => void copyInvite()}
              >
                <span className="plan-users__member--add__icon">
                  <BsPersonPlusFill />
                </span>
                <span>
                  <strong>افزودن عضو</strong>
                  <small>
                    {toPersianNumerals(memberSlots)} جای خالی باقی مانده
                  </small>
                </span>
              </button>
            )}
          </div>
        </section>

        <aside className="plan-users__aside">
          {owner ? (
            <section className="plan-users__panel plan-users__panel--invite">
              <div className="plan-users__panel__icon">
                <FiCopy />
              </div>
              <div>
                <span>دعوت عضو جدید</span>
                <h2>لینک دعوت شما</h2>
                <p>لینک را برای همراهتان بفرستید تا درخواست عضویت ارسال کند.</p>
              </div>

              <div className="plan-users__invite-url" dir="ltr">
                <code>{inviteUrl || 'لینک دعوت موجود نیست'}</code>
              </div>

              <div className="plan-users__invite-actions">
                <button type="button" onClick={() => void copyInvite()} disabled={!inviteUrl}>
                  <FiCopy />
                  کپی لینک
                </button>
                <button
                  type="button"
                  onClick={() => refresh.mutate()}
                  disabled={refresh.isPending}
                >
                  <FiRefreshCw className={refresh.isPending ? 'is-spin' : ''} />
                  لینک جدید
                </button>
              </div>
            </section>
          ) : (
            <section className="plan-users__panel plan-users__panel--member-note">
              <div className="plan-users__panel__icon">
                <FiShield />
              </div>
              <span>عضویت در پلن</span>
              <h2>شما عضو این پلن هستید</h2>
              <p>
                مدیریت اعضا و تأیید درخواست‌های جدید فقط در اختیار مدیر پلن است.
              </p>
            </section>
          )}

          {owner && requests.length > 0 && (
            <section className="plan-users__panel plan-users__panel--requests">
              <div className="plan-users__panel__heading">
                <div>
                  <span>مراجعه برای عضویت</span>
                  <h2>درخواست‌ها</h2>
                </div>
                <span className="plan-users__count">
                  {toPersianNumerals(requests.length)}
                </span>
              </div>

              <div className="plan-users__request-list">
                {requests.map((request) => (
                  <div className="plan-users__request" key={request.id}>
                    <div className="plan-users__request__avatar">
                      {request.profile_picture ? (
                        <img
                          src={`${import.meta.env.VITE_BASE_URL ?? ''}${request.profile_picture}`}
                          alt={request.username}
                        />
                      ) : (
                        <FiUser />
                      )}
                    </div>
                    <div className="plan-users__request__body">
                      <strong>{request.username}</strong>
                      <span>
                        {new Date(request.created_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                    <div className="plan-users__request__actions">
                      <button
                        type="button"
                        title="تأیید"
                        aria-label="تأیید درخواست"
                        disabled={accept.isPending || reject.isPending}
                        onClick={() => accept.mutate(request.id)}
                      >
                        <FiCheck />
                      </button>
                      <button
                        type="button"
                        title="رد"
                        aria-label="رد درخواست"
                        disabled={accept.isPending || reject.isPending}
                        onClick={() => reject.mutate(request.id)}
                      >
                        <FiX />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="plan-users__panel plan-users__panel--details">
            <div className="plan-users__detail-row">
              <span>شروع اشتراک</span>
              <strong>
                {new Date(plan.starts_at).toLocaleDateString('fa-IR')}
              </strong>
            </div>
            <div className="plan-users__detail-row">
              <span>پایان اشتراک</span>
              <strong>
                {new Date(plan.expires_at).toLocaleDateString('fa-IR')}
              </strong>
            </div>
            <div className="plan-users__detail-row">
              <span>نقش شما</span>
              <strong>{owner ? 'مدیر پلن' : 'عضو'}</strong>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default PlanUsers;
