import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiCameraLight } from 'react-icons/pi';
import { IoPencilSharp, IoClose, IoChevronDown } from 'react-icons/io5';
import { toast } from '../../../components/toast';
import { getApiErrorMessage } from '../../../lib/apiError';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../../../context/AuthContext'; // Adjust path
import './UserInfo.scss';
import { userApi } from '../../../apiCalls/userApi';
import { toPersianNumerals } from '../../../helpers/NumberConversion';
import { SEO } from '../../../components/seo/SEO';
import Skeleton from '../../../components/skeleton/Skeleton';
import ProfilePictureUploadModal from './component/ProfilePictureUploadModal';

// --- Types --- //
interface WatchHistoryItem {
  watch_date: string;
  hours_watched: number;
}

type TimeframeOption = 'all_time' | 'past_month' | 'past_year' | 'past_week';

// --- Small shared spinner used by every submitting button --- //
const Spinner = () => <span className="btn-spinner" aria-hidden="true" />;

// --- Helper: Fill missing dates with 0 --- //
const processChartData = (history?: WatchHistoryItem[]) => {
  if (!history || history.length === 0) return [];

  // Sort history by date in ascending order
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.watch_date).getTime() - new Date(b.watch_date).getTime()
  );

  const startDate = new Date(sortedHistory[0]!.watch_date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(sortedHistory[sortedHistory.length - 1]!.watch_date);
  endDate.setHours(0, 0, 0, 0);

  // Map to quickly look up existing hours by a safe date key (YYYY-M-D)
  const historyMap = new Map<string, number>();
  sortedHistory.forEach((item) => {
    const d = new Date(item.watch_date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    historyMap.set(key, item.hours_watched);
  });

  const filledData = [];
  const currentDate = new Date(startDate);

  // Loop from the first date to the last date
  while (currentDate <= endDate) {
    const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;

    filledData.push({
      // Create a Persian short date (e.g. "28 تیر")
      date: currentDate.toLocaleDateString('fa-IR', {
        month: 'short',
        day: 'numeric',
      }),
      hours: historyMap.get(key) || 0, // Fill 0 if missing
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return filledData;
};

// --- Sub-components for Modals --- //
const UpdateUsernameForm = ({ onClose }: { onClose: () => void }) => {
  const { user, fetchUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username === user?.username) return onClose();

    setIsSubmitting(true);
    try {
      await userApi.updateUsername(username);
      await fetchUser();
      toast.success('نام کاربری با موفقیت بروزرسانی شد');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'تغییر نام کاربری انجام نشد.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="edit-modal__form">
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="نام کاربری جدید"
        required
        disabled={isSubmitting}
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Spinner />}
        {isSubmitting ? 'در حال ثبت...' : 'ثبت تغییرات'}
      </button>
    </form>
  );
};

const UpdatePasswordForm = ({ onClose }: { onClose: () => void }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await userApi.updatePassword(currentPassword, newPassword);
      toast.success('رمز عبور با موفقیت تغییر کرد');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'تغییر رمز عبور انجام نشد.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="edit-modal__form">
      <input
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder="رمز عبور فعلی"
        required
        disabled={isSubmitting}
      />
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="رمز عبور جدید"
        required
        disabled={isSubmitting}
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Spinner />}
        {isSubmitting ? 'در حال تغییر...' : 'تغییر رمز'}
      </button>
    </form>
  );
};

const UpdatePhoneForm = ({ onClose }: { onClose: () => void }) => {
  const { user, fetchUser } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone === user?.phone_number) {
      toast.error('لطفا یک شماره جدید وارد کنید');
      return;
    }

    setIsSubmitting(true);
    try {
      await userApi.requestPhoneUpdate(phone);
      toast.success('کد تایید ارسال شد');
      setStep('verify');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'ارسال کد تأیید انجام نشد.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await userApi.confirmPhoneUpdate(phone, otp);
      await fetchUser();
      toast.success('شماره موبایل با موفقیت تغییر کرد');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'کد واردشده صحیح نیست.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerifyOtp} className="edit-modal__form">
        <p className="edit-modal__subtitle">کد ارسال شده به {phone} را وارد کنید</p>
        <input
          type="text"
          maxLength={4}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="کد ۴ رقمی"
          required
          disabled={isSubmitting}
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          {isSubmitting ? 'در حال تایید...' : 'تایید و تغییر شماره'}
        </button>
        <button
          type="button"
          className="secondary-btn"
          onClick={() => setStep('request')}
          disabled={isSubmitting}
        >
          اصلاح شماره
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequestOtp} className="edit-modal__form">
      <input
        type="text"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="شماره موبایل جدید (مثلا ۰۹XXXXXXXXX)"
        required
        disabled={isSubmitting}
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Spinner />}
        {isSubmitting ? 'در حال ارسال...' : 'دریافت کد تایید'}
      </button>
    </form>
  );
};

