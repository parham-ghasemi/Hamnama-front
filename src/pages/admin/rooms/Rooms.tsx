import { useMemo, useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiLock,
  FiUnlock,
} from 'react-icons/fi';
import { toast } from 'sonner';
import { adminApi } from '../../../apiCalls/adminApi';
import './Rooms.scss';

type Filter = 'all' | 'closed' | 'open';

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
    <div className={`admin-room-dropdown ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="admin-room-dropdown__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{selected?.label ?? ''}</span>
        <svg
          className="admin-room-dropdown__chevron"
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
      <ul className="admin-room-dropdown__menu" role="listbox" aria-label={ariaLabel}>
        {options.map((opt) => (
          <li key={opt.value} role="option" aria-selected={opt.value === value}>
            <button
              type="button"
              className={`admin-room-dropdown__option ${opt.value === value ? 'is-active' : ''
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
  { value: 'closed', label: 'بسته‌شده' },
  { value: 'open', label: 'باز' },
];

const SORT_OPTIONS: DropdownOption<string>[] = [
  { value: '-created_at', label: 'جدیدترین' },
  { value: 'created_at', label: 'قدیمی‌ترین' },
  { value: 'code', label: 'کد اتاق' },
  { value: '-code', label: 'کد اتاق (معکوس)' },
];

const Rooms = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState('-created_at');

  const params = useMemo(
    () => ({
      search,
      page,
      limit: 10,
      sort,
      closed:
        filter === 'closed' ? true : filter === 'open' ? false : undefined,
      is_public: undefined,
    }),
    [filter, page, search, sort]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-rooms', params],
    queryFn: async () => {
      const response = await adminApi.listRooms(params);
      return response.data;
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => adminApi.closeRoom(id),
    onSuccess: async () => {
      toast.success('اتاق بسته شد');
      await queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
    },
    onError: () => toast.error('امکان بستن اتاق وجود ندارد'),
  });

  const reopenMutation = useMutation({
    mutationFn: (id: string) => adminApi.reopenRoom(id),
    onSuccess: async () => {
      toast.success('اتاق دوباره باز شد');
      await queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
    },
    onError: () => toast.error('امکان باز کردن اتاق وجود ندارد'),
  });

  const pagination = data?.pagination;

  return (
    <section className="admin-rooms">
      <header className="admin-rooms__header">
        <div>
          <p className="admin-rooms__eyebrow">اتاق‌ها</p>
          <h1 className="admin-rooms__title">مدیریت اتاق‌ها</h1>
        </div>
        <span className="admin-rooms__count">
          {pagination?.total ?? 0} اتاق
        </span>
      </header>

      <div className="admin-rooms__toolbar">
        <label className="admin-rooms__search">
          <FiSearch aria-hidden />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="جستجو در کد اتاق"
          />
        </label>

        <div className="admin-rooms__controls">
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

      <div className="admin-rooms__table-card">
        {isLoading ? (
          <div className="admin-rooms__loading">در حال بارگذاری…</div>
        ) : isError ? (
          <div className="admin-rooms__empty">
            امکان بارگذاری اتاق‌ها وجود ندارد.
          </div>
        ) : (
          <>
            <div className="admin-rooms__table-scroll">
              <table className="admin-rooms__table">
                <thead>
                  <tr>
                    <th>کد اتاق</th>
                    <th>وضعیت</th>
                    <th>مالک</th>
                    <th>پخش کنونی</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.rooms?.map(
                    (room) => (
                      <tr key={room.id}>
                        <td>
                          <span className="admin-rooms__code">#{room.code}</span>
                        </td>
                        <td>
                          <div className="admin-rooms__badges">
                            <span
                              className={`admin-rooms__badge ${room.is_closed
                                ? 'admin-rooms__badge--closed'
                                : 'admin-rooms__badge--open'
                                }`}
                            >
                              {room.is_closed ? 'بسته' : 'باز'}
                            </span>
                            <span
                              className={`admin-rooms__badge ${room.is_public
                                ? 'admin-rooms__badge--public'
                                : 'admin-rooms__badge--private'
                                }`}
                            >
                              {room.is_public ? 'عمومی' : 'خصوصی'}
                            </span>
                          </div>
                        </td>
                        <td>{room.created_by}</td>
                        <td>
                          <span className="admin-rooms__playing">
                            {room.currently_playing ?? '—'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-rooms__row-actions">
                            {room.is_closed ? (
                              <button
                                type="button"
                                className="admin-rooms__action admin-rooms__action--secondary"
                                onClick={() => reopenMutation.mutate(room.id)}
                                disabled={reopenMutation.isPending}
                              >
                                <FiUnlock />
                                بازکردن
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="admin-rooms__action admin-rooms__action--danger"
                                onClick={() => closeMutation.mutate(room.id)}
                                disabled={closeMutation.isPending}
                              >
                                <FiLock />
                                بستن
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

            <div className="admin-rooms__pagination">
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
  );
};

export default Rooms;