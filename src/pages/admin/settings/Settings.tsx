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
    } catch {
      toast.error('آغاز عملیات آرشیو با مشکل مواجه شد');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="admin-settings">
      <header className="admin-settings__header">
        <div>
          <p className="admin-settings__eyebrow">تنظیمات</p>
          <h1 className="admin-settings__title">مدیریت وبسایت</h1>
        </div>
        <span className="admin-settings__pill">آرشیو و منابع</span>
      </header>

      <div className="admin-settings__card">
        <div className="admin-settings__card__head">
          <div>
            <p className="admin-settings__card__title">مدیریت آرشیو</p>
            <span className="admin-settings__card__subtitle">
              درخواست اجرای اسکرپینگ برای یک منبع جدید
            </span>
          </div>
        </div>

        <form className="admin-settings__form" onSubmit={handleSubmit}>
          <label>
            <span>آدرس صفحه یا منبع</span>
            <input
              value={archiveUrl}
              onChange={(event) => setArchiveUrl(event.target.value)}
              placeholder="https://example.com"
              dir="ltr"
            />
          </label>
          <button
            type="submit"
            className="admin-settings__submit"
            disabled={isSubmitting || !archiveUrl.trim()}
          >
            {isSubmitting ? 'در حال ارسال…' : 'شروع پردازش'}
          </button>
        </form>

        {jobId ? (
          <div className="admin-settings__status">
            <FiCheckCircle aria-hidden />
            <p>
              شناسه کار: <code>{jobId}</code>
            </p>
          </div>
        ) : null}
      </div>

      <div className="admin-settings__card admin-settings__card--muted">
        <div className="admin-settings__card__head">
          <div>
            <p className="admin-settings__card__title">بخش‌های آینده</p>
            <span className="admin-settings__card__subtitle">
              ساختار آماده برای افزودن تنظیمات بیشتر
            </span>
          </div>
          <div className="admin-settings__card__icon">
            <FiArchive />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Settings;