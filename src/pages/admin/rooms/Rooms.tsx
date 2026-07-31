import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiSearch, FiChevronLeft, FiChevronRight, FiLock, FiUnlock } from 'react-icons/fi';
import { toast } from 'sonner';
import { adminApi } from '../../../apiCalls/adminApi';
import './Rooms.scss';

const Rooms = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'closed' | 'open'>('all');
  const [sort, setSort] = useState('-created_at');

  const params = useMemo(() => ({
    search,
    page,
    limit: 10,
    sort,
    closed: filter === 'closed' ? true : filter === 'open' ? false : undefined,
    is_public: undefined,
  }), [filter, page, search, sort]);

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
      <div className="admin-rooms__hero">
        <div>
          <p className="admin-rooms__hero__eyebrow">اتاق‌ها</p>
          <h1 className="admin-rooms__hero__title">مدیریت اتاق‌ها</h1>
        </div>
        <div className="admin-rooms__hero__pill">{pagination?.total ?? 0} اتاق</div>
      </div>

      <div className="admin-rooms__toolbar">
        <label className="admin-rooms__toolbar__search">
          <FiSearch />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجو در کد اتاق" />
        </label>

        <div className="admin-rooms__toolbar__controls">
          <select value={filter} onChange={(event) => { setFilter(event.target.value as 'all' | 'closed' | 'open'); setPage(1); }}>
            <option value="all">همه</option>
            <option value="closed">بسته‌شده</option>
            <option value="open">باز</option>
          </select>

          <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
            <option value="-created_at">جدیدترین</option>
            <option value="created_at">قدیمی‌ترین</option>
            <option value="code">کد اتاق</option>
            <option value="-code">کد اتاق (معکوس)</option>
          </select>
        </div>
      </div>

      <div className="admin-rooms__table-wrapper">
        {isLoading ? (
          <div className="admin-rooms__loading" />
        ) : isError ? (
          <div className="admin-rooms__empty">امکان بارگذاری اتاق‌ها وجود ندارد.</div>
        ) : (
          <>
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
                {data?.rooms?.map((room) => (
                  <tr key={room.id}>
                    <td>#{room.code}</td>
                    <td>
                      <div className="admin-rooms__table__status-group">
                        <span className={`admin-rooms__badge ${room.is_closed ? 'admin-rooms__badge--closed' : 'admin-rooms__badge--open'}`}>{room.is_closed ? 'بسته' : 'باز'}</span>
                        <span className={`admin-rooms__badge ${room.is_public ? 'admin-rooms__badge--public' : 'admin-rooms__badge--private'}`}>{room.is_public ? 'عمومی' : 'خصوصی'}</span>
                      </div>
                    </td>
                    <td>{room.created_by}</td>
                    <td>{room.currently_playing ?? '—'}</td>
                    <td>
                      <div className="admin-rooms__table__actions">
                        {room.is_closed ? (
                          <button className="admin-rooms__action admin-rooms__action--secondary" onClick={() => reopenMutation.mutate(room.id)}>
                            <FiUnlock />
                            بازکردن
                          </button>
                        ) : (
                          <button className="admin-rooms__action admin-rooms__action--danger" onClick={() => closeMutation.mutate(room.id)}>
                            <FiLock />
                            بستن
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="admin-rooms__pagination">
              <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)}><FiChevronRight /></button>
              <span>صفحه {page} از {pagination?.pages ?? 1}</span>
              <button disabled={page >= (pagination?.pages ?? 1)} onClick={() => setPage((current) => current + 1)}><FiChevronLeft /></button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Rooms;
