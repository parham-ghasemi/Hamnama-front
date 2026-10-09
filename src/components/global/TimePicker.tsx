import { FiClock } from 'react-icons/fi';
import './TimePicker.scss';

export interface TimePickerProps {
  label: string;
  /** 24-hour local time in HH:mm format. */
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
}

/** Reusable time-only input; intentionally separate from JalaliDatePicker. */
const TimePicker = ({
  label,
  value,
  onChange,
  min,
  max,
  disabled = false,
  required = false,
}: TimePickerProps) => (
  <label className="global-time-picker">
    <span className="global-time-picker__label">{label}</span>
    <span className="global-time-picker__control">
      <FiClock aria-hidden />
      <input
        type="time"
        value={value}
        min={min}
        max={max}
        step={60}
        disabled={disabled}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      />
    </span>
  </label>
);

export default TimePicker;
