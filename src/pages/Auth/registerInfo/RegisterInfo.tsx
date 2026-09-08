import { useRef, useState } from 'react';
import './RegisterInfo.scss';
import { Link } from 'react-router-dom';
import { PiEyeBold, PiEyeSlashBold, PiUserFill, PiSpinnerGapBold, PiIdentificationBadgeFill } from 'react-icons/pi';
import { toast } from '../../../components/toast';
import clsx from 'clsx';
import Turnstile, { type TurnstileHandle } from '../../../components/turnstile/Turnstile';

interface RegisterInfoProps {
  onSubmit: (data: { username: string; password: string; turnstileToken: string }) => Promise<void>;
  isLoading?: boolean;
}

const RegisterInfo = ({ onSubmit, isLoading = false }: RegisterInfoProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [domError, setDomError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef<TurnstileHandle | null>(null);

  const validatePassword = (pw: string) => {
    if (pw.length < 5) return 'رمز عبور باید حداقل بیش از پنج کاراکتر باشد';
    if (!/[a-zA-Z]/.test(pw)) return 'رمز عبور شامل حروف انگلیسی و عدد باشد';
    if (!/[A-Z]/.test(pw)) return 'رمز عبور باید حداقل یک حرف بزرگ داشته باشد';
    if (!/\d/.test(pw)) return 'رمز عبور شامل حروف انگلیسی و عدد باشد';
    if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]+$/.test(pw)) return 'رمز عبور تنها می‌تواند شامل حروف، اعداد و سیمبل‌های مجاز باشد.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== repeatPassword) {
      toast.error('رمز عبور و تکرار آن مطابقت ندارند');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setDomError(passwordError);
      return;
    }

    setDomError('');

    if (!turnstileToken) {
      setDomError('لطفاً تأیید امنیتی را کامل کنید');
      return;
    }

    try {
      await onSubmit({ username, password, turnstileToken });
    } finally {
      turnstileRef.current?.reset();
      setTurnstileToken('');
    }
  };

  const isFormFilled = username.trim() !== '' && password.trim() !== '' && repeatPassword.trim() !== '';

  return (
    <form className="register-info" onSubmit={handleSubmit}>
      <span className="register-info__badge">
        <PiIdentificationBadgeFill aria-hidden="true" />
        ساخت حساب
      </span>

      <div className="register-info__group">
        <h2 className="register-info__label">نام کاربری</h2>
        <div className="register-info__input-wrapper">
          <PiUserFill className="register-info__icon" />
          <input
            type="text"
            dir="ltr"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="register-info__input"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="register-info__group">
        <h2 className="register-info__label">رمز عبور</h2>
        <div className="register-info__input-wrapper">
          <button
            type="button"
            className="register-info__icon-btn"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? <PiEyeSlashBold /> : <PiEyeBold />}
          </button>
          <input
            type={showPassword ? 'text' : 'password'}
            dir="ltr"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (domError) setDomError('');
            }}
            className="register-info__input"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="register-info__group">
        <h2 className="register-info__label">رمز عبور را تکرار کنید</h2>
        <div className="register-info__input-wrapper">
          <button
            type="button"
            className="register-info__icon-btn"
            onClick={() => setShowRepeatPassword((prev) => !prev)}
          >
            {showRepeatPassword ? <PiEyeSlashBold /> : <PiEyeBold />}
          </button>
          <input
            type={showRepeatPassword ? 'text' : 'password'}
            dir="ltr"
            value={repeatPassword}
            onChange={(e) => {
              setRepeatPassword(e.target.value);
              if (domError) setDomError('');
            }}
            className="register-info__input"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="register-info__rules">
        <p className={clsx(domError.trim() === "رمز عبور شامل حروف انگلیسی و عدد باشد" && "highlight")}>رمز عبور شامل حروف انگلیسی و عدد باشد</p>
        <p className={clsx(domError.trim() === "رمز عبور باید حداقل بیش از پنج کاراکتر باشد" && "highlight")}>رمز عبور باید حداقل بیش از پنج کاراکتر باشد</p>
        <p className={clsx(domError.trim() === "رمز عبور باید حداقل یک حرف بزرگ داشته باشد" && "highlight")}>رمز عبور باید حداقل یک حرف بزرگ داشته باشد</p>
      </div>

      {/* {domError && <p className="register-info__error" style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>{domError}</p>} */}

      <div className="register-info__captcha">
        <Turnstile
          ref={turnstileRef}
          action="signup"
          onToken={setTurnstileToken}
          onError={() => setTurnstileToken('')}
          onExpired={() => setTurnstileToken('')}
        />
      </div>

      <button
        type="submit"
        className="register-info__submit-btn"
        disabled={!isFormFilled || isLoading}
      >
        {isLoading ? <PiSpinnerGapBold className="icon-spin" /> : 'ساخت حساب'}
      </button>

      <p className="register-info__terms">
        ساخت حساب به منظور پذیرفتن{' '}
        <Link to="/terms" target="_blank" rel="noopener noreferrer">
          شرایط و قوانین
        </Link>{' '}
        هم‌نما می باشد
      </p>
    </form>
  );
};

export default RegisterInfo;
