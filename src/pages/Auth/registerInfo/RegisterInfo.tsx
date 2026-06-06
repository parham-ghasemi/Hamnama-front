import { useState } from 'react';
import './RegisterInfo.scss';
import { Link } from 'react-router-dom';
import {
  PiEyeBold,
  PiEyeSlashBold,
  PiUserFill,
} from 'react-icons/pi';

interface RegisterInfoProps {
  onSubmit: (data: {
    username: string;
    password: string;
  }) => void;
}

const RegisterInfo = ({
  onSubmit,
}: RegisterInfoProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [showRepeatPassword, setShowRepeatPassword] =
    useState(false);

  const handleSubmit = () => {
    onSubmit({
      username,
      password,
    });
  };

  return (
    <div className="register-info">
      <div className="register-info__group">
        <h2 className="register-info__label">
          نام کاربری
        </h2>

        <div className="register-info__input-wrapper">
          <PiUserFill className="register-info__icon" />

          <input
            type="text"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            className="register-info__input"
          />
        </div>
      </div>

      <div className="register-info__group">
        <h2 className="register-info__label">
          رمز عبور
        </h2>

        <div className="register-info__input-wrapper">
          <button
            type="button"
            className="register-info__icon-btn"
            onClick={() =>
              setShowPassword((prev) => !prev)
            }
          >
            {showPassword ? (
              <PiEyeSlashBold />
            ) : (
              <PiEyeBold />
            )}
          </button>

          <input
            type={
              showPassword ? 'text' : 'password'
            }
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="register-info__input"
          />
        </div>
      </div>

      <div className="register-info__group">
        <h2 className="register-info__label">
          رمز عبور را تکرار کنید
        </h2>

        <div className="register-info__input-wrapper">
          <button
            type="button"
            className="register-info__icon-btn"
            onClick={() =>
              setShowRepeatPassword(
                (prev) => !prev
              )
            }
          >
            {showRepeatPassword ? (
              <PiEyeSlashBold />
            ) : (
              <PiEyeBold />
            )}
          </button>

          <input
            type={
              showRepeatPassword
                ? 'text'
                : 'password'
            }
            value={repeatPassword}
            onChange={(e) =>
              setRepeatPassword(
                e.target.value
              )
            }
            className="register-info__input"
          />
        </div>
      </div>

      <div className="register-info__rules">
        <p>
          رمز عبور شامل حروف انگلیسی و عدد باشد
        </p>

        <p>
          رمز عبور باید حداقل بیش از پنج کاراکتر
          باشد
        </p>

        <p>
          رمز عبور باید حداقل یک حرف بزرگ داشته
          باشد
        </p>
      </div>

      <button
        className="register-info__submit-btn"
        onClick={handleSubmit}
      >
        ساخت حساب
      </button>

      <p className="register-info__terms">
        ساخت حساب به منظور پذیرفتن{' '}
        <Link
          to="/terms"
          target="_blank"
          rel="noopener noreferrer"
        >
          شرایط و قوانین
        </Link>{' '}
        هم‌نما می باشد
      </p>
    </div>
  );
};

export default RegisterInfo;