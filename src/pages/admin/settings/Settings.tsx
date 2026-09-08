import { useState } from 'react';
import { FiArchive, FiBell, FiTrash2, FiPlus, FiPower } from 'react-icons/fi';
import { toast } from '../../../components/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AnnouncementType, type AdminAnnouncement } from '../../../apiCalls/adminApi';
import './Settings.scss';
import Skeleton from "../../../components/skeleton/Skeleton";

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const Settings = () => {
  const queryClient = useQueryClient();
  const [announcementMessages, setAnnouncementMessages] = useState<Record<AnnouncementType, string>>({
    room: '',
    website: '',
  });

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
        Array.from({ length: 3 }).map((_, index) => (
          <article key={index} className="admin-settings__announcement" aria-hidden="true">
            <div className="admin-settings__announcement__content">
              <div className="admin-settings__announcement__top">
                <Skeleton variant="pill" width={62} height={24} />
                <Skeleton variant="text" width={82} height={12} />
              </div>
              <Skeleton variant="text" width="88%" height={16} />
              <Skeleton variant="text" width="66%" height={16} />
            </div>
          </article>
        ))
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

  return (
    <section className="admin-settings">
      <header className="admin-settings__header">
        <div>
          <p className="admin-settings__eyebrow">تنظیمات</p>
          <h1 className="admin-settings__title">مدیریت وبسایت</h1>
        </div>
        <span className="admin-settings__pill">اعلان‌ها</span>
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