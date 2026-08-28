import { useEffect, useState } from 'react';
import { FiArchive, FiBell, FiCheckCircle, FiAlertCircle, FiPower, FiTrash2, FiPlus } from 'react-icons/fi';
import { toast } from '../../../components/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AnnouncementType, type AdminAnnouncement } from '../../../apiCalls/adminApi';
import './Settings.scss';

const Settings = () => {
  const [archiveUrl, setArchiveUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [subtitleSyncJobId, setSubtitleSyncJobId] = useState<string | null>(null);
  const [isStartingSubtitleSync, setIsStartingSubtitleSync] = useState(false);
  const queryClient = useQueryClient();
  const [announcementMessages, setAnnouncementMessages] = useState<Record<AnnouncementType, string>>({
    room: '',
    website: '',
  });

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

  const roomAnnouncementsQuery = useQuery({
    queryKey: ['adminAnnouncements', 'room'],
    queryFn: () => adminApi.listAnnouncements('room'),
  });

  const websiteAnnouncementsQuery = useQuery({
    queryKey: ['adminAnnouncements', 'website'],
    queryFn: () => adminApi.listAnnouncements('website'),
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async ({ type, message }: { type: AnnouncementType; message: string }) => {
      return adminApi.createAnnouncement(type, message.trim());
    },
    onSuccess: (_, variables) => {
      setAnnouncementMessages((previous) => ({ ...previous, [variables.type]: '' }));
      void queryClient.invalidateQueries({ queryKey: ['adminAnnouncements', variables.type] });
      toast.success('اعلان با موفقیت ایجاد شد');
    },
    onError: () => {
      toast.error('ایجاد اعلان با مشکل مواجه شد');
    },
  });

  const toggleAnnouncementMutation = useMutation({
    mutationFn: ({ announcement, active }: { announcement: AdminAnnouncement; active: boolean }) =>
      adminApi.setAnnouncementActive(announcement.id, active),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['adminAnnouncements', variables.announcement.type] });
      toast.success(variables.active ? 'اعلان فعال شد' : 'اعلان غیرفعال شد');
    },
    onError: () => {
      toast.error('تغییر وضعیت اعلان با مشکل مواجه شد');
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (announcement: AdminAnnouncement) => adminApi.deleteAnnouncement(announcement.id),
    onSuccess: (_, announcement) => {
      void queryClient.invalidateQueries({ queryKey: ['adminAnnouncements', announcement.type] });
      toast.success('اعلان حذف شد');
    },
    onError: () => {
      toast.error('حذف اعلان با مشکل مواجه شد');
    },
  });

  const handleCreateAnnouncement = (type: AnnouncementType, event: React.FormEvent) => {
    event.preventDefault();
    const message = announcementMessages[type].trim();
    if (!message || createAnnouncementMutation.isPending) return;
    createAnnouncementMutation.mutate({ type, message });
  };

  const handleAnnouncementMessageChange = (type: AnnouncementType, message: string) => {
    setAnnouncementMessages((previous) => ({ ...previous, [type]: message }));
  };

  const renderAnnouncements = (
    announcements: AdminAnnouncement[],
    isLoading: boolean,
    isError: boolean,
  ) => (
    <div className="admin-settings__announcement-list">
      {isLoading ? (
        <div className="admin-settings__message">در حال بارگذاری اعلان‌ها...</div>
      ) : isError ? (
        <div className="admin-settings__message">خطا در دریافت اعلان‌ها.</div>
      ) : announcements.length === 0 ? (
        <div className="admin-settings__message">هنوز اعلانی برای این بخش ثبت نشده است.</div>
      ) : (
        announcements.map((announcement) => (
          <article key={announcement.id} className={`admin-settings__announcement ${announcement.active ? 'is-active' : 'is-inactive'}`}>
            <div className="admin-settings__announcement__content">
              <div className="admin-settings__announcement__top">
                <span className={`admin-settings__announcement__status ${announcement.active ? 'is-active' : ''}`}>
                  <span />
                  {announcement.active ? 'فعال' : 'غیرفعال'}
                </span>
                <span className="admin-settings__announcement__date">
                  {formatDate(announcement.updated_at)}
                </span>
              </div>
              <p>{announcement.message}</p>
            </div>
            <div className="admin-settings__announcement__actions">
              <button
                type="button"
                onClick={() => toggleAnnouncementMutation.mutate({
                  announcement,
                  active: !announcement.active,
                })}
                disabled={toggleAnnouncementMutation.isPending}
                title={announcement.active ? 'غیرفعال کردن' : 'فعال کردن'}
              >
                <FiPower aria-hidden />
                {announcement.active ? 'غیرفعال' : 'فعال'}
              </button>
              <button
                type="button"
                className="is-danger"
                onClick={() => {
                  if (window.confirm('این اعلان حذف شود؟')) {
                    deleteAnnouncementMutation.mutate(announcement);
                  }
                }}
                disabled={deleteAnnouncementMutation.isPending}
                title="حذف اعلان"
              >
                <FiTrash2 aria-hidden />
                حذف
              </button>
            </div>
          </article>
        ))
      )}
    </div>
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('fa-IR');
  };

  const subtitleStatusQuery = useQuery({
    queryKey: ['subtitleSyncJob', subtitleSyncJobId],
    queryFn: () => adminApi.getSubtitleSyncStatus(subtitleSyncJobId!),
    enabled: !!subtitleSyncJobId,
    refetchInterval: (query) => query.state.data?.data.status === 'running' ? 2000 : false,
  });

  useEffect(() => {
    if (subtitleStatusQuery.data?.data.status === 'completed') {
      toast.success('پردازش زیرنویس‌ها با موفقیت تمام شد');
    }
  }, [subtitleStatusQuery.data?.data.status]);

  const handleSubtitleSync = async () => {
    if (isStartingSubtitleSync) return;
    setIsStartingSubtitleSync(true);
    try {
      const response = await adminApi.triggerSubtitleSync();
      setSubtitleSyncJobId(response.data.job_id);
      toast.success('پردازش زیرنویس کل آرشیو آغاز شد');
    } catch {
      toast.error('آغاز پردازش زیرنویس‌ها با مشکل مواجه شد');
    } finally {
      setIsStartingSubtitleSync(false);
    }
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

      <div className="admin-settings__card">
        <div className="admin-settings__card__head">
          <div>
            <p className="admin-settings__card__title">
              <FiBell aria-hidden className="admin-settings__card__title-icon" />
              اعلان‌های اتاق
            </p>
            <span className="admin-settings__card__subtitle">
              پیام‌های مهمی که هنگام ورود و داخل چت همه اتاق‌های فعال نمایش داده می‌شوند.
            </span>
          </div>
        </div>

        <form className="admin-settings__announcement-form" onSubmit={(event) => handleCreateAnnouncement('room', event)}>
          <textarea
            value={announcementMessages.room}
            onChange={(event) => handleAnnouncementMessageChange('room', event.target.value)}
            maxLength={2000}
            placeholder="مثلاً: امشب ساعت ۲۲ بخش جدیدی از سرور منتشر می‌شود."
            rows={3}
          />
          <div className="admin-settings__announcement-form__footer">
            <span>{announcementMessages.room.length}/2000</span>
            <button type="submit" className="admin-settings__submit" disabled={!announcementMessages.room.trim() || createAnnouncementMutation.isPending}>
              <FiPlus aria-hidden />
              {createAnnouncementMutation.isPending ? 'در حال ثبت…' : 'افزودن اعلان'}
            </button>
          </div>
        </form>

        {renderAnnouncements(
          roomAnnouncementsQuery.data?.data.announcements ?? [],
          roomAnnouncementsQuery.isLoading,
          roomAnnouncementsQuery.isError,
        )}
      </div>

      <div className="admin-settings__card">
        <div className="admin-settings__card__head">
          <div>
            <p className="admin-settings__card__title">
              <FiBell aria-hidden className="admin-settings__card__title-icon" />
              اعلان‌های وبسایت
            </p>
            <span className="admin-settings__card__subtitle">
              پیام‌هایی که هنگام ورود اولیه به وبسایت برای همه بازدیدکنندگان در دسترس خواهند بود.
            </span>
          </div>
        </div>

        <form className="admin-settings__announcement-form" onSubmit={(event) => handleCreateAnnouncement('website', event)}>
          <textarea
            value={announcementMessages.website}
            onChange={(event) => handleAnnouncementMessageChange('website', event.target.value)}
            maxLength={2000}
            placeholder="مثلاً: سرویس امشب از ساعت ۱ بامداد برای نگهداری موقتاً در دسترس نیست."
            rows={3}
          />
          <div className="admin-settings__announcement-form__footer">
            <span>{announcementMessages.website.length}/2000</span>
            <button type="submit" className="admin-settings__submit" disabled={!announcementMessages.website.trim() || createAnnouncementMutation.isPending}>
              <FiPlus aria-hidden />
              {createAnnouncementMutation.isPending ? 'در حال ثبت…' : 'افزودن اعلان'}
            </button>
          </div>
        </form>

        {renderAnnouncements(
          websiteAnnouncementsQuery.data?.data.announcements ?? [],
          websiteAnnouncementsQuery.isLoading,
          websiteAnnouncementsQuery.isError,
        )}
      </div>

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

      <div className="admin-settings__card">
        <div className="admin-settings__card__head">
          <div>
            <p className="admin-settings__card__title"><FiArchive aria-hidden className="admin-settings__card__title-icon" /> زیرنویس آرشیو</p>
            <span className="admin-settings__card__subtitle">فایل‌های SRT کل آرشیو را از SubTitleStar دریافت و به JSON آماده‌ی پخش تبدیل می‌کند.</span>
          </div>
        </div>

        <div className="admin-settings__subtitle-sync">
          <button type="button" className="admin-settings__submit" onClick={() => void handleSubtitleSync()} disabled={isStartingSubtitleSync || subtitleStatusQuery.data?.data.status === 'running'}>
            {isStartingSubtitleSync || subtitleStatusQuery.data?.data.status === 'running' ? 'در حال پردازش…' : 'دریافت زیرنویس کل آرشیو'}
          </button>
          {subtitleStatusQuery.data?.data ? (
            <div className="admin-settings__status">
              <FiCheckCircle aria-hidden />
              <p>
                {subtitleStatusQuery.data.data.status === 'completed'
                  ? 'پردازش کامل شد'
                  : subtitleStatusQuery.data.data.status === 'running'
                    ? `پردازش ${subtitleStatusQuery.data.data.processed.toLocaleString('fa-IR')} از ${subtitleStatusQuery.data.data.total.toLocaleString('fa-IR')}`
                    : `پردازش با خطا متوقف شد${subtitleStatusQuery.data.data.error ? `: ${subtitleStatusQuery.data.data.error}` : ''}`}
              </p>
            </div>
          ) : null}
        </div>
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