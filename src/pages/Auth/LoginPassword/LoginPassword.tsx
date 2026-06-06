import { useState } from 'react';
import './LoginPassword.scss';
import { Link } from 'react-router-dom';
import { PiEyeBold, PiEyeSlashBold } from 'react-icons/pi';

const LoginPassword = ({
  setPassword,
  goOtp,
}: {
  setPassword: (word: string) => void;
  goOtp: () => void;
}) => {
  const [password, setPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!password.trim()) {
      setError('رمز عبور خود را وارد کنید');
      return;
    }

    setError('');
    setPassword(password);
  };

  return (
    <div className='login-password'>
      <h1 className='login-password__title'>
        ورود در <Link to='/'>هم‌نما</Link>
      </h1>

      <h2 className='login-password__subtitle'>
        برای ورود در هم نما رمز عبور خود را وارد کنید.
      </h2>

      <div className='login-password__input-wrapper'>
        <input
          placeholder='رمز عبور'
          type={showPassword ? 'text' : 'password'}
          className='login-password__input'
          value={password}
          onChange={(e) => {
            setPasswordValue(e.target.value);

            if (error) setError('');
          }}
        />

        <button
          type='button'
          className='login-password__toggle-password'
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? <PiEyeSlashBold /> : <PiEyeBold />}
        </button>
      </div>

      <p
        className='login-password__otp-link'
        onClick={goOtp}
      >
        ورود با رمز یکبار مصرف
      </p>

      {error && (
        <p className='login-password__error'>
          {error}
        </p>
      )}

      <button
        className='login-password__subBtn'
        onClick={handleSubmit}
      >
        ادامه
      </button>
    </div>
  );
};

export default LoginPassword;