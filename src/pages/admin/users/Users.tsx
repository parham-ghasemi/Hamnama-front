import { useMemo, useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiUserPlus,
  FiShield,
  FiSlash,
} from 'react-icons/fi';
import { toast } from 'sonner';
import { adminApi } from '../../../apiCalls/adminApi';
import './Users.scss';

type Filter = 'all' | 'banned' | 'active';

interface DropdownOption<T extends string> {
  value: T;
  label: string;
}

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
  { value: '-created_at', label: 'جدیدترین' },
  { value: 'created_at', label: 'قدیمی‌ترین' },
  { value: 'username', label: 'نام کاربری' },
  { value: '-username', label: 'نام کاربری (معکوس)' },
];

const Users = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('-created_at');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banExpiresAt, setBanExpiresAt] = useState('');
  const [permanentBan, setPermanentBan] = useState(false);

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
    queryFn: async () => {
      const response = await adminApi.listUsers(params);
      return response.data;
    },
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
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('به‌روزرسانی کاربر با مشکل مواجه شد'),
  });

  const banMutation = useMutation({
    mutationFn: ({
      id,
      reason,
      expiresAt,
      permanent,
    }: {
      id: string;
      reason: string;
      expiresAt?: string;
      permanent: boolean;
    }) =>
      adminApi.banUser(id, {
        reason,
        expires_at: expiresAt,
        permanent,
      }),
    onSuccess: async () => {
      toast.success('کاربر مسدود شد');
      setBanReason('');
      setBanExpiresAt('');
      setPermanentBan(false);
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

  const handleToggleAdmin = (user: { id: string; is_admin: boolean }) => {
    updateUserMutation.mutate({
      id: user.id,
      payload: { is_admin: !user.is_admin },
    });
  };

  const handleBanSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUserId || !banReason.trim()) return;
    banMutation.mutate({
      id: selectedUserId,
      reason: banReason.trim(),
      expiresAt: banExpiresAt || undefined,
      permanent: permanentBan,
    });
  };

  const pagination = data?.pagination;

  return (
    <section className="admin-users">
      <header className="admin-users__header">
        <div>
          <p className="admin-users__eyebrow">کاربران</p>
          <h1 className="admin-users__title">مدیریت کاربران</h1>
        </div>
        <span className="admin-users__count">
          {pagination?.total ?? 0} کاربر
        </span>
      </header>

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
          <div className="admin-users__loading">در حال بارگذاری…</div>
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
                  {data?.users?.map(
                    (user: {
                      id: string;
                      username: string;
                      profile_picture?: string;
                      created_at: string;
                      phone_number: string;
                      is_banned: boolean;
                      is_admin: boolean;
                      level: number | string;
                    }) => (
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
                                {user.created_at}
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
                          </div>
                        </td>
                        <td>{user.level}</td>
                        <td>
                          <div className="admin-users__row-actions">
                            <button
                              type="button"
                              className="admin-users__action"
                              onClick={() => handleToggleAdmin(user)}
                              disabled={updateUserMutation.isPending}
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
              <label className="admin-users__modal__toggle">
                <input
                  type="checkbox"
                  checked={permanentBan}
                  onChange={(event) => setPermanentBan(event.target.checked)}
                />
                <span>مسدودسازی دائم</span>
              </label>
              {!permanentBan ? (
                <label>
                  <span>تاریخ انقضا</span>
                  <input
                    type="datetime-local"
                    value={banExpiresAt}
                    onChange={(event) => setBanExpiresAt(event.target.value)}
                  />
                </label>
              ) : null}
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