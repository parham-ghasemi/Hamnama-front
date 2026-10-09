import { useEffect, useMemo, useRef, useState } from 'react';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './JalaliDatePicker.scss';

export interface JalaliDatePickerProps {
  label: string;
  /** Gregorian ISO date (YYYY-MM-DD) used as the API value. The UI is always Jalali. */
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
}

type JalaliParts = { year: number; month: number; day: number };

const jalaliNumericFormatter = new Intl.DateTimeFormat('en-US-u-ca-persian', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});
const jalaliDisplayFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
const jalaliMonthFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  month: 'long',
  year: 'numeric',
});
const jalaliDayFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric' });
const weekdayLabels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

const atLocalNoon = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);

const parseIsoDate = (value?: string): Date => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return atLocalNoon(new Date());
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? atLocalNoon(new Date()) : date;
};

export const toIsoLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getJalaliParts = (date: Date): JalaliParts => {
  const values = jalaliNumericFormatter.formatToParts(date);
  return {
    year: Number(values.find((part) => part.type === 'year')?.value),
    month: Number(values.find((part) => part.type === 'month')?.value),
    day: Number(values.find((part) => part.type === 'day')?.value),
  };
};

const sameJalaliMonth = (left: Date, right: Date) => {
  const a = getJalaliParts(left);
  const b = getJalaliParts(right);
  return a.year === b.year && a.month === b.month;
};

// Keep the visible anchor around the middle of a Jalali month so month navigation
// remains correct regardless of which day the selected date falls on.
const getMonthAnchor = (date: Date): Date => {
  const anchor = atLocalNoon(date);
  for (let i = 0; i < 32; i += 1) {
    const previous = new Date(anchor);
    previous.setDate(previous.getDate() - 1);
    if (!sameJalaliMonth(anchor, previous)) break;
    anchor.setDate(anchor.getDate() - 1);
  }
  anchor.setDate(anchor.getDate() + 15);
  return anchor;
};

const getMonthFirstDay = (anchorValue: Date): Date => {
  const anchor = atLocalNoon(anchorValue);
  for (let i = 0; i < 32; i += 1) {
    const previous = new Date(anchor);
    previous.setDate(previous.getDate() - 1);
    if (!sameJalaliMonth(anchor, previous)) return anchor;
    anchor.setDate(anchor.getDate() - 1);
  }
  return anchor;
};

const addDays = (source: Date, days: number) => {
  const date = atLocalNoon(source);
  date.setDate(date.getDate() + days);
  return date;
};

const formatJalali = (value: string) => jalaliDisplayFormatter.format(parseIsoDate(value));

const JalaliDatePicker = ({ label, value, onChange, min, max, disabled = false }: JalaliDatePickerProps) => {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthAnchor(parseIsoDate(value)));
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedDate = useMemo(() => parseIsoDate(value), [value]);
  const monthFirst = useMemo(() => getMonthFirstDay(visibleMonth), [visibleMonth]);
  const monthLabel = jalaliMonthFormatter.format(visibleMonth);

  useEffect(() => {
    setVisibleMonth(getMonthAnchor(parseIsoDate(value)));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const weekdayOffset = (monthFirst.getDay() + 1) % 7; // Saturday-first Jalali calendar
  const gridStart = addDays(monthFirst, -weekdayOffset);
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));

  const changeMonth = (direction: -1 | 1) => {
    setVisibleMonth((current) => {
      const next = atLocalNoon(current);
      next.setDate(next.getDate() + 25 * direction);
      return getMonthAnchor(next);
    });
  };

  const isInRange = (date: Date) => {
    const iso = toIsoLocalDate(date);
    return (!min || iso >= min) && (!max || iso <= max);
  };

  return (
    <div className={`jalali-date-picker ${open ? 'is-open' : ''}`} ref={rootRef}>
      <span className="jalali-date-picker__label">{label}</span>
      <button
        type="button"
        className="jalali-date-picker__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <FiCalendar aria-hidden />
        <span>{formatJalali(value)}</span>
        <span className="jalali-date-picker__trigger-chevron" aria-hidden>⌄</span>
      </button>
      {open ? (
        <div className="jalali-date-picker__popover" role="dialog" aria-label={`انتخاب ${label}`}>
          <div className="jalali-date-picker__month-nav">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="ماه قبل">
              <FiChevronRight aria-hidden />
            </button>
            <strong>{monthLabel}</strong>
            <button type="button" onClick={() => changeMonth(1)} aria-label="ماه بعد">
              <FiChevronLeft aria-hidden />
            </button>
          </div>
          <div className="jalali-date-picker__weekdays" aria-hidden>
            {weekdayLabels.map((weekday) => <span key={weekday}>{weekday}</span>)}
          </div>
          <div className="jalali-date-picker__days">
            {days.map((date) => {
              const iso = toIsoLocalDate(date);
              const sameMonth = sameJalaliMonth(date, visibleMonth);
              const selected = iso === value;
              const inRange = isInRange(date);
              return (
                <button
                  key={iso}
                  type="button"
                  className={[
                    'jalali-date-picker__day',
                    sameMonth ? '' : 'is-outside',
                    selected ? 'is-selected' : '',
                    iso === toIsoLocalDate(atLocalNoon(new Date())) ? 'is-today' : '',
                  ].filter(Boolean).join(' ')}
                  disabled={!sameMonth || !inRange}
                  aria-pressed={selected}
                  aria-label={jalaliDisplayFormatter.format(date)}
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                >
                  {jalaliDayFormatter.format(date)}
                </button>
              );
            })}
          </div>
          <div className="jalali-date-picker__footer">
            <span>{jalaliDisplayFormatter.format(selectedDate)}</span>
            <button type="button" onClick={() => { onChange(toIsoLocalDate(new Date())); setOpen(false); }}>
              امروز
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default JalaliDatePicker;
