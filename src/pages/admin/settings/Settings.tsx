import { useState } from 'react';
import { FiArchive, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { toast } from '../../../components/toast';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../apiCalls/adminApi';
import './Settings.scss';

const Settings = () => {
  const [archiveUrl, setArchiveUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  // --- NEW: React Query for fetching scrape jobs with polling ---
  const {
    data: scrapeJobsResponse,
    isLoading: isLoadingJobs,
    isError: isErrorJobs
  } = useQuery({
    queryKey: ['scrapeJobs'],
    queryFn: adminApi.getScrapeJobs,
    refetchInterval: 3000,
  });

  // Handle both { jobs: [...] } and flat array [...] just in case
  const responseData = scrapeJobsResponse?.data;
  const jobs = Array.isArray(responseData) ? responseData : (responseData?.jobs || []);
  console.log(jobs)

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('fa-IR');
  };

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

      {/* --- Existing Archive Trigger Card --- */}
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

      {/* --- Scrape Jobs List Card --- */}
      <div className="admin-settings__card">
        <div className="admin-settings__card__head">
          <div>
            <p className="admin-settings__card__title">لیست کارها</p>
            <span className="admin-settings__card__subtitle">
              وضعیت و تاریخچه پردازش‌های اخیر
            </span>
          </div>
        </div>

        {isLoadingJobs ? (
          <div className="admin-settings__message">در حال بارگذاری کارها...</div>
        ) : isErrorJobs ? (
          <div className="admin-settings__message">خطا در دریافت لیست کارها.</div>
        ) : jobs.length === 0 ? (
          <div className="admin-settings__message">هیچ کاری برای نمایش وجود ندارد.</div>
        ) : (
          <ul className="admin-settings__job-list">
            {jobs.map((job) => (
              <li key={job.job_id} className="admin-settings__job-item">
                <div className="admin-settings__job-header">
                  <span className="admin-settings__job-url" dir="ltr">
                    {job.url}
                  </span>
                  <span className={`admin-settings__job-status admin-settings__job-status--${job.status?.toLowerCase() || 'unknown'}`}>
                    {job.status === "completed" ? "پایان یافته" : job.status === "running" ? "در حال انجام" : "ارور"}
                  </span>
                </div>

                <div className="admin-settings__job-dates">
                  <span>ایجاد شده: {formatDate(job.created_at)}</span>
                  {job.finished_at && (
                    <span>پایان یافته: {formatDate(job.finished_at)}</span>
                  )}
                </div>

                {job.error && (
                  <div className="admin-settings__job-error">
                    <FiAlertCircle aria-hidden />
                    <span>{job.error}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* --- Existing Coming Soon Card --- */}
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