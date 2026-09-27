import { useMemo, useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  adminApi,
  type WebsiteAnalyticsAccountFilter,
  type WebsiteAnalyticsRange,
} from '../../../apiCalls/adminApi';
import {
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import './Dashboard.scss';
import Skeleton from "../../../components/skeleton/Skeleton";

type Period = 'week' | 'month' | 'year' | 'all';
type ChartRange = 'month' | 'quarter' | 'year' | 'all';
type WebsiteAccountFilter = WebsiteAnalyticsAccountFilter;


const PERIOD_LABELS: Record<Period, string> = {
  week: 'این هفته',
  month: 'این ماه',
  year: 'این سال',
  all: 'کل',
};

const CHART_RANGE_LABELS: Record<ChartRange, string> = {
  month: '۳۰ روز اخیر',
  quarter: '۹۰ روز اخیر',
  year: '۳۶۵ روز اخیر',
  all: 'همه',
};

const WEBSITE_RANGE_LABELS: Record<WebsiteAnalyticsRange, string> = {
  '24h': '۲۴ ساعت اخیر',
  '30d': '۳۰ روز اخیر',
  '90d': '۹۰ روز اخیر',
  '365d': '۳۶۵ روز اخیر',
  all: 'همه',
};

const WEBSITE_ACCOUNT_LABELS: Record<WebsiteAccountFilter, string> = {
  all: 'همه بازدیدکنندگان',
  account: 'دارای حساب',
  guest: 'مهمان‌ها',
};

const formatJalaliDate = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

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
    <div
      className={`admin-dash-dropdown ${open ? 'is-open' : ''}`}
      ref={rootRef}
    >
      <button
        type="button"
        className="admin-dash-dropdown__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{selected?.label ?? ''}</span>
        <svg
          className="admin-dash-dropdown__chevron"
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
      <ul
        className="admin-dash-dropdown__menu"
        role="listbox"
        aria-label={ariaLabel}
      >
        {options.map((opt) => (
          <li key={opt.value} role="option" aria-selected={opt.value === value}>
            <button
              type="button"
              className={`admin-dash-dropdown__option ${opt.value === value ? 'is-active' : ''
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

interface MetricCardProps {
  title: string;
  value: number;
  period: Period;
  onPeriodChange: (p: Period) => void;
  accent: 'primary' | 'green';
}

const MetricCard = ({
  title,
  value,
  period,
  onPeriodChange,
  accent,
}: MetricCardProps) => {
  const periodOptions: DropdownOption<Period>[] = (
    Object.keys(PERIOD_LABELS) as Period[]
  ).map((k) => ({ value: k, label: PERIOD_LABELS[k] }));

  return (
    <div className={`admin-dashboard__metric admin-dashboard__metric--${accent}`}>
      <div className="admin-dashboard__metric__head">
        <p className="admin-dashboard__metric__title">{title}</p>
        <SmoothDropdown
          value={period}
          options={periodOptions}
          onChange={onPeriodChange}
          ariaLabel={`بازه زمانی ${title}`}
        />
      </div>
      <p className="admin-dashboard__metric__value">
        {value.toLocaleString('fa-IR')}
      </p>
      <span className="admin-dashboard__metric__hint">
        {PERIOD_LABELS[period]}
      </span>
    </div>
  );
};

const Dashboard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard().then((res) => res.data),
    refetchInterval: 30000,
  });

  const [usersPeriod, setUsersPeriod] = useState<Period>('all');
  const [roomsPeriod, setRoomsPeriod] = useState<Period>('all');
  const [usersChartRange, setUsersChartRange] = useState<ChartRange>('year');
  const [roomsChartRange, setRoomsChartRange] = useState<ChartRange>('year');
  const [websiteRange, setWebsiteRange] = useState<WebsiteAnalyticsRange>('365d');
  const [websiteCardAccount, setWebsiteCardAccount] = useState<WebsiteAccountFilter>('all');
  const [websiteAccount, setWebsiteAccount] = useState<WebsiteAccountFilter>('all');

  const { data: websiteAnalytics, isLoading: isWebsiteAnalyticsLoading } = useQuery({
    queryKey: ['admin-website-analytics', websiteRange, websiteAccount],
    queryFn: () =>
      adminApi.getWebsiteAnalytics(websiteRange, websiteAccount).then((res) => res.data),
    refetchInterval: 30000,
  });

  const { data: websiteCardAnalytics } = useQuery({
    queryKey: ['admin-website-analytics-card', websiteCardAccount],
    queryFn: () =>
      adminApi.getWebsiteAnalytics('24h', websiteCardAccount).then((res) => res.data),
    refetchInterval: 30000,
  });

  const userSeriesRaw = useMemo(
    () => data?.charts.users_over_time ?? [],
    [data]
  );
  const roomSeriesRaw = useMemo(
    () => data?.charts.rooms_over_time ?? [],
    [data]
  );

  const sliceByRange = <T,>(series: T[], range: ChartRange): T[] => {
    if (!series.length || range === 'all') return series;
    const n =
      range === 'month' ? 30 : range === 'quarter' ? 90 : range === 'year' ? 365 : series.length;
    return series.slice(-Math.min(n, series.length));
  };

  const userSeries = useMemo(
    () => sliceByRange(userSeriesRaw, usersChartRange),
    [userSeriesRaw, usersChartRange]
  );
  const roomSeries = useMemo(
    () => sliceByRange(roomSeriesRaw, roomsChartRange),
    [roomSeriesRaw, roomsChartRange]
  );

  const userChartData = useMemo(
    () => userSeries.map((point) => ({ ...point, jalali_label: formatJalaliDate(point.label) })),
    [userSeries]
  );
  const roomChartData = useMemo(
    () => roomSeries.map((point) => ({ ...point, jalali_label: formatJalaliDate(point.label) })),
    [roomSeries]
  );
  const websiteChartData = useMemo(
    () =>
      (websiteAnalytics?.visits_over_time ?? []).map((point) => ({
        ...point,
        jalali_label: formatJalaliDate(point.label),
      })),
    [websiteAnalytics]
  );

  const getStat = (
    kind: 'users' | 'rooms',
    period: Period
  ): number => {
    if (!data) return 0;
    const s = data.stats[kind];
    if (period === 'week') return s.this_week;
    if (period === 'month') return s.this_month;
    if (period === 'year') return s.this_year;
    return s.all_time;
  };

  const chartRangeOptions: DropdownOption<ChartRange>[] = (
    Object.keys(CHART_RANGE_LABELS) as ChartRange[]
  ).map((k) => ({ value: k, label: CHART_RANGE_LABELS[k] }));

  if (isError) {
    return (
      <section className="admin-dashboard">
        <div className="admin-dashboard__empty">
          امکان بارگذاری داشبورد وجود ندارد.
        </div>
      </section>
    );
  }

  return (
    <section className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">نمای کلی</p>
          <h1 className="admin-dashboard__title">داشبورد مدیریتی</h1>
        </div>
      </header>

      {isLoading ? (
        <>
          <div className="admin-dashboard__metrics">
            {[0, 1, 2, 3].map((index) => (
              <div className="admin-dashboard__metric-skeleton" key={index}>
                <Skeleton variant="text" width={96} />
                <Skeleton variant="text" width={96} height={28} />
              </div>
            ))}
          </div>
          <div className="admin-dashboard__chart-skeleton"><Skeleton variant="rect" width="100%" height={300} radius={18} /></div>
        </>
      ) : (
        <>
      <div className="admin-dashboard__metrics">
        <MetricCard
          title="کاربران"
          value={getStat('users', usersPeriod)}
          period={usersPeriod}
          onPeriodChange={setUsersPeriod}
          accent="primary"
        />
        <MetricCard
          title="اتاق‌ها"
          value={getStat('rooms', roomsPeriod)}
          period={roomsPeriod}
          onPeriodChange={setRoomsPeriod}
          accent="green"
        />
        <div className="admin-dashboard__metric admin-dashboard__metric--green">
          <div className="admin-dashboard__metric__head">
            <p className="admin-dashboard__metric__title">کاربران آنلاین</p>
            <span className="admin-dashboard__metric__live">فعال</span>
          </div>
          <p className="admin-dashboard__metric__value">
            {(data?.online_users ?? 0).toLocaleString('fa-IR')}
          </p>
          <span className="admin-dashboard__metric__hint">
            نشست‌های فعال در ۱۰ دقیقه اخیر
          </span>
        </div>
        <div className="admin-dashboard__metric admin-dashboard__metric--primary">
          <div className="admin-dashboard__metric__head">
            <p className="admin-dashboard__metric__title">بازدیدکنندگان یکتا</p>
            <SmoothDropdown
              value={websiteCardAccount}
              options={(Object.keys(WEBSITE_ACCOUNT_LABELS) as WebsiteAccountFilter[]).map((key) => ({
                value: key,
                label: WEBSITE_ACCOUNT_LABELS[key],
              }))}
              onChange={setWebsiteCardAccount}
              ariaLabel="نوع بازدیدکنندگان"
            />
          </div>
          <p className="admin-dashboard__metric__value">
            {(websiteCardAnalytics?.unique_visitors ?? 0).toLocaleString('fa-IR')}
          </p>
          <span className="admin-dashboard__metric__hint">
            ۲۴ ساعت اخیر
          </span>
        </div>
      </div>
      <div className="admin-dashboard__charts">
        <div className="admin-dashboard__chart">
          <div className="admin-dashboard__chart__head">
            <div>
              <p className="admin-dashboard__chart__title">کاربران در طول زمان</p>
              <span className="admin-dashboard__chart__subtitle">
                تعداد ثبت‌نام‌های جدید به تفکیک روز
              </span>
            </div>
            <SmoothDropdown
              value={usersChartRange}
              options={chartRangeOptions}
              onChange={setUsersChartRange}
              ariaLabel="بازه زمانی نمودار کاربران"
            />
          </div>
          <div className="admin-dashboard__chart__body">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d04e2f" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#d04e2f" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray="3 6"
                  vertical={false}
                />
                <XAxis
                  dataKey="jalali_label"
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--dash-tooltip-bg)',
                    border: '1px solid var(--dash-border)',
                    borderRadius: 10,
                    color: 'var(--dash-text)',
                    fontSize: 13,
                  }}
                  itemStyle={{ color: 'var(--dash-text)' }}
                  labelStyle={{ color: 'var(--dash-muted)' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#d04e2f"
                  fill="url(#userGradient)"
                  strokeWidth={2.5}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-dashboard__chart">
          <div className="admin-dashboard__chart__head">
            <div>
              <p className="admin-dashboard__chart__title">اتاق‌ها در طول زمان</p>
              <span className="admin-dashboard__chart__subtitle">
                تعداد اتاق‌های ساخته‌شده به تفکیک روز
              </span>
            </div>
            <SmoothDropdown
              value={roomsChartRange}
              options={chartRangeOptions}
              onChange={setRoomsChartRange}
              ariaLabel="بازه زمانی نمودار اتاق‌ها"
            />
          </div>
          <div className="admin-dashboard__chart__body">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={roomChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="roomGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38e351" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#38e351" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray="3 6"
                  vertical={false}
                />
                <XAxis
                  dataKey="jalali_label"
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--dash-tooltip-bg)',
                    border: '1px solid var(--dash-border)',
                    borderRadius: 10,
                    color: 'var(--dash-text)',
                    fontSize: 13,
                  }}
                  itemStyle={{ color: 'var(--dash-text)' }}
                  labelStyle={{ color: 'var(--dash-muted)' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#38e351"
                  fill="url(#roomGradient)"
                  strokeWidth={2.5}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-dashboard__chart admin-dashboard__chart--wide">
          <div className="admin-dashboard__chart__head admin-dashboard__chart__head--filters">
            <div>
              <p className="admin-dashboard__chart__title">بازدیدهای سایت در طول زمان</p>
              <span className="admin-dashboard__chart__subtitle">
                تعداد بازدیدهای ثبت‌شده به تفکیک روز
              </span>
            </div>
            <div className="admin-dashboard__chart__filters">
              <SmoothDropdown
                value={websiteRange}
                options={(Object.keys(WEBSITE_RANGE_LABELS) as WebsiteAnalyticsRange[]).map((key) => ({
                  value: key,
                  label: WEBSITE_RANGE_LABELS[key],
                }))}
                onChange={setWebsiteRange}
                ariaLabel="بازه زمانی بازدیدهای سایت"
              />
              <SmoothDropdown
                value={websiteAccount}
                options={(Object.keys(WEBSITE_ACCOUNT_LABELS) as WebsiteAccountFilter[]).map((key) => ({
                  value: key,
                  label: WEBSITE_ACCOUNT_LABELS[key],
                }))}
                onChange={setWebsiteAccount}
                ariaLabel="فیلتر حساب بازدیدهای سایت"
              />
            </div>
          </div>
          <div className="admin-dashboard__chart__body">
            {isWebsiteAnalyticsLoading ? (
              <div className="admin-dashboard__chart__loading">
                <Skeleton variant="rect" width="100%" height={260} radius={14} />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={websiteChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="websiteVisitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d04e2f" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#d04e2f" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="3 6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="jalali_label"
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--dash-tooltip-bg)',
                      border: '1px solid var(--dash-border)',
                      borderRadius: 10,
                      color: 'var(--dash-text)',
                      fontSize: 13,
                    }}
                    itemStyle={{ color: 'var(--dash-text)' }}
                    labelStyle={{ color: 'var(--dash-muted)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#d04e2f"
                    fill="url(#websiteVisitGradient)"
                    strokeWidth={2.5}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
        </>
      )}
    </section>
  );
};

export default Dashboard;