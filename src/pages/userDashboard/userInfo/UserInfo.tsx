import { useState, useEffect, useRef, useMemo } from 'react';
import { PiCameraLight } from 'react-icons/pi';
import { IoPencilSharp, IoClose, IoChevronDown } from 'react-icons/io5';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
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

// --- Types --- //
interface WatchHistoryItem {
  watch_date: string;
  hours_watched: number;
}

type TimeframeOption = 'all_time' | 'past_month' | 'past_year' | 'past_week';

// --- Helper: Fill missing dates with 0 --- //
const processChartData = (history?: WatchHistoryItem[]) => {
  if (!history || history.length === 0) return [];

  // Sort history by date in ascending order
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.watch_date).getTime() - new Date(b.watch_date).getTime()
  );

  const startDate = new Date(sortedHistory[0].watch_date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(sortedHistory[sortedHistory.length - 1].watch_date);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username === user?.username) return onClose();

    try {
      await userApi.updateUsername(username);
      await fetchUser();
      toast.success('نام کاربری با موفقیت بروزرسانی شد');
      onClose();
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        toast.error(error.response.data || 'خطا در تغییر نام کاربری');
      }
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
      />
      <button type="submit">ثبت تغییرات</button>
    </form>
  );
};

const UpdatePasswordForm = ({ onClose }: { onClose: () => void }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userApi.updatePassword(currentPassword, newPassword);
      toast.success('رمز عبور با موفقیت تغییر کرد');
      onClose();
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        toast.error(error.response.data || 'خطا در تغییر رمز عبور');
      }
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
      />
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="رمز عبور جدید"
        required
      />
      <button type="submit">تغییر رمز</button>
    </form>
  );
};

const UpdatePhoneForm = ({ onClose }: { onClose: () => void }) => {
  const { user, fetchUser } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone === user?.phoneNumber) {
      toast.error('لطفا یک شماره جدید وارد کنید');
      return;
    }

    try {
      await userApi.requestPhoneUpdate(phone);
      toast.success('کد تایید ارسال شد');
      setStep('verify');
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        toast.error(error.response.data || 'خطا در ارسال کد');
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userApi.confirmPhoneUpdate(phone, otp);
      await fetchUser();
      toast.success('شماره موبایل با موفقیت تغییر کرد');
      onClose();
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        toast.error(error.response.data || 'کد وارد شده اشتباه است');
      }
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
        />
        <button type="submit">تایید و تغییر شماره</button>
        <button type="button" className="secondary-btn" onClick={() => setStep('request')}>
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
      />
      <button type="submit">دریافت کد تایید</button>
    </form>
  );
};

// --- Profile Picture Form --- //
const UpdateProfilePictureForm = ({ onClose }: { onClose: () => void }) => {
  const { user, fetchUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      await userApi.uploadProfilePicture(file);
      await fetchUser();
      toast.success('عکس پروفایل با موفقیت آپلود شد');
      onClose();
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        toast.error(error.response.data || 'خطا در آپلود عکس');
      }
    }
  };

  const handleDelete = async () => {
    try {
      await userApi.removeProfilePicture();
      await fetchUser();
      toast.success('عکس پروفایل با موفقیت حذف شد');
      onClose();
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        toast.error(error.response.data || 'خطا در حذف عکس');
      }
    }
  };

  return (
    <form onSubmit={handleUpload} className="edit-modal__form">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />

      <button
        type="button"
        className="secondary-btn"
        onClick={() => fileInputRef.current?.click()}
      >
        {file ? file.name : 'انتخاب عکس جدید'}
      </button>

      {file && <button type="submit">آپلود عکس</button>}

      {user?.profile_picture && !file && (
        <button
          type="button"
          className="secondary-btn"
          onClick={handleDelete}
          style={{ borderColor: 'rgba(239, 68, 68, 0.6)', color: '#ef4444' }}
        >
          حذف عکس فعلی
        </button>
      )}
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
          {payload[0].value} ساعت تماشا
        </p>
      </div>
    );
  }
  return null;
};

// --- Main Component --- //

const UserInfo = () => {
  const { user } = useAuth();

  const [editingField, setEditingField] = useState<'username' | 'phone' | 'password' | 'profilePicture' | null>(null);
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
    { key: 'phone', label: 'شماره موبایل', value: user?.phoneNumber },
    { key: 'password', label: 'رمز عبور', value: '•••••••••••••' },
  ];

  const handleOpenModal = (field: 'username' | 'phone' | 'password' | 'profilePicture') => {
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

  return (
    <div className="user-info">
      <div className="user-info__blob" />

      <div className="user-info__top-card">
        <div className="user-info__top-card__right">
          <div className="user-info__top-card__right__img" onClick={() => handleOpenModal('profilePicture')}>
            {user?.profile_picture ? (
              <img src={`${import.meta.env.VITE_BASE_URL}${user?.profile_picture}`} alt="profile image" />
            ) : (
              <p>{user?.username?.[0]}</p>
            )}

            <span>
              <PiCameraLight />
            </span>
          </div>
          <div className="user-info__top-card__right__subinfo">
            <p>وضعیت اشتراک</p>
            <span>اشتراک ندارید</span>
          </div>
        </div>

        <div className="user-info__top-card__left">
          <button>خرید اشتراک</button>
        </div>
      </div>

      <div className="user-info__info-card">
        {sections.map((item) => (
          <div className="user-info__info-card__section" key={item.key}>
            <div className="user-info__info-card__section__right">
              <p>{item.label}</p>
              <span>{item.value}</span>
            </div>

            <div className="user-info__info-card__section__left">
              <button onClick={() => handleOpenModal(item.key as any)}>
                <IoPencilSharp />
                ویرایش {item.label}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- Watch History Chart --- */}
      <div className="user-info__chart-container">

        <div className="user-info__chart-header">
          {/* بخش دراپ‌داون در ابتدا قرار گرفته تا در حالت RTL در سمت راست بماند */}
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
            <span className="user-info__chart-total">مجموع: {displayTotal} ساعت</span>
            <h3 className="user-info__chart-title">گزارش تماشا (ساعات)</h3>
          </div>
        </div>

        <div className="user-info__chart-area">
          {isChartLoading ? (
            <div className="user-info__chart-loading">
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
            <div className="edit-modal__header">
              <h3>
                ویرایش{' '}
                {editingField === 'username'
                  ? 'نام کاربری'
                  : editingField === 'phone'
                    ? 'شماره موبایل'
                    : editingField === 'profilePicture'
                      ? 'عکس پروفایل'
                      : 'رمز عبور'}
              </h3>
              <button className="edit-modal__close" onClick={handleCloseModal}>
                <IoClose />
              </button>
            </div>

            {editingField === 'username' && <UpdateUsernameForm onClose={handleCloseModal} />}
            {editingField === 'password' && <UpdatePasswordForm onClose={handleCloseModal} />}
            {editingField === 'phone' && <UpdatePhoneForm onClose={handleCloseModal} />}
            {editingField === 'profilePicture' && <UpdateProfilePictureForm onClose={handleCloseModal} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserInfo;