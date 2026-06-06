import { useState } from 'react';
import './PhoneInput.scss';
import { Link } from 'react-router-dom';

const PhoneInput = ({ setPhoneNumber }: { setPhoneNumber: (num: string) => void }) => {
  const [number, setNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const iranianPhoneRegex = /^09\d{9}$/;

    if (!number.trim()) {
      setError('شماره موبایل خود را وارد کنید');
      return;
    }

    if (!iranianPhoneRegex.test(number)) {
      setError('شماره موبایل وارد شده معتبر نیست');
      return;
    }

    setError('');

    setPhoneNumber(number);
  };

  return (
    <div className='auth-phone-input'>
      <h1 className='auth-phone-input__title'>
        ورود یا ثبت نام در <Link to={`/`}>هم‌نما</Link>
      </h1>

      <h2 className='auth-phone-input__subtitle'>
        برای ورود یا ثبت نام در هم نما شماره همراه خود را وارد کنید.
      </h2>

      <input
        placeholder='۰۹XXXXXXXXX'
        type='text'
        className='auth-phone-input__input'
        value={number}
        onChange={(e) => {
          setNumber(e.target.value);

          // Clear error while typing
          if (error) setError('');
        }}
      />

      {error && (
        <p className='auth-phone-input__error'>
          {error}
        </p>
      )}

      <button
        className='auth-phone-input__subBtn'
        onClick={handleSubmit}
      >
        ادامه
      </button>
    </div>
  );
};

export default PhoneInput;