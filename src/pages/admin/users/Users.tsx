import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiSearch, FiChevronLeft, FiChevronRight, FiUserPlus, FiShield, FiSlash } from 'react-icons/fi';
import { toast } from 'sonner';
import { adminApi } from '../../../apiCalls/adminApi';
import './Users.scss';

const Users = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('-created_at');
  const [filter, setFilter] = useState<'all' | 'banned' | 'active'>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banExpiresAt, setBanExpiresAt] = useState('');
  const [permanentBan, setPermanentBan] = useState(false);

  const params = useMemo(() => ({
    search,
    page,
    limit: 10,
    sort,
    banned: filter === 'banned' ? true : filter === 'active' ? false : undefined,
    is_admin: undefined,
  }), [filter, page, search, sort]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users', params],
    queryFn: async () => {
      const response = await adminApi.listUsers(params);
      return response.data;
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => adminApi.updateUser(id, payload),
    onSuccess: async () => {
      toast.success('اطلاعات کاربر به‌روزرسانی شد');
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('به‌روزرسانی کاربر با مشکل مواجه شد'),
  });

  const banMutation = useMutation({
    mutationFn: ({ id, reason, expiresAt, permanent }: { id: string; reason: string; expiresAt?: string; permanent: boolean }) => adminApi.banUser(id, { reason, expires_at: expiresAt, permanent }),
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
    updateUserMutation.mutate({ id: user.id, payload: { is_admin: !user.is_admin } });
  };

  const handleBanSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUserId || !banReason.trim()) return;
    banMutation.mutate({ id: selectedUserId, reason: banReason.trim(), expiresAt: banExpiresAt || undefined, permanent: permanentBan });
  };

  const pagination = data?.pagination;

  return (
    <section className="admin-users">
      <div className="admin-users__hero">
        <div>
          <p className="admin-users__hero__eyebrow">کاربران</p>
          <h1 className="admin-users__hero__title">مدیریت کاربران</h1>
        </div>
        <div className="admin-users__hero__pill">{pagination?.total ?? 0} کاربر</div>
      </div>

      <div className="admin-users__toolbar">
        <label className="admin-users__toolbar__search">
          <FiSearch />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجو در نام یا شماره" />
        </label>

        <div className="admin-users__toolbar__controls">
          <select value={filter} onChange={(event) => { setFilter(event.target.value as 'all' | 'banned' | 'active'); setPage(1); }}>
            <option value="all">همه</option>
            <option value="banned">مسدود</option>
            <option value="active">فعال</option>
          </select>

          <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
            <option value="-created_at">جدیدترین</option>
            <option value="created_at">قدیمی‌ترین</option>
            <option value="username">نام کاربری</option>
            <option value="-username">نام کاربری (معکوس)</option>
          </select>
        </div>
      </div>

      <div className="admin-users__table-wrapper">
        {isLoading ? (
          <div className="admin-users__loading" />
        ) : isError ? (
          <div className="admin-users__empty">امکان بارگذاری کاربران وجود ندارد.</div>
        ) : (
          <>
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
                {data?.users?.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-users__table__user">
                        <div className="admin-users__table__user__avatar">
                          {user.profile_picture ? <img src={`${import.meta.env.VITE_BASE_URL}${user.profile_picture}`} alt={user.username} /> : <FiUserPlus />}
                        </div>
                        <div>
                          <p>{user.username}</p>
                          <span>{user.created_at}</span>
                        </div>
                      </div>
                    </td>
                    <td>{user.phone_number}</td>
                    <td>
                      <div className="admin-users__table__status-group">
                        {user.is_banned ? <span className="admin-users__badge admin-users__badge--banned">مسدود</span> : <span className="admin-users__badge admin-users__badge--active">فعال</span>}
                        {user.is_admin ? <span className="admin-users__badge admin-users__badge--admin">ادمین</span> : null}
                      </div>
                    </td>
                    <td>{user.level}</td>
                    <td>
                      <div className="admin-users__table__actions">
                        <button className="admin-users__action" onClick={() => handleToggleAdmin(user)}>
                          <FiShield />
                          {user.is_admin ? 'حذف ادمینی' : 'تعیین ادمین'}
                        </button>
                        {user.is_banned ? (
                          <button className="admin-users__action admin-users__action--secondary" onClick={() => unbanMutation.mutate(user.id)}>
                            <FiChevronRight />
                            رفع مسدودی
                          </button>
                        ) : (
                          <button className="admin-users__action admin-users__action--danger" onClick={() => setSelectedUserId(user.id)}>
                            <FiSlash />
                            مسدودسازی
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="admin-users__pagination">
              <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)}><FiChevronRight /></button>
              <span>صفحه {page} از {pagination?.pages ?? 1}</span>
              <button disabled={page >= (pagination?.pages ?? 1)} onClick={() => setPage((current) => current + 1)}><FiChevronLeft /></button>
            </div>
          </>
        )}
      </div>

      {selectedUserId ? (
        <div className="admin-users__ban-modal" onClick={() => setSelectedUserId(null)}>
          <div className="admin-users__ban-modal__card" onClick={(event) => event.stopPropagation()}>
            <h3>مسدودسازی کاربر</h3>
            <form onSubmit={handleBanSubmit} className="admin-users__ban-modal__card__form">
              <label>
                دلیل مسدودسازی
                <textarea value={banReason} onChange={(event) => setBanReason(event.target.value)} required />
              </label>
              <label className="admin-users__ban-modal__card__form__toggle">
                <input type="checkbox" checked={permanentBan} onChange={(event) => setPermanentBan(event.target.checked)} />
                <span>مسدودسازی دائم</span>
              </label>
              {!permanentBan ? (
                <label>
                  تاریخ انقضا
                  <input type="datetime-local" value={banExpiresAt} onChange={(event) => setBanExpiresAt(event.target.value)} />
                </label>
              ) : null}
              <div className="admin-users__ban-modal__card__form__actions">
                <button type="submit" className="admin-users__action admin-users__action--danger">تایید مسدودسازی</button>
                <button type="button" className="admin-users__action" onClick={() => setSelectedUserId(null)}>انصراف</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Users;
