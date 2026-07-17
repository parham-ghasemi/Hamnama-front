import { useState } from 'react';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../lib/axiosConfig'; // Adjust this import to where your axios config is saved

import PhoneInput from './phoneInput/PhoneInput';
import LoginPassword from './LoginPassword/LoginPassword';
import OtpInput from './otpInput/OtpInput';
import RegisterInfo from './registerInfo/RegisterInfo';

import './Auth.scss';
import { useAuth } from '../../context/AuthContext';

type AuthStep = 'phone' | 'password' | 'otp' | 'register';

const Auth = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>('phone');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  // Stores the temporary token returned by validate-otp for new users
  const [verificationToken, setVerificationToken] = useState('');
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);

  const { login } = useAuth(); // Destructure login

  // Helper to extract backend error messages and show toast
  const showErrorToast = (error: unknown, defaultMsg: string) => {
    if (error instanceof AxiosError && error.response?.data) {
      // Assuming your Go backend sends plain text errors
      toast.error(error.response.data);
    } else {
      toast.error(defaultMsg);
    }
  };

  const handlePhoneSubmit = async (phone: string) => {
    setPhoneNumber(phone);

    try {
      // 1. Check if user exists
      const { data } = await api.post('/auth/check-phone-number', { phone });
      setIsExistingUser(data.exists);

      if (data.exists) {
        setStep('password');
      } else {
        // 2. If new user, send OTP for signup right away
        await api.post('/auth/send-otp', { phone, purpose: 'signup' });
        toast.success('کد تایید ارسال شد');
        setStep('otp');
      }
    } catch (error) {
      showErrorToast(error, 'خطا در بررسی شماره موبایل');
    }
  };

  const handlePasswordSubmit = async (passwordValue: string) => {
    setPassword(passwordValue);

    try {
      const { data } = await api.post('/auth/login-password', {
        phone: phoneNumber,
        password: passwordValue,
      });

      // Save session token and redirect
      await login(data.token);

      toast.success('با موفقیت وارد شدید');
      navigate('/');
    } catch (error) {
      showErrorToast(error, 'رمز عبور اشتباه است');
    }
  };

  // Triggered when user is on Password step but chooses OTP login
  const handleGoToOtpLogin = async () => {
    try {
      await api.post('/auth/send-otp', {
        phone: phoneNumber,
        purpose: 'login',
      });
      toast.success('کد تایید ارسال شد');
      setStep('otp');
    } catch (error) {
      showErrorToast(error, 'خطا در ارسال رمز یکبار مصرف');
    }
  };

  const handleOtpSubmit = async (code: string) => {
    setOtp(code);

    try {
      if (isExistingUser) {
        // Login flow
        const { data } = await api.post('/auth/login-otp', {
          phone: phoneNumber,
          code,
        });

        await login(data.token);
        toast.success('با موفقیت وارد شدید');
        navigate('/');
      } else {
        // Signup flow: Validate OTP to get the temporary verification token
        const { data } = await api.post('/auth/validate-otp', {
          phone: phoneNumber,
          purpose: 'signup',
          code,
        });

        setVerificationToken(data.token);
        toast.success('شماره موبایل تایید شد');
        setStep('register');
      }
    } catch (error) {
      showErrorToast(error, 'کد وارد شده اشتباه است یا منقضی شده');
    }
  };

  const handleRegisterSubmit = async ({ username, password: registerPassword }: { username: string; password: string; }) => {
    try {
      const { data } = await api.post('/auth/signup', {
        username,
        password: registerPassword,
        token: verificationToken, // Temporary token from step 3
      });

      // Save final session token and redirect
      await login(data.token);
      toast.success('حساب کاربری با موفقیت ساخته شد');
      navigate('/');
    } catch (error) {
      showErrorToast(error, 'خطا در ساخت حساب کاربری');
    }
  };

  const handleResendOtp = async () => {
    try {
      const purpose = isExistingUser ? 'login' : 'signup';
      await api.post('/auth/send-otp', {
        phone: phoneNumber,
        purpose,
      });
      toast.success('کد تایید مجددا ارسال شد');
    } catch (error) {
      showErrorToast(error, 'خطا در ارسال مجدد کد');
    }
  };

  const handleChangePhone = () => {
    setPhoneNumber('');
    setPassword('');
    setOtp('');
    setVerificationToken('');
    setIsExistingUser(null);
    setStep('phone');
  };

  return (
    <div className="auth-container">
      {step === 'phone' && (
        <PhoneInput setPhoneNumber={handlePhoneSubmit} />
      )}

      {step === 'password' && (
        <LoginPassword
          setPassword={handlePasswordSubmit}
          goOtp={handleGoToOtpLogin}
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
        <RegisterInfo onSubmit={handleRegisterSubmit} />
      )}
    </div>
  );
};

export default Auth;