import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '../../components/toast';
import { getApiErrorMessage } from '../../lib/apiError';
import api from '../../lib/axiosConfig'; // Adjust this import to where your axios config is saved

import PhoneInput from './phoneInput/PhoneInput';
import LoginPassword from './LoginPassword/LoginPassword';
import OtpInput from './otpInput/OtpInput';
import RegisterInfo from './registerInfo/RegisterInfo';
import CinemaAmbience from '../home/ambience/CinemaAmbience';

import './Auth.scss';
import { useAuth } from '../../context/AuthContext';

type AuthStep = 'phone' | 'password' | 'otp' | 'register';

const STEP_ORDER: AuthStep[] = ['phone', 'password', 'otp', 'register'];

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = (searchParams.get('invite') ?? '').trim();
  const redirectParam = (searchParams.get('redirect') ?? '').trim();
  const redirectPath = redirectParam.startsWith('/') ? redirectParam : '/';
  const [step, setStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Stores the temporary token returned by validate-otp for new users
  const [verificationToken, setVerificationToken] = useState('');
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);

  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);


  const showErrorToast = (error: unknown, defaultMsg: string) => {
    toast.error(getApiErrorMessage(error, defaultMsg));
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

  const handlePasswordSubmit = async (passwordValue: string, turnstileToken: string) => {
    try {
      const { data } = await api.post('/auth/login-password', {
        phone: phoneNumber,
        password: passwordValue,
        turnstile_token: turnstileToken,
      });

      // Save session token and redirect
      await login(data.access_token);

      toast.success('با موفقیت وارد شدید');
      navigate(redirectPath);
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

  const handleOtpSubmit = async (code: string, turnstileToken: string) => {

    try {
      if (isExistingUser) {
        // Login flow
        const { data } = await api.post('/auth/login-otp', {
          phone: phoneNumber,
          code,
          turnstile_token: turnstileToken,
        });

        await login(data.access_token);
        toast.success('با موفقیت وارد شدید');
        navigate(redirectPath);
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

  const handleRegisterSubmit = async ({
    username,
    password: registerPassword,
    turnstileToken,
  }: { username: string; password: string; turnstileToken: string }) => {
    try {
      const { data } = await api.post('/auth/signup', {
        username,
        password: registerPassword,
        token: verificationToken, // Temporary token from step 3
        invite_token: inviteToken || undefined,
        turnstile_token: turnstileToken,
      });

      // Save final session token and redirect
      await login(data.access_token);
      toast.success('حساب کاربری با موفقیت ساخته شد');
      navigate(redirectPath);
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
    setVerificationToken('');
    setIsExistingUser(null);
    setStep('phone');
  };

  const activeIndex = STEP_ORDER.indexOf(step);

  if (isAuthLoading || isAuthenticated) {
    return null;
  }

  return (
    <div className="auth-container">
      <CinemaAmbience />

      <div className="auth-container__panel">
        <div className="auth-container__sprockets" aria-hidden="true" />

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
            requireCaptcha={isExistingUser === true}
            onChangePhone={handleChangePhone}
            resendOtp={handleResendOtp}
          />
        )}

        {step === 'register' && (
          <RegisterInfo onSubmit={handleRegisterSubmit} />
        )}

        <div className="auth-container__steps" aria-hidden="true">
          {STEP_ORDER.map((s, i) => (
            <span key={s} className={i <= activeIndex ? 'is-active' : undefined} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Auth;
