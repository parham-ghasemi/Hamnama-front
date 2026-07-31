import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../apiCalls/adminApi';
import { AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import './Dashboard.scss';

interface SummaryCardProps {
  title: string;
  value: number;
  subtitle: string;
}

const SummaryCard = ({ title, value, subtitle }: SummaryCardProps) => (
  <div className="admin-dashboard__stat-card">
    <p className="admin-dashboard__stat-card__title">{title}</p>
    <p className="admin-dashboard__stat-card__value">{value.toLocaleString('fa-IR')}</p>
    <span className="admin-dashboard__stat-card__subtitle">{subtitle}</span>
  </div>
);

const Dashboard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard().then((res) => res.data),
  });

  const userSeries = useMemo(() => data?.charts.users_over_time ?? [], [data]);
  const roomSeries = useMemo(() => data?.charts.rooms_over_time ?? [], [data]);

  if (isLoading) {
    return (
      <section className="admin-dashboard">
        <div className="admin-dashboard__loading" />
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="admin-dashboard">
        <div className="admin-dashboard__empty">امکان بارگذاری داشبورد وجود ندارد.</div>
      </section>
    );
  }

  return (
    <section className="admin-dashboard">
      <div className="admin-dashboard__hero">
        <div>
          <p className="admin-dashboard__hero__eyebrow">نمای کلی</p>
          <h1 className="admin-dashboard__hero__title">داشبورد مدیریتی</h1>
        </div>
        <div className="admin-dashboard__hero__pill">به‌روزرسانی لحظه‌ای</div>
      </div>

      <div className="admin-dashboard__stats-grid">
        <SummaryCard title="کل کاربران" value={data.stats.users.all_time} subtitle="مجموع ثبت‌نامی‌ها" />
        <SummaryCard title="کل اتاق‌ها" value={data.stats.rooms.all_time} subtitle="مجموع اتاق‌های فعال و بسته‌شده" />
        <SummaryCard title="کاربران این هفته" value={data.stats.users.this_week} subtitle="تعداد ایجادشده در ۷ روز اخیر" />
        <SummaryCard title="کاربران این ماه" value={data.stats.users.this_month} subtitle="تعداد ایجادشده در ماه جاری" />
        <SummaryCard title="کاربران این سال" value={data.stats.users.this_year} subtitle="تعداد ایجادشده در سال جاری" />
        <SummaryCard title="اتاق‌ها این هفته" value={data.stats.rooms.this_week} subtitle="تعداد ساخته‌شده در ۷ روز اخیر" />
        <SummaryCard title="اتاق‌ها این ماه" value={data.stats.rooms.this_month} subtitle="تعداد ساخته‌شده در ماه جاری" />
        <SummaryCard title="اتاق‌ها این سال" value={data.stats.rooms.this_year} subtitle="تعداد ساخته‌شده در سال جاری" />
      </div>

      <div className="admin-dashboard__charts-grid">
        <div className="admin-dashboard__chart-card">
          <div className="admin-dashboard__chart-card__header">
            <div>
              <p className="admin-dashboard__chart-card__title">کاربران در طول زمان</p>
              <span className="admin-dashboard__chart-card__subtitle">روند رشد کاربران در ۱۲ ماه اخیر</span>
            </div>
          </div>
          <div className="admin-dashboard__chart-card__chart">
            <ResponsiveContainer>
              <AreaChart data={userSeries}>
                <defs>
                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d04e2f" stopOpacity={0.38} />
                    <stop offset="100%" stopColor="#d04e2f" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                <XAxis dataKey="label" tick={{ fill: '#cfc8c0', fontSize: 12 }} />
                <YAxis tick={{ fill: '#cfc8c0', fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#d04e2f" fill="url(#userGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-dashboard__chart-card">
          <div className="admin-dashboard__chart-card__header">
            <div>
              <p className="admin-dashboard__chart-card__title">اتاق‌ها در طول زمان</p>
              <span className="admin-dashboard__chart-card__subtitle">روند ساخت اتاق‌ها در ۱۲ ماه اخیر</span>
            </div>
          </div>
          <div className="admin-dashboard__chart-card__chart">
            <ResponsiveContainer>
              <AreaChart data={roomSeries}>
                <defs>
                  <linearGradient id="roomGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38e351" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#38e351" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                <XAxis dataKey="label" tick={{ fill: '#cfc8c0', fontSize: 12 }} />
                <YAxis tick={{ fill: '#cfc8c0', fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#38e351" fill="url(#roomGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
