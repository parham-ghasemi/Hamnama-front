import { useState } from 'react';
import './PhoneInput.scss';
import { Link } from 'react-router-dom';
import { PiSpinnerGapBold } from 'react-icons/pi';
import { toEnglishNumerals } from '../../../helpers/NumberConversion';

interface PhoneInputProps {
  setPhoneNumber: (num: string) => void;
  isLoading?: boolean;
}

const PhoneInput = ({ setPhoneNumber, isLoading = false }: PhoneInputProps) => {
  const [number, setNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!number.trim()) {
      setError('شماره موبایل خود را وارد کنید');
      return;
    }

    // 1. Convert any Persian/Arabic digits to English numerals
    let formattedNumber = toEnglishNumerals(number.trim());

    // 2. If the user entered 10 digits starting with '9', prepend the '0'
    if (formattedNumber.length === 10 && formattedNumber.startsWith('9')) {
      formattedNumber = '0' + formattedNumber;
    }

    // 3. Validate the final formatted string
    const iranianPhoneRegex = /^09\d{9}$/;
    if (!iranianPhoneRegex.test(formattedNumber)) {
      console.log(formattedNumber)
      setError('شماره موبایل وارد شده معتبر نیست');
      return;
    }

    setError('');

    // 4. Send the fully formatted, valid number (with the '0') to the parent
    setPhoneNumber(formattedNumber);
  };

  return (
    <form className='auth-phone-input' onSubmit={handleSubmit}>
      <h1 className='auth-phone-input__title'>
        ورود یا ثبت نام در <Link to={`/`}>هم‌نما</Link>
      </h1>

      <h2 className='auth-phone-input__subtitle'>
        برای ورود یا ثبت نام در هم نما شماره همراه خود را وارد کنید.
      </h2>

      <input
        placeholder='۰۹XXXXXXXXX'
        type='text'
        inputMode='numeric'
        dir='ltr'
        className='auth-phone-input__input'
        value={number}
        onChange={(e) => {
          setNumber(e.target.value);
          if (error) setError('');
        }}
        disabled={isLoading}
      />

      {error && (
        <p className='auth-phone-input__error'>
          {error}
        </p>
      )}

      <button
        type='submit'
        className='auth-phone-input__subBtn'
        disabled={!number.trim() || isLoading}
      >
        {isLoading ? <PiSpinnerGapBold className="icon-spin" /> : 'ادامه'}
      </button>
    </form>
  );
};

export default PhoneInput;