const TIMEFRAME_OPTIONS = [
  { value: 'past_week', label: 'هفته گذشته' },
  { value: 'past_month', label: 'ماه گذشته' },
  { value: 'past_year', label: 'سال گذشته' },
  { value: 'all_time', label: 'کل زمان‌ها' },
];
// --- Custom Chart Tooltip --- //
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="user-info__chart-tooltip">
        <p className="user-info__chart-tooltip-label">{label}</p>
        <p className="user-info__chart-tooltip-value">
          {toPersianNumerals(payload[0].value)} ساعت تماشا
        </p>
      </div>
    );
  }
  return null;
};

// --- Main Component --- //

const UserInfo = () => {
  const { user, isLoading: isUserLoading } = useAuth();
  const navigate = useNavigate();

  const [editingField, setEditingField] = useState<'username' | 'phone' | 'password' | null>(null);
  const [isProfilePictureModalOpen, setIsProfilePictureModalOpen] = useState(false);
  const [isModalActive, setIsModalActive] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeframeOption>('past_month');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // بستن Dropdown در صورت کلیک بیرون از آن
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedTimeframeLabel = TIMEFRAME_OPTIONS.find(t => t.value === timeframe)?.label;

  // --- Fetch Watch Stats --- //
  const { data: watchStatsRes, isLoading: isChartLoading } = useQuery({
    queryKey: ['watchStats'],
    queryFn: () => userApi.getWatchHistory(),
  });

  // --- Filter and Process Data --- //
  const filteredHistory = useMemo(() => {
    const history = watchStatsRes?.data?.history;
    if (!history) return [];

    const now = new Date();

    return history.filter((item: WatchHistoryItem) => {
      const date = new Date(item.watch_date);

      if (timeframe === 'past_week') {
        const lastMonth = new Date();
        lastMonth.setDate(now.getDate() - 7);
        return date >= lastMonth;
      }

      if (timeframe === 'past_month') {
        const lastMonth = new Date();
        lastMonth.setDate(now.getDate() - 30);
        return date >= lastMonth;
      }

      if (timeframe === 'past_year') {
        const lastYear = new Date();
        lastYear.setFullYear(now.getFullYear() - 1);
        return date >= lastYear;
      }

      return true; // all_time
    });
  }, [watchStatsRes?.data?.history, timeframe]);

  const chartData = processChartData(filteredHistory);

  // Get the total hours corresponding to the selected timeframe
  const displayTotal = watchStatsRes?.data?.[timeframe] || 0;

  const sections = [
    { key: 'username', label: 'نام کاربری', value: user?.username },
    { key: 'phone', label: 'شماره موبایل', value: toPersianNumerals(user?.phone_number || 0) },
    { key: 'password', label: 'رمز عبور', value: '•••••••••••••' },
  ];

  const handleOpenModal = (field: 'username' | 'phone' | 'password') => {
    setEditingField(field);
    setTimeout(() => setIsModalActive(true), 10);
  };

  const handleCloseModal = () => {
    setIsModalActive(false);
    setTimeout(() => setEditingField(null), 300);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalActive) handleCloseModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalActive]);

  const isProfileLoading = isUserLoading && !user;

  return (
    <>
      <SEO
        title="هم‌نما | پروفایل شما"
        description="پروفایل هم‌نما خود را مدیریت و اطلاعات حساب کاربری‌تان را ویرایش کنید."
        canonical="https://hamnama.net/user/info"
        noindex
      />

      <div className="user-info">
        <div className="user-info__blob" />

        <div className="user-info__top-card">
          <span className="user-info__sprockets" aria-hidden="true" />

          {isProfileLoading ? (
            <>
              <div className="user-info__top-card__right">
                <Skeleton variant="circle" width={72} height={72} />
                <div className="skeleton-stack">
                  <Skeleton variant="text" width={110} />
                  <Skeleton variant="text" width={74} />
                </div>
              </div>
              <div className="user-info__top-card__left">
                <Skeleton variant="rect" width={157} height={66} radius={12} />
              </div>
            </>
          ) : (
            <>
              <div className="user-info__top-card__right">
                <div className="user-info__top-card__right__img" onClick={() => setIsProfilePictureModalOpen(true)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setIsProfilePictureModalOpen(true); }}>
                  {user?.profile_picture ? (
                    <img src={`${import.meta.env['VITE_BASE_URL']}${user?.profile_picture}`} alt="profile image" />
                  ) : (
                    <p>{user?.username?.[0]}</p>
                  )}

                  <span>
                    <PiCameraLight />
                  </span>
                </div>
                <div className="user-info__top-card__right__subinfo">
                  <p>وضعیت اشتراک</p>
                  <span>{user?.current_plan ? `${user.current_plan.title} · ${user.current_plan.duration_months.toLocaleString('fa-IR')} ماهه` : 'اشتراک ندارید'}</span>
                </div>
              </div>

              <div className="user-info__top-card__left">
                {user?.current_plan ? (
                  <button type="button" onClick={() => navigate('/user/plan-users')}>مدیریت پلن</button>
                ) : (
                  <button type="button" onClick={() => navigate('/plan-details')}>خرید اشتراک</button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="user-info__info-card">
          {sections.map((item) => (
            <div className="user-info__info-card__section" key={item.key}>
              <div className="user-info__info-card__section__right">
                <p>{item.label}</p>
                {isProfileLoading ? (
                  <Skeleton
                    variant="text"
                    width={item.key === 'phone' ? 145 : item.key === 'username' ? 110 : 118}
                    height={18}
                  />
                ) : (
                  <span>{item.value}</span>
                )}
              </div>

              <div className="user-info__info-card__section__left">
                {isProfileLoading ? (
                  <Skeleton variant="rect" width={170} height={50} radius={16} />
                ) : (
                  <button onClick={() => handleOpenModal(item.key as any)}>
                    <IoPencilSharp />
                    ویرایش {item.label}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* --- Watch History Chart --- */}
        <div className="user-info__chart-container">

          <div className="user-info__chart-header">
            <div className="user-info__custom-dropdown" ref={dropdownRef}>
              <button
                className={`user-info__custom-dropdown-toggle ${isDropdownOpen ? 'is-open' : ''}`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {selectedTimeframeLabel}
                <IoChevronDown className="dropdown-icon" />
              </button>

              <div className={`user-info__custom-dropdown-menu ${isDropdownOpen ? 'is-open' : ''}`}>
                {TIMEFRAME_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    className={`user-info__custom-dropdown-item ${timeframe === opt.value ? 'is-active' : ''}`}
                    onClick={() => {
                      setTimeframe(opt.value as TimeframeOption);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="user-info__chart-title-group">
              <span className="user-info__chart-total">
                {isChartLoading ? (
                  <Skeleton variant="text" width={96} height={16} />
                ) : (
                  <>مجموع: {toPersianNumerals(displayTotal)} ساعت</>
                )}
              </span>
              <h3 className="user-info__chart-title">گزارش تماشا (ساعات)</h3>
            </div>
          </div>

          <div className="user-info__chart-area">
            {isChartLoading ? (
              <div className="user-info__chart-loading">
                <div className="user-info__chart-loading__bars" aria-hidden="true">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <span key={i} style={{ animationDelay: `${i * 90}ms` }} />
                  ))}
                </div>
                <p>در حال بارگذاری نمودار...</p>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-color)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="var(--chart-axis-color)"
                    tick={{ fill: 'var(--chart-axis-color)', fontSize: 12, fontFamily: 'inherit' }}
                    tickMargin={10}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="var(--chart-axis-color)"
                    tick={{ fill: 'var(--chart-axis-color)', fontSize: 12, fontFamily: 'inherit' }}
                    tickMargin={10}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--chart-cursor-color)', strokeWidth: 2 }} />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="var(--chart-line-color)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: 'var(--chart-line-color)', strokeWidth: 0 }}
                    activeDot={{ r: 7, fill: 'var(--chart-line-color)', stroke: 'var(--chart-dot-stroke)', strokeWidth: 2 }}
                    isAnimationActive={true}
                    animationDuration={2000}
                    animationEasing="ease-in-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="user-info__chart-empty">
                <p>تاریخچه تماشایی برای این بازه وجود ندارد.</p>
              </div>
            )}
          </div>
        </div>

        {editingField && (
          <div
            className={`edit-modal-overlay ${isModalActive ? 'is-active' : ''}`}
            onClick={handleCloseModal}
          >
            <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
              <span className="edit-modal__sprockets" aria-hidden="true" />
              <div className="edit-modal__header">
                <h3>
                  ویرایش{' '}
                  {editingField === 'username'
                    ? 'نام کاربری'
                    : editingField === 'phone'
                      ? 'شماره موبایل'
                      : 'رمز عبور'}
                </h3>
                <button className="edit-modal__close" onClick={handleCloseModal}>
                  <IoClose />
                </button>
              </div>

              {editingField === 'username' && <UpdateUsernameForm onClose={handleCloseModal} />}
              {editingField === 'password' && <UpdatePasswordForm onClose={handleCloseModal} />}
              {editingField === 'phone' && <UpdatePhoneForm onClose={handleCloseModal} />}
            </div>
          </div>
        )}

        {isProfilePictureModalOpen && (
          <ProfilePictureUploadModal onClose={() => setIsProfilePictureModalOpen(false)} />
        )}
      </div>
    </>
  );
};

export default UserInfo;
