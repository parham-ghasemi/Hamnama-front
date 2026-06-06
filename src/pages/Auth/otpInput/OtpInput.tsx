import { useEffect, useRef, useState } from 'react';
import './OtpInput.scss';
import { PiArrowClockwiseBold } from 'react-icons/pi';

interface OtpInputProps {
  phoneNumber: string;
  onSubmit: (otp: string) => void;
  onChangePhone: () => void;
  resendOtp: () => void;
}

const OtpInput = ({
  phoneNumber,
  onSubmit,
  onChangePhone,
  resendOtp,
}: OtpInputProps) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60);
  const [error, setError] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);

    setOtp(newOtp);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (error) setError('');
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (
      e.key === 'Backspace' &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 4);

    if (!pasted) return;

    const newOtp = ['', '', '', ''];

    pasted.split('').forEach((digit, index) => {
      newOtp[index] = digit;
    });

    setOtp(newOtp);

    const focusIndex = Math.min(pasted.length, 3);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = () => {
    const code = otp.join('');

    if (code.length !== 4) {
      setError('کد تایید را کامل وارد کنید');
      return;
    }

    onSubmit(code);
  };

  const handleResend = () => {
    resendOtp();
    setTimeLeft(60);
  };

  const maskedPhone = phoneNumber.slice(-3) + '****' + phoneNumber.slice(0, 4);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');

  return (
    <div className='otp-input'>
      <h1 className='otp-input__title'>
        تایید شماره موبایل
      </h1>

      <h2 className='otp-input__subtitle'>
        کد چهار رقمی ارسال شده به شماره "{maskedPhone}" را وارد کنید
      </h2>

      <div className='otp-input__content'>
        <div className='otp-input__fields'>

          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => {
                inputRefs.current[index] = el;
              }}
              type='text'
              maxLength={1}
              value={digit}
              onChange={e =>
                handleChange(e.target.value, index)
              }
              onKeyDown={e => handleKeyDown(e, index)}
              onPaste={handlePaste}
              className='otp-input__field'
            />
          ))}
        </div>

        <div className='otp-input__timer'>
          {timeLeft > 0 ? (
            `${minutes}:${seconds}`
          ) : (
            <button
              type='button'
              className='otp-input__resend'
              onClick={handleResend}
            >
              <PiArrowClockwiseBold />
            </button>
          )}
        </div>
      </div>

      <p
        className='otp-input__change-phone'
        onClick={onChangePhone}
      >
        تغییر شماره موبایل
      </p>

      {error && (
        <p className='otp-input__error'>
          {error}
        </p>
      )}

      <button
        className='otp-input__subBtn'
        onClick={handleSubmit}
      >
        تایید
      </button>
    </div>
  );
};

export default OtpInput;