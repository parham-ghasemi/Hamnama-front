import { useState } from 'react';
import { FiArchive, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'sonner';
import { adminApi } from '../../../apiCalls/adminApi';
import './Settings.scss';

const Settings = () => {
  const [archiveUrl, setArchiveUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!archiveUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await adminApi.triggerArchiveScrape(archiveUrl.trim());
      setJobId(response.data.job_id);
      toast.success('عملیات آرشیو آغاز شد');
    } catch (error) {
      toast.error('آغاز عملیات آرشیو با مشکل مواجه شد');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="admin-settings">
      <div className="admin-settings__hero">
        <div>
          <p className="admin-settings__hero__eyebrow">تنظیمات</p>
          <h1 className="admin-settings__hero__title">مدیریت وبسایت</h1>
        </div>
        <div className="admin-settings__hero__pill">آرشیو و منابع</div>
      </div>

      <div className="admin-settings__section">
        <div className="admin-settings__section__header">
          <div>
            <p className="admin-settings__section__header__title">مدیریت آرشیو</p>
            <span className="admin-settings__section__header__subtitle">درخواست اجرای اسکرپینگ برای یک منبع جدید</span>
          </div>
        </div>

        <form className="admin-settings__section__form" onSubmit={handleSubmit}>
          <label>
            آدرس صفحه یا منبع
            <input value={archiveUrl} onChange={(event) => setArchiveUrl(event.target.value)} placeholder="https://example.com" />
          </label>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'در حال ارسال...' : 'شروع پردازش'}
          </button>
        </form>

        {jobId ? (
          <div className="admin-settings__section__status">
            <FiCheckCircle />
            <p>شناسه کار: {jobId}</p>
          </div>
        ) : null}
      </div>

      <div className="admin-settings__section">
        <div className="admin-settings__section__header">
          <div>
            <p className="admin-settings__section__header__title">بخش‌های آینده</p>
            <span className="admin-settings__section__header__subtitle">ساختار آماده برای افزودن تنظیمات بیشتر</span>
          </div>
          <div className="admin-settings__section__icon">
            <FiArchive />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Settings;
