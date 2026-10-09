import { useMemo, useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiUserPlus,
  FiPlus,
  FiEdit2,
  FiShield,
  FiSlash,
  FiActivity,
  FiCalendar,
  FiHome,
  FiUserCheck,
} from 'react-icons/fi';
import { toast } from '../../../components/toast';
import { adminApi, type AdminUser } from '../../../apiCalls/adminApi';
import './Users.scss';
import Skeleton from "../../../components/skeleton/Skeleton";
import { useAdminAccess } from '../../../components/adminRoute/AdminAccessContext';
import JalaliDatePicker from '../../../components/global/JalaliDatePicker';

type Filter = 'all' | 'banned' | 'active';

interface DropdownOption<T extends string> {
  value: T;
  label: string;
}

type UserModalState =
  | { mode: 'create' }
  | { mode: 'edit'; user: AdminUser }
  | null;

type UserFormState = {
  username: string;
  phone_number: string;
  password: string;
  is_admin: boolean;
  access_level: '1' | '2' | '3';
};

interface SmoothDropdownProps<T extends string> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
}

function SmoothDropdown<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: SmoothDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className={`admin-users-dropdown ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="admin-users-dropdown__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{selected?.label ?? ''}</span>
        <svg
          className="admin-users-dropdown__chevron"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <ul className="admin-users-dropdown__menu" role="listbox" aria-label={ariaLabel}>
        {options.map((opt) => (
          <li key={opt.value} role="option" aria-selected={opt.value === value}>
            <button
              type="button"
              className={`admin-users-dropdown__option ${opt.value === value ? 'is-active' : ''
                }`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const FILTER_OPTIONS: DropdownOption<Filter>[] = [
  { value: 'all', label: 'همه' },
  { value: 'banned', label: 'مسدود' },
  { value: 'active', label: 'فعال' },
];

const SORT_OPTIONS: DropdownOption<string>[] = [
  { value: 'created_at', label: 'جدیدترین' },
  { value: '-created_at', label: 'قدیمی‌ترین' },
  { value: 'username', label: 'نام کاربری' },
  { value: '-username', label: 'نام کاربری (معکوس)' },
];

const getLocalIsoDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shiftIsoDate = (value: string, offset: number) => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return getLocalIsoDate(date);
};

const formatJalaliDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
};

const formatJalaliDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
};

const persianNumber = new Intl.NumberFormat('fa-IR');

const Users = () => {
  const { accessLevel } = useAdminAccess();

  const isFullAccess = accessLevel === 3;

  const queryClient = useQueryClient();
  const [initialRange] = useState(() => {
    const end = getLocalIsoDate();
    return { start: shiftIsoDate(end, -29), end };
  });
  const [rangeStart, setRangeStart] = useState(initialRange.start);
  const [rangeEnd, setRangeEnd] = useState(initialRange.end);
  const [appliedRange, setAppliedRange] = useState(initialRange);

  const {
    data: userMetrics,
    isLoading: metricsLoading,
    isFetching: metricsFetching,
    isError: metricsError,
  } = useQuery({
    queryKey: ['admin-user-metrics', appliedRange.start, appliedRange.end],
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await adminApi.getUserMetrics(appliedRange.start, appliedRange.end);
      return response.data;
    },
  });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('-created_at');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userModal, setUserModal] = useState<UserModalState>(null);
  const [userForm, setUserForm] = useState<UserFormState>({
    username: '',
    phone_number: '',
    password: '',
    is_admin: false,
    access_level: '1',
  });
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState<'1week' | '1month' | '3months' | '6months' | '1year' | 'forever'>('1week');
  const params = useMemo(
    () => ({
      search,
      page,
      limit: 10,
      sort,
      banned:
        filter === 'banned' ? true : filter === 'active' ? false : undefined,
      is_admin: undefined,
    }),
    [filter, page, search, sort]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users', params],
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await adminApi.listUsers(params);
      return response.data;
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (payload: {
      username: string;
      phone_number: string;
      password: string;
      is_admin?: boolean;
      access_level?: number;
    }) => adminApi.createUser(payload),
    onSuccess: async () => {
      toast.success('کاربر جدید ایجاد شد');
      setUserModal(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('ایجاد کاربر با مشکل مواجه شد'),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => adminApi.updateUser(id, payload),
    onSuccess: async () => {
      toast.success('اطلاعات کاربر به‌روزرسانی شد');
      setUserModal(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('به‌روزرسانی کاربر با مشکل مواجه شد'),
  });

  const banMutation = useMutation({
    mutationFn: ({
      id,
      reason,
      duration,
    }: {
      id: string;
      reason: string;
      duration: | '1week' | '1month' | '3months' | '6months' | '1year' | 'forever';
    }) => adminApi.banUser(id, { reason, duration }),
    onSuccess: async () => {
      toast.success('کاربر مسدود شد');
      setBanReason('');
      setBanDuration('1week');
      setSelectedUserId(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('امکان مسدودسازی کاربر وجود ندارد'),
  });

  const unbanMutation = useMutation({
    mutationFn: (id: string) => adminApi.unbanUser(id),
    onSuccess: async () => {
      toast.success('مسدودی کاربر برداشته شد');
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('امکان رفع مسدودی وجود ندارد'),
  });

  const openCreateUserModal = () => {
    setUserForm({
      username: '',
      phone_number: '',
      password: '',
      is_admin: false,
      access_level: '1',
    });
    setUserModal({ mode: 'create' });
  };

  const openEditUserModal = (user: AdminUser) => {
    setUserForm({
      username: user.username,
      phone_number: user.phone_number,
      password: '',
      is_admin: user.is_admin,
      access_level: String(user.access_level) as '1' | '2' | '3',
    });
    setUserModal({ mode: 'edit', user });
  };

  const closeUserModal = () => {
    if (createUserMutation.isPending || updateUserMutation.isPending) return;
    setUserModal(null);
  };

  const handleUserSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const username = userForm.username.trim();
    const phoneNumber = userForm.phone_number.trim();
    const password = userForm.password.trim();

    if (!username || !phoneNumber) {
      toast.error('نام کاربری و شماره تلفن الزامی است');
      return;
    }

    if (userModal?.mode === 'create') {
      if (!password) {
        toast.error('رمز عبور الزامی است');
        return;
      }

      createUserMutation.mutate({
        username,
        phone_number: phoneNumber,
        password,
        ...(isFullAccess
          ? {
            is_admin: userForm.is_admin,
            access_level: Number(userForm.access_level),
          }
          : {}),
      });
      return;
    }

    if (!userModal || userModal.mode !== 'edit') return;

    const payload: Record<string, unknown> = {
      username,
      phone_number: phoneNumber,
    };

    if (password) {
      payload.password = password;
    }

    if (isFullAccess) {
      if (userForm.is_admin !== userModal.user.is_admin) {
        payload.is_admin = userForm.is_admin;
      }

      if (userForm.is_admin && Number(userForm.access_level) !== userModal.user.access_level) {
        payload.access_level = Number(userForm.access_level);
      }
    }

    updateUserMutation.mutate({ id: userModal.user.id, payload });
  };

  const handleToggleAdmin = (user: { id: string; is_admin: boolean }) => {
    if (user.is_admin && !isFullAccess) {
      toast.error('فقط ادمین با دسترسی کامل می‌تواند ادمین‌های دیگر را تغییر دهد');
      return;
    }
    updateUserMutation.mutate({
      id: user.id,
      payload: user.is_admin ? { is_admin: false } : { is_admin: true, access_level: 1 },
    });
  };

  const handleAccessLevelChange = (user: AdminUser, accessLevel: string) => {
    const nextLevel = Number(accessLevel);
    if (!isFullAccess || !user.is_admin || ![1, 2, 3].includes(nextLevel)) return;
    updateUserMutation.mutate({
      id: user.id,
      payload: { access_level: nextLevel },
    });
  };

  const handleBanSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUserId || !banReason.trim()) return;
    banMutation.mutate({ id: selectedUserId, reason: banReason.trim(), duration: banDuration });
  };

  const pagination = data?.pagination;

  return (
    <section className="admin-users">
      <header className="admin-users__header">
        <div className="admin-users__heading-copy">
          <p className="admin-users__eyebrow">مدیریت ارتباط با کاربران • CRM</p>
          <h1 className="admin-users__title">مرکز مدیریت کاربران</h1>
          <p className="admin-users__description">
            نمای یکپارچه برای بررسی اعضا، رفتار کاربران و شاخص‌های رشد هم‌نما.
          </p>
        </div>
        <div className="admin-users__header-actions">
          <span className="admin-users__count">
            {persianNumber.format(pagination?.total ?? 0)} نتیجه
          </span>
          <button
            type="button"
            className="admin-users__action admin-users__action--primary"
            onClick={openCreateUserModal}
          >
            <FiPlus />
            کاربر جدید
          </button>
        </div>
      </header>

      <section className="admin-users__analytics" aria-labelledby="user-analytics-title">
        <div className="admin-users__section-heading">
          <div className="admin-users__section-copy">
            <span className="admin-users__section-kicker"><FiActivity aria-hidden /> تحلیل کاربران</span>
            <h2 id="user-analytics-title">عملکرد در بازه انتخابی</h2>
            <p>تعداد کاربران یکتا در هر شاخص، بین تاریخ شروع و پایان انتخاب‌شده.</p>
          </div>
          <div className="admin-users__range-controls">
            <JalaliDatePicker
              label="از تاریخ"
              value={rangeStart}
              max={rangeEnd}
              onChange={setRangeStart}
            />
            <JalaliDatePicker
              label="تا تاریخ"
              value={rangeEnd}
              min={rangeStart}
              max={initialRange.end}
              onChange={setRangeEnd}
            />
            <button
              type="button"
              className="admin-users__action admin-users__action--primary admin-users__range-apply"
              disabled={rangeStart > rangeEnd || metricsFetching}
              onClick={() => setAppliedRange({ start: rangeStart, end: rangeEnd })}
            >
              <FiCalendar />
              {metricsFetching ? 'در حال به‌روزرسانی' : 'اعمال بازه'}
            </button>
          </div>
        </div>

        {metricsError ? (
          <div className="admin-users__analytics-error" role="alert">
            دریافت آمار این بازه با مشکل مواجه شد. بازه را دوباره اعمال کنید.
          </div>
        ) : null}
        <div className={`admin-users__metrics ${metricsLoading ? 'is-loading' : ''}`} aria-busy={metricsLoading || metricsFetching}>
          <article className="admin-users__metric admin-users__metric--blue">
            <span className="admin-users__metric-icon"><FiUserPlus aria-hidden /></span>
            <span className="admin-users__metric-label">ثبت‌نام‌های جدید</span>
            <strong className="admin-users__metric-value">{metricsLoading || metricsError ? '—' : persianNumber.format(userMetrics?.new_users ?? 0)}</strong>
            <span className="admin-users__metric-note">کاربران ساخته‌شده در این بازه</span>
          </article>
          <article className="admin-users__metric admin-users__metric--green">
            <span className="admin-users__metric-icon"><FiUserCheck aria-hidden /></span>
            <span className="admin-users__metric-label">کاربران فعال</span>
            <strong className="admin-users__metric-value">{metricsLoading || metricsError ? '—' : persianNumber.format(userMetrics?.active_users ?? 0)}</strong>
            <span className="admin-users__metric-note">حساب‌های دارای بازدید ثبت‌شده</span>
          </article>
          <article className="admin-users__metric admin-users__metric--purple">
            <span className="admin-users__metric-icon"><FiHome aria-hidden /></span>
            <span className="admin-users__metric-label">سازندگان اتاق</span>
            <strong className="admin-users__metric-value">{metricsLoading || metricsError ? '—' : persianNumber.format(userMetrics?.room_creators ?? 0)}</strong>
            <span className="admin-users__metric-note">کاربران یکتایی که اتاق ساخته‌اند</span>
          </article>
          <article className="admin-users__metric admin-users__metric--orange">
            <span className="admin-users__metric-icon"><FiActivity aria-hidden /></span>
            <span className="admin-users__metric-label">کاربران پیوسته به اتاق</span>
            <strong className="admin-users__metric-value">{metricsLoading || metricsError ? '—' : persianNumber.format(userMetrics?.room_joiners ?? 0)}</strong>
            <span className="admin-users__metric-note">کاربران یکتایی که وارد اتاق شده‌اند</span>
          </article>
        </div>
        {userMetrics && !metricsError ? (
          <div className="admin-users__range-caption">
            گزارش از {formatJalaliDate(`${userMetrics.start_date}T12:00:00`)} تا {formatJalaliDate(`${userMetrics.end_date}T12:00:00`)}
          </div>
        ) : null}
      </section>

      <section className="admin-users__directory" aria-labelledby="users-directory-title">
        <div className="admin-users__directory-heading">
          <div>
            <p className="admin-users__section-kicker">پایگاه کاربران</p>
            <h2 id="users-directory-title">فهرست و مدیریت اعضا</h2>
            <p>جست‌وجو، بررسی وضعیت و مدیریت دسترسی هر حساب از یک محل.</p>
          </div>
        </div>

      <div className="admin-users__toolbar">
        <label className="admin-users__search">
          <FiSearch aria-hidden />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="جستجو در نام یا شماره"
          />
        </label>

        <div className="admin-users__controls">
          <SmoothDropdown
            value={filter}
            options={FILTER_OPTIONS}
            onChange={(v) => {
              setFilter(v);
              setPage(1);
            }}
            ariaLabel="فیلتر وضعیت"
          />
          <SmoothDropdown
            value={sort}
            options={SORT_OPTIONS}
            onChange={(v) => {
              setSort(v);
              setPage(1);
            }}
            ariaLabel="مرتب‌سازی"
          />
        </div>
      </div>

      <div className="admin-users__table-card">
        {isLoading ? (
          <div className="admin-users__table-card__skeleton" aria-busy="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <div className="admin-users__table-card__skeleton-row" key={index} aria-hidden="true">
                <Skeleton variant="text" width={index % 2 ? 82 : 112} />
                <Skeleton variant="text" width={64} />
                <Skeleton variant="text" width={96} />
                <Skeleton variant="text" width={72} />
                <Skeleton variant="pill" width={70} height={28} />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="admin-users__empty">
            امکان بارگذاری کاربران وجود ندارد.
          </div>
        ) : (
          <>
            <div className="admin-users__table-scroll">
              <table className="admin-users__table">
                <thead>
                  <tr>
                    <th>کاربر</th>
                    <th>شماره</th>
                    <th>وضعیت</th>
                    <th>سطح</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.users?.map((user: AdminUser) => (
                    <tr key={user.id}>
                      <td>
                        <div className="admin-users__user">
                          <div className="admin-users__avatar">
                            {user.profile_picture ? (
                              <img
                                src={`${import.meta.env.VITE_BASE_URL}${user.profile_picture}`}
                                alt={user.username}
                              />
                            ) : (
                              <FiUserPlus />
                            )}
                          </div>
                          <div>
                            <p className="admin-users__username">
                              {user.username}
                            </p>
                            <span className="admin-users__meta">
                              {formatJalaliDateTime(user.created_at)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{user.phone_number}</td>
                      <td>
                        <div className="admin-users__badges">
                          {user.is_banned ? (
                            <span className="admin-users__badge admin-users__badge--banned">
                              مسدود
                            </span>
                          ) : (
                            <span className="admin-users__badge admin-users__badge--active">
                              فعال
                            </span>
                          )}
                          {user.is_admin ? (
                            <span className="admin-users__badge admin-users__badge--admin">
                              ادمین
                            </span>
                          ) : null}
                          {user.is_admin && isFullAccess ? (
                            <SmoothDropdown
                              value={String(user.access_level)}
                              options={[
                                { value: '1', label: 'سطح ۱' },
                                { value: '2', label: 'سطح ۲' },
                                { value: '3', label: 'سطح ۳' },
                              ]}
                              onChange={(value) => handleAccessLevelChange(user, value)}
                              ariaLabel={`سطح دسترسی ${user.username}`}
                            />
                          ) : user.is_admin ? (
                            <span className="admin-users__access-level">سطح {user.access_level}</span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <div className="admin-users__level-cell">
                          <span>{user.level}</span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-users__row-actions">
                          <button
                            type="button"
                            className="admin-users__action"
                            onClick={() => openEditUserModal(user)}
                            disabled={updateUserMutation.isPending}
                          >
                            <FiEdit2 />
                            ویرایش
                          </button>
                          <button
                            type="button"
                            className="admin-users__action"
                            onClick={() => handleToggleAdmin(user)}
                            disabled={updateUserMutation.isPending || (user.is_admin && !isFullAccess)}
                          >
                            <FiShield />
                            {user.is_admin ? 'حذف ادمینی' : 'تعیین ادمین'}
                          </button>
                          {user.is_banned ? (
                            <button
                              type="button"
                              className="admin-users__action admin-users__action--secondary"
                              onClick={() => unbanMutation.mutate(user.id)}
                              disabled={unbanMutation.isPending}
                            >
                              <FiChevronRight />
                              رفع مسدودی
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="admin-users__action admin-users__action--danger"
                              onClick={() => setSelectedUserId(user.id)}
                            >
                              <FiSlash />
                              مسدودسازی
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-users__pagination">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                aria-label="صفحه قبل"
              >
                <FiChevronRight />
              </button>
              <span>
                صفحه {page} از {pagination?.pages ?? 1}
              </span>
              <button
                type="button"
                disabled={page >= (pagination?.pages ?? 1)}
                onClick={() => setPage((current) => current + 1)}
                aria-label="صفحه بعد"
              >
                <FiChevronLeft />
              </button>
            </div>
          </>
        )}
      </div>
      </section>

      {userModal ? (
        <div
          className="admin-users__modal"
          onClick={closeUserModal}
          role="presentation"
        >
          <div
            className="admin-users__modal__card admin-users__modal__card--editor"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
          >
            <h3 id="user-modal-title">
              {userModal.mode === 'create' ? 'ایجاد کاربر جدید' : 'ویرایش کاربر'}
            </h3>
            <form onSubmit={handleUserSubmit} className="admin-users__modal__form">
              <label>
                <span>نام کاربری</span>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, username: event.target.value }))
                  }
                  autoComplete="off"
                  required
                />
              </label>
              <label>
                <span>شماره تلفن</span>
                <input
                  type="text"
                  value={userForm.phone_number}
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, phone_number: event.target.value }))
                  }
                  inputMode="tel"
                  autoComplete="off"
                  required
                />
              </label>
              <label>
                <span>رمز عبور{userModal.mode === 'edit' ? ' جدید (اختیاری)' : ''}</span>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, password: event.target.value }))
                  }
                  autoComplete="new-password"
                  required={userModal.mode === 'create'}
                  placeholder={userModal.mode === 'edit' ? 'برای تغییر رمز وارد کنید' : ''}
                />
              </label>

              {isFullAccess ? (
                <>
                  <label className="admin-users__modal__toggle">
                    <input
                      type="checkbox"
                      checked={userForm.is_admin}
                      onChange={(event) =>
                        setUserForm((current) => ({
                          ...current,
                          is_admin: event.target.checked,
                        }))
                      }
                    />
                    <span>این کاربر ادمین باشد</span>
                  </label>

                  {userForm.is_admin ? (
                    <label>
                      <span>سطح دسترسی</span>
                      <SmoothDropdown
                        value={userForm.access_level}
                        options={[
                          { value: '1', label: 'سطح ۱' },
                          { value: '2', label: 'سطح ۲' },
                          { value: '3', label: 'سطح ۳' },
                        ]}
                        onChange={(value) =>
                          setUserForm((current) => ({ ...current, access_level: value }))
                        }
                        ariaLabel="سطح دسترسی کاربر"
                      />
                    </label>
                  ) : null}
                </>
              ) : null}

              {userModal.mode === 'edit' ? (
                <span className="admin-users__modal__hint">
                  رمز عبور فقط زمانی تغییر می‌کند که مقدار جدید وارد کنید.
                </span>
              ) : null}

              <div className="admin-users__modal__actions">
                <button
                  type="button"
                  className="admin-users__action"
                  onClick={closeUserModal}
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="admin-users__action admin-users__action--primary"
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
                >
                  {userModal.mode === 'create' ? 'ایجاد کاربر' : 'ذخیره تغییرات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {selectedUserId ? (
        <div
          className="admin-users__modal"
          onClick={() => setSelectedUserId(null)}
          role="presentation"
        >
          <div
            className="admin-users__modal__card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ban-modal-title"
          >
            <h3 id="ban-modal-title">مسدودسازی کاربر</h3>
            <form onSubmit={handleBanSubmit} className="admin-users__modal__form">
              <label>
                <span>دلیل مسدودسازی</span>
                <textarea
                  value={banReason}
                  onChange={(event) => setBanReason(event.target.value)}
                  required
                  rows={3}
                />
              </label>
              <label>
                <span>مدت مسدودی</span>
                <SmoothDropdown
                  value={banDuration}
                  options={[
                    { value: '1week', label: '۱ هفته' },
                    { value: '1month', label: '۱ ماه' },
                    { value: '3months', label: '۳ ماه' },
                    { value: '6months', label: '۶ ماه' },
                    { value: '1year', label: '۱ سال' },
                    { value: 'forever', label: 'همیشه' },
                  ]}
                  onChange={setBanDuration}
                  ariaLabel="مدت مسدودی"
                />
              </label>
              <div className="admin-users__modal__actions">
                <button
                  type="button"
                  className="admin-users__action"
                  onClick={() => setSelectedUserId(null)}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="admin-users__action admin-users__action--danger"
                  disabled={banMutation.isPending || !banReason.trim()}
                >
                  تایید مسدودسازی
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Users;