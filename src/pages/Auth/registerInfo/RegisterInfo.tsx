import { useState } from 'react';
import './RegisterInfo.scss';
import { Link } from 'react-router-dom';
import { PiEyeBold, PiEyeSlashBold, PiUserFill, PiSpinnerGapBold, PiIdentificationBadgeFill } from 'react-icons/pi';
import { toast } from 'sonner';
import clsx from 'clsx';

interface RegisterInfoProps {
  onSubmit: (data: { username: string; password: string }) => void;
  isLoading?: boolean;
}

const RegisterInfo = ({ onSubmit, isLoading = false }: RegisterInfoProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [domError, setDomError] = useState('');

  const validatePassword = (pw: string) => {
    if (pw.length < 5) return 'رمز عبور باید حداقل بیش از پنج کاراکتر باشد';
    if (!/[a-zA-Z]/.test(pw)) return 'رمز عبور شامل حروف انگلیسی و عدد باشد';
    if (!/[A-Z]/.test(pw)) return 'رمز عبور باید حداقل یک حرف بزرگ داشته باشد';
    if (!/\d/.test(pw)) return 'رمز عبور شامل حروف انگلیسی و عدد باشد';
    if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]+$/.test(pw)) return 'رمز عبور تنها می‌تواند شامل حروف، اعداد و سیمبل‌های مجاز باشد.';
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== repeatPassword) {
      // Using sonner for mismatched passwords
      toast.error('رمز عبور و تکرار آن مطابقت ندارند');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      // Using dom error for specific field validation rules
      setDomError(passwordError);
      return;
    }

    setDomError('');
    onSubmit({ username, password });
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
