import { useRef, useState } from 'react';
import './LoginPassword.scss';
import { Link } from 'react-router-dom';
import { PiEyeBold, PiEyeSlashBold, PiSpinnerGapBold, PiLockKeyFill } from 'react-icons/pi';
import Turnstile, { type TurnstileHandle } from '../../../components/turnstile/Turnstile';

interface LoginPasswordProps {
  setPassword: (word: string, turnstileToken: string) => Promise<void>;
  goOtp: () => void;
  isLoading?: boolean;
}

const LoginPassword = ({ setPassword, goOtp, isLoading = false }: LoginPasswordProps) => {
  const [password, setPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef<TurnstileHandle | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('رمز عبور خود را وارد کنید');
      return;
    }

    if (!turnstileToken) {
      setError('لطفاً تأیید امنیتی را کامل کنید');
      return;
    }

    setError('');
    try {
      await setPassword(password, turnstileToken);
    } finally {
      turnstileRef.current?.reset();
      setTurnstileToken('');
    }
  };

  return (
    <form className='login-password' onSubmit={handleSubmit}>
      <span className='login-password__badge'>
        <PiLockKeyFill aria-hidden='true' />
        ورود
      </span>

      <h1 className='login-password__title'>
        ورود در <Link to='/'>هم‌نما</Link>
      </h1>

      <h2 className='login-password__subtitle'>
        برای ورود در هم‌نما رمز عبور خود را وارد کنید.
      </h2>

      <div className='login-password__input-wrapper'>
        <input
          placeholder='رمز عبور'
          type={showPassword ? 'text' : 'password'}
          dir='ltr'
          className='login-password__input'
          value={password}
          onChange={(e) => {
            setPasswordValue(e.target.value);
            if (error) setError('');
          }}
          disabled={isLoading}
        />

        <button
          type='button'
          className='login-password__toggle-password'
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? <PiEyeSlashBold /> : <PiEyeBold />}
        </button>
      </div>

      <p className='login-password__otp-link' onClick={goOtp}>
        ورود با رمز یکبار مصرف
      </p>

      {error && (
        <p className='login-password__error'>
          {error}
        </p>
      )}

      <div className="login-password__captcha">
        <Turnstile
          ref={turnstileRef}
          action="login"
          onToken={setTurnstileToken}
          onError={() => setTurnstileToken('')}
          onExpired={() => setTurnstileToken('')}
        />
      </div>

      <button
        type='submit'
        className='login-password__subBtn'
        disabled={!password.trim() || isLoading}
      >
        {isLoading ? <PiSpinnerGapBold className="icon-spin" /> : 'ادامه'}
      </button>
    </form>
  );
};

export default LoginPassword;
