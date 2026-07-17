import { useState } from 'react';
import { PiCameraLight } from 'react-icons/pi';
import { IoPencilSharp, IoClose } from 'react-icons/io5';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { useAuth } from '../../../context/AuthContext'; // Adjust path
import './UserInfo.scss';
import { userApi } from '../../../apiCalls/userApi';

// --- Sub-components for Modals --- //

const UpdateUsernameForm = ({ onClose }: { onClose: () => void }) => {
  const { user, fetchUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username === user?.username) return onClose();

    try {
      await userApi.updateUsername(username);
      await fetchUser();
      toast.success('نام کاربری با موفقیت بروزرسانی شد');
      onClose();
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        toast.error(error.response.data || 'خطا در تغییر نام کاربری');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="edit-modal__form">
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="نام کاربری جدید"
        required
      />
      <button type="submit">ثبت تغییرات</button>
    </form>
  );
};

const UpdatePasswordForm = ({ onClose }: { onClose: () => void }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userApi.updatePassword(currentPassword, newPassword);
      toast.success('رمز عبور با موفقیت تغییر کرد');
      onClose();
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        toast.error(error.response.data || 'خطا در تغییر رمز عبور');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="edit-modal__form">
      <input
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder="رمز عبور فعلی"
        required
      />
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="رمز عبور جدید"
        required
      />
      <button type="submit">تغییر رمز</button>
    </form>
  );
};

const UpdatePhoneForm = ({ onClose }: { onClose: () => void }) => {
  const { user, fetchUser } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone === user?.phoneNumber) {
      toast.error('لطفا یک شماره جدید وارد کنید');
      return;
    }

    try {
      await userApi.requestPhoneUpdate(phone);
      toast.success('کد تایید ارسال شد');
      setStep('verify');
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        toast.error(error.response.data || 'خطا در ارسال کد');
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userApi.confirmPhoneUpdate(phone, otp);
      await fetchUser();
      toast.success('شماره موبایل با موفقیت تغییر کرد');
      onClose();
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        toast.error(error.response.data || 'کد وارد شده اشتباه است');
      }
    }
  };

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerifyOtp} className="edit-modal__form">
        <p className="edit-modal__subtitle">کد ارسال شده به {phone} را وارد کنید</p>
        <input
          type="text"
          maxLength={4}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="کد ۴ رقمی"
          required
        />
        <button type="submit">تایید و تغییر شماره</button>
        <button type="button" className="secondary-btn" onClick={() => setStep('request')}>
          اصلاح شماره
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequestOtp} className="edit-modal__form">
      <input
        type="text"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="شماره موبایل جدید (مثلا ۰۹XXXXXXXXX)"
        required
      />
      <button type="submit">دریافت کد تایید</button>
    </form>
  );
};

// --- Main Component --- //

const UserInfo = () => {
  const { user } = useAuth();
  const [editingField, setEditingField] = useState<'username' | 'phone' | 'password' | null>(null);

  const sections = [
    { key: 'username', label: 'نام کاربری', value: user?.username },
    { key: 'phone', label: 'شماره موبایل', value: user?.phoneNumber },
    { key: 'password', label: 'رمز عبور', value: '•••••••••••••' },
  ];

  return (
    <div className="user-info">
      <div className="user-info__blob" />

      <div className="user-info__top-card">
        <div className="user-info__top-card__right">
          <div className="user-info__top-card__right__img">
            <img src="/rodeocover.png" alt="profile image" />
            <span>
              <PiCameraLight />
            </span>
          </div>
          <div className="user-info__top-card__right__subinfo">
            <p>وضعیت اشتراک</p>
            <span>اشتراک ندارید</span>
          </div>
        </div>

        <div className="user-info__top-card__left">
          <button>خرید اشتراک</button>
        </div>
      </div>

      <div className="user-info__info-card">
        {sections.map((item) => (
          <div className="user-info__info-card__section" key={item.key}>
            <div className="user-info__info-card__section__right">
              <p>{item.label}</p>
              <span>{item.value}</span>
            </div>

            <div className="user-info__info-card__section__left">
              <button onClick={() => setEditingField(item.key as any)}>
                <IoPencilSharp />
                ویرایش {item.label}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="user-info__chart-container">LINE CHART</div>

      {/* Modal Overlay */}
      {editingField && (
        <div className="edit-modal-overlay" onClick={() => setEditingField(null)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal__header">
              <h3>
                ویرایش{' '}
                {editingField === 'username'
                  ? 'نام کاربری'
                  : editingField === 'phone'
                    ? 'شماره موبایل'
                    : 'رمز عبور'}
              </h3>
              <button className="edit-modal__close" onClick={() => setEditingField(null)}>
                <IoClose />
              </button>
            </div>

            {editingField === 'username' && <UpdateUsernameForm onClose={() => setEditingField(null)} />}
            {editingField === 'password' && <UpdatePasswordForm onClose={() => setEditingField(null)} />}
            {editingField === 'phone' && <UpdatePhoneForm onClose={() => setEditingField(null)} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserInfo;