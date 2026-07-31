import { useMemo, useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../apiCalls/adminApi';
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

type Period = 'week' | 'month' | 'year' | 'all';
type ChartRange = 'month' | 'quarter' | 'year' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  week: 'این هفته',
  month: 'این ماه',
  year: 'این سال',
  all: 'کل',
};

const CHART_RANGE_LABELS: Record<ChartRange, string> = {
  month: 'ماه اخیر',
  quarter: '۳ ماه اخیر',
  year: '۱۲ ماه اخیر',
  all: 'همه',
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
  });

  const [usersPeriod, setUsersPeriod] = useState<Period>('all');
  const [roomsPeriod, setRoomsPeriod] = useState<Period>('all');
  const [usersChartRange, setUsersChartRange] = useState<ChartRange>('year');
  const [roomsChartRange, setRoomsChartRange] = useState<ChartRange>('year');

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
      range === 'month' ? 1 : range === 'quarter' ? 3 : range === 'year' ? 12 : series.length;
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

  if (isLoading) {
    return (
      <section className="admin-dashboard">
        <div className="admin-dashboard__loading">در حال بارگذاری…</div>
      </section>
    );
  }

  if (isError || !data) {
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
      </div>

      <div className="admin-dashboard__charts">
        <div className="admin-dashboard__chart">
          <div className="admin-dashboard__chart__head">
            <div>
              <p className="admin-dashboard__chart__title">کاربران در طول زمان</p>
              <span className="admin-dashboard__chart__subtitle">
                روند رشد کاربران
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
              <AreaChart data={userSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                  dataKey="label"
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
                روند ساخت اتاق‌ها
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
              <AreaChart data={roomSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                  dataKey="label"
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
      </div>
    </section>
  );
};

export default Dashboard;