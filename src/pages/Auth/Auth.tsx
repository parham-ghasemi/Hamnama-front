import { useState } from 'react';

import PhoneInput from './phoneInput/PhoneInput';
import LoginPassword from './LoginPassword/LoginPassword';
import OtpInput from './otpInput/OtpInput';
import RegisterInfo from './registerInfo/RegisterInfo';

import './Auth.scss';

type AuthStep =
  | 'phone'
  | 'password'
  | 'otp'
  | 'register';

const Auth = () => {
  const [step, setStep] = useState<AuthStep>('phone');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [isExistingUser, setIsExistingUser] =
    useState<boolean | null>(null);

  const handlePhoneSubmit = async (phone: string) => {
    setPhoneNumber(phone);

    /**
     * TODO:
     * const response = await api.checkPhone(phone);
     * const exists = response.exists;
     */

    const exists = true; // fake for now

    setIsExistingUser(exists);

    if (exists) {
      setStep('password');
    } else {
      setStep('otp');
    }
  };

  const handlePasswordSubmit = async (
    password: string
  ) => {
    setPassword(password);

    console.log('Login with password', {
      phoneNumber,
      password,
    });

    // await login(...)
  };

  const handleOtpSubmit = async (code: string) => {
    setOtp(code);

    console.log('Verify OTP', {
      phoneNumber,
      otp: code,
      isExistingUser,
    });

    /**
     * Existing user:
     * OTP logs them in.
     *
     * New user:
     * OTP takes them to registration.
     */

    if (isExistingUser) {
      // login success
      console.log('Logged in');
    } else {
      setStep('register');
    }
  };

  const handleRegisterSubmit = async ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) => {
    console.log('Create account', {
      phoneNumber,
      username,
      password,
    });

    // await register(...)
  };

  const handleResendOtp = async () => {
    console.log('Resending OTP');

    // await resendOtp(phoneNumber)
  };

  const handleChangePhone = () => {
    setPhoneNumber('');
    setPassword('');
    setOtp('');

    setIsExistingUser(null);

    setStep('phone');
  };

  return (
    <div className="auth-container">
      {step === 'phone' && (
        <PhoneInput
          setPhoneNumber={handlePhoneSubmit}
        />
      )}

      {step === 'password' && (
        <LoginPassword
          setPassword={handlePasswordSubmit}
          goOtp={() => setStep('otp')}
        />
      )}

      {step === 'otp' && (
        <OtpInput
          phoneNumber={phoneNumber}
          onSubmit={handleOtpSubmit}
          onChangePhone={handleChangePhone}
          resendOtp={handleResendOtp}
        />
      )}

      {step === 'register' && (
        <RegisterInfo
          onSubmit={handleRegisterSubmit}
        />
      )}
    </div>
  );
};

export default Auth;