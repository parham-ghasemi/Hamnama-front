import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEdit2,
  FiEyeOff,
  FiFilm,
  FiFlag,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
  FiZap,
} from 'react-icons/fi';
import { toast } from 'sonner';
import {
  adminApi,
  type AdminArchiveFileInput,
  type AdminArchiveItem,
  type AdminArchiveReport,
  type AdminArchiveReportGroup,
  getScrapeProgressUrl,
} from '../../../apiCalls/adminApi';
import './Archive.scss';

type Form = Omit<AdminArchiveItem, 'links' | 'related' | 'omdb' | 'files'> & {
  linksJson: string;
  relatedJson: string;
  omdbJson: string;
  files: AdminArchiveFileInput[];
};

const emptyFile = (): AdminArchiveFileInput => ({
  url: '', filename: '', season: null, episode: null, quality_tags: '', version: '',
  release: '', size: '', status: 0, content_type: '', valid: false, final_url: '', error: '',
});

const emptyForm = (): Form => ({
  id: '', type: 'movie', title_en: '', title_fa: '', year: '', rating: '', votes: '', enabled: true,
  rated: '', released: '', runtime: '', genre: '', director: '', writer: '', actors: '', plot: '',
  language: '', country: '', awards: '', poster: '', metascore: '', box_office: '', imdb_rating: '',
  imdb_votes: '', linksJson: '{}', relatedJson: '[]', omdbJson: '', files: [],
});

const jsonText = (value: unknown, fallback: unknown) =>
  value == null ? JSON.stringify(fallback, null, 2) : JSON.stringify(value, null, 2);

const toForm = (item: AdminArchiveItem): Form => ({
  ...emptyForm(),
  ...item,
  linksJson: jsonText(item.links, {}),
  relatedJson: jsonText(item.related, []),
  omdbJson: item.omdb ? jsonText(item.omdb, null) : '',
  files: item.files.map((file) => ({ ...file })),
});

const parse = (text: string, fallback: unknown) => (text.trim() ? JSON.parse(text) : fallback);

const metadataFields = [
  'title_en', 'title_fa', 'year', 'rating', 'votes', 'rated', 'released', 'runtime', 'genre',
  'director', 'writer', 'actors', 'language', 'country', 'awards', 'poster', 'metascore',
  'box_office', 'imdb_rating', 'imdb_votes',
] as const;

const fileFields = [
  'url', 'filename', 'quality_tags', 'version', 'release', 'size', 'content_type', 'final_url', 'error',
] as const;

interface ArchiveDropdownOption<T extends string> {
  value: T;
  label: string;
}

interface ArchiveDropdownProps<T extends string> {
  value: T;
  options: ArchiveDropdownOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}

function ArchiveDropdown<T extends string>({ value, options, onChange, ariaLabel, className = '' }: ArchiveDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div className={`admin-archive-dropdown ${open ? 'is-open' : ''} ${className}`} ref={rootRef}>
      <button
        type="button"
        className="admin-archive-dropdown__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.label ?? ''}</span>
        <FiChevronDown className="admin-archive-dropdown__chevron" aria-hidden="true" />
      </button>
      <div className="admin-archive-dropdown__menu" role="listbox" aria-label={ariaLabel}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={option.value === value}
            className={`admin-archive-dropdown__option ${option.value === value ? 'is-active' : ''}`}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
          >
            <span>{option.label}</span>
            {option.value === value && <FiCheckCircle aria-hidden="true" />}
          </button>
        ))}
      </div>
    </div>
  );
}

const archiveTypeOptions: ArchiveDropdownOption<string>[] = [
  { value: '', label: 'همه انواع' },
  { value: 'movie', label: 'فیلم' },
  { value: 'series', label: 'سریال' },
];

const formTypeOptions: ArchiveDropdownOption<'movie' | 'series'>[] = [
  { value: 'movie', label: 'فیلم' },
  { value: 'series', label: 'سریال' },
];

const jobLabel = (status: string) =>
  status === 'running' ? 'در حال اجرا' : status === 'completed' ? 'پایان یافته' : 'ناموفق';

const reportTypeLabel: Record<string, string> = {
  broken_file: 'فایل پخش نمی‌شود',
  invalid_subtitle: 'زیرنویس نامعتبر است',
  wrong_episode: 'قسمت اشتباه است',
  wrong_quality: 'کیفیت یا نسخه اشتباه است',
  missing_file: 'فایل ناقص یا گمشده است',
  wrong_metadata: 'اطلاعات عنوان اشتباه است',
  custom: 'گزارش سفارشی',
};

const Archive = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<Form | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [archiveUrl, setArchiveUrl] = useState('https://dls6.aparatchi-dlcenter.top/DonyayeSerial/10_thous.html');
  const [subtitleJobId, setSubtitleJobId] = useState<string | null>(null);
  const [reportGroupOpen, setReportGroupOpen] = useState<string | null>(null);
  const [showReports, setShowReports] = useState(false);
  const [showJobs, setShowJobs] = useState(false);
  const [showSubtitleReport, setShowSubtitleReport] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [subtitleInvalidPage, setSubtitleInvalidPage] = useState(1);
  const [activeScrapeJobId, setActiveScrapeJobId] = useState<string | null>(null);
  const scrapeStreamsRef = useRef<Map<string, EventSource>>(new Map());
  const scrapeStreamToastRef = useRef<Set<string>>(new Set());

  const params = useMemo(
    () => ({ search, type: type || undefined, page, limit: 12 }),
    [search, type, page],
  );

  const archive = useQuery({
    queryKey: ['admin-archive', params],
    queryFn: () => adminApi.listArchive(params).then((r) => r.data),
  });

  const scrapeJobs = useQuery({
    queryKey: ['admin-scrape-jobs'],
    queryFn: () => adminApi.getScrapeJobs().then((r) => (Array.isArray(r.data) ? { jobs: r.data } : r.data)),
    refetchInterval: (query) => (
      query.state.data?.jobs?.some((job) => job.status === 'running') ? 3000 : false
    ),
  });

  const scrapeJobList = scrapeJobs.data?.jobs ?? [];

  useEffect(() => {
    if (!activeScrapeJobId) {
      const runningJob = scrapeJobList.find((job) => job.status === 'running');
      if (runningJob) setActiveScrapeJobId(runningJob.job_id);
    }
  }, [activeScrapeJobId, scrapeJobList]);

  useEffect(() => {
    const runningIDs = new Set(
      scrapeJobList.filter((job) => job.status === 'running').map((job) => job.job_id),
    );

    for (const job of scrapeJobList) {
      if (job.status !== 'running' || scrapeStreamsRef.current.has(job.job_id)) continue;

      const source = new EventSource(getScrapeProgressUrl(job.job_id));
      scrapeStreamsRef.current.set(job.job_id, source);

      const finishJob = (status: 'completed' | 'error', error?: string) => {
        qc.setQueryData<{ jobs: typeof scrapeJobList }>(['admin-scrape-jobs'], (current) => {
          if (!current) return current;
          return {
            jobs: current.jobs.map((item) =>
              item.job_id === job.job_id
                ? {
                    ...item,
                    status,
                    error,
                    finished_at: new Date().toISOString(),
                  }
                : item,
            ),
          };
        });

        if (activeScrapeJobId === job.job_id) {
          setActiveScrapeJobId(null);
        }

        source.close();
        scrapeStreamsRef.current.delete(job.job_id);

        void qc.invalidateQueries({ queryKey: ['admin-archive'] });
        void qc.invalidateQueries({ queryKey: ['admin-scrape-jobs'] });

        const toastKey = `${job.job_id}:${status}`;
        if (scrapeStreamToastRef.current.has(toastKey)) return;
        scrapeStreamToastRef.current.add(toastKey);

        if (status === 'completed') {
          toast.success('اسکرپ آرشیو با موفقیت به پایان رسید');
        } else {
          toast.error(error ? `اسکرپ آرشیو ناموفق بود: ${error}` : 'اسکرپ آرشیو ناموفق بود');
        }
      };

      source.addEventListener('status', (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent<string>).data) as { done?: boolean };
          if (payload.done) finishJob('completed');
        } catch {
          // Ignore malformed status events; polling remains the fallback.
        }
      });

      source.addEventListener('complete', (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent<string>).data) as { done?: boolean };
          finishJob('completed', payload.done === false ? undefined : undefined);
        } catch {
          finishJob('completed');
        }
      });

      source.addEventListener('failed', (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent<string>).data) as {
            done?: boolean;
            error?: string;
          };
          finishJob('error', payload.error);
        } catch {
          finishJob('error');
        }
      });

      source.onerror = () => {
        // EventSource automatically reconnects. React Query polling is also
        // active while any job is running, so a broken stream cannot leave
        // the admin page permanently stuck on "running".
      };
    }

    for (const [jobID, source] of scrapeStreamsRef.current) {
      if (!runningIDs.has(jobID)) {
        source.close();
        scrapeStreamsRef.current.delete(jobID);
      }
    }
  }, [activeScrapeJobId, qc, scrapeJobList]);

  useEffect(() => () => {
    for (const source of scrapeStreamsRef.current.values()) source.close();
    scrapeStreamsRef.current.clear();
  }, []);

  const subtitleStatus = useQuery({
    queryKey: ['admin-subtitle-sync', subtitleJobId],
    queryFn: () => adminApi.getSubtitleSyncStatus(subtitleJobId as string).then((r) => r.data),
    enabled: Boolean(subtitleJobId),
    refetchInterval: (query) => (query.state.data?.status === 'running' ? 1500 : false),
  });

  const subtitleReport = useQuery({
    queryKey: ['admin-subtitle-health'],
    queryFn: () => adminApi.getSubtitleHealthReport().then((r) => r.data),
    enabled: showSubtitleReport,
  });

  const reportGroups = useQuery({
    queryKey: ['admin-archive-report-groups'],
    queryFn: () => adminApi.getArchiveReportGroups().then((r) => r.data.items),
    enabled: showReports,
  });

  const reports = useQuery({
    queryKey: ['admin-archive-reports', reportGroupOpen],
    queryFn: () => adminApi.getArchiveReports(reportGroupOpen as string).then((r) => r.data.reports),
    enabled: Boolean(reportGroupOpen),
  });

  const invalidSubtitleItems = useQuery({
    queryKey: ['admin-invalid-subtitles', subtitleInvalidPage],
    queryFn: () => adminApi.getInvalidSubtitleItems({ page: subtitleInvalidPage, limit: 20 }).then((r) => r.data),
    enabled: showSubtitleReport,
  });

  const save = useMutation({
    mutationFn: (value: Form) => {
      const payload: Record<string, unknown> = {
        ...Object.fromEntries(metadataFields.map((key) => [key, value[key] ?? ''])),
        id: value.id.trim(),
        type: value.type,
        plot: value.plot ?? '',
        links: parse(value.linksJson, {}),
        related: parse(value.relatedJson, []),
        omdb: parse(value.omdbJson, null),
        files: value.files.filter((file) => file.url.trim()),
      };
      return editingId
        ? adminApi.updateArchiveItem(editingId, payload)
        : adminApi.createArchiveItem(payload);
    },
    onSuccess: () => {
      toast.success('آیتم آرشیو با موفقیت ذخیره شد');
      setForm(null);
      setEditingId(null);
      setError('');
      void qc.invalidateQueries({ queryKey: ['admin-archive'] });
    },
    onError: () => {
      setError('ذخیره‌سازی انجام نشد. اطلاعات و لینک‌ها را بررسی کنید.');
      toast.error('ذخیره‌سازی آیتم آرشیو با مشکل مواجه شد');
    },
  });

  const remove = useMutation({
    mutationFn: adminApi.deleteArchiveItem,
    onSuccess: () => {
      toast.success('آیتم حذف شد');
      void qc.invalidateQueries({ queryKey: ['admin-archive'] });
    },
    onError: () => toast.error('حذف آیتم با مشکل مواجه شد'),
  });

  const toggleEnabled = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => adminApi.setArchiveItemEnabled(id, enabled),
    onSuccess: (_, vars) => {
      toast.success(vars.enabled ? 'آیتم فعال شد' : 'آیتم غیرفعال شد');
      void qc.invalidateQueries({ queryKey: ['admin-archive'] });
    },
    onError: () => toast.error('تغییر وضعیت آیتم انجام نشد'),
  });

  const startScrape = async () => {
    if (!archiveUrl.trim()) return;
    try {
      const response = await adminApi.triggerArchiveScrape(archiveUrl.trim());
      const createdAt = new Date().toISOString();
      const newJob = {
        job_id: response.data.job_id,
        url: archiveUrl.trim(),
        status: 'running' as const,
        created_at: createdAt,
      };
      qc.setQueryData<{ jobs: typeof scrapeJobList }>(['admin-scrape-jobs'], (current) => ({
        jobs: [newJob, ...(current?.jobs ?? [])],
      }));
      setActiveScrapeJobId(response.data.job_id);
      toast.success('عملیات اسکرپ آغاز شد');
      setShowJobs(true);
      setArchiveUrl('');
    } catch {
      const status = (error as { response?: { status?: number } })?.response?.status;
      toast.error(
        status === 409
          ? 'یک عملیات اسکرپ دیگر در حال اجراست. ابتدا منتظر پایان آن بمانید.'
          : 'آغاز عملیات اسکرپ با مشکل مواجه شد',
      );
    }
  };

  const startSubtitles = async () => {
    if (subtitleStatus.data?.status === 'running') return;
    try {
      const response = await adminApi.triggerSubtitleSync();
      setSubtitleJobId(response.data.job_id);
      toast.success('پردازش زیرنویس‌ها آغاز شد');
    } catch {
      toast.error('آغاز پردازش زیرنویس‌ها با مشکل مواجه شد');
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    try {
      parse(form.linksJson, {});
      parse(form.relatedJson, []);
      parse(form.omdbJson, null);
    } catch {
      setError('JSON واردشده معتبر نیست.');
      return;
    }
    save.mutate(form);
  };

  const updateFile = (index: number, patch: Partial<AdminArchiveFileInput>) =>
    setForm((current) =>
      current
        ? { ...current, files: current.files.map((file, i) => (i === index ? { ...file, ...patch } : file)) }
        : current,
    );

  const closeReports = () => {
    setShowReports(false);
    setReportGroupOpen(null);
  };

  const openNewItem = () => {
    setForm(emptyForm());
    setEditingId(null);
    setError('');
    setShowAdvanced(false);
  };

  return (
    <section className="admin-archive" dir="rtl">
      <header className="admin-archive__header">
        <div className="admin-archive__title-block">
          <div className="admin-archive__eyebrow-row">
            <span className="admin-archive__eyebrow">آرشیو</span>
            <span className="admin-archive__header-dot" />
            <span className="admin-archive__header-note">مدیریت محتوا و سلامت داده</span>
          </div>
          <h1 className="admin-archive__title">مرکز مدیریت آرشیو</h1>
          <p className="admin-archive__subtitle">
            اسکرپ، زیرنویس، وضعیت انتشار و گزارش‌های کاربران را از یکجا کنترل کنید.
          </p>
        </div>
        <button className="admin-archive__primary" onClick={openNewItem}>
          <FiPlus />
          افزودن آیتم
        </button>
      </header>

      <div className="admin-archive__overview-grid">
        <article className="admin-archive__operation admin-archive__operation--featured">
          <div className="admin-archive__operation-accent" />
          <div className="admin-archive__operation-head">
            <div className="admin-archive__operation-icon"><FiZap /></div>
            <div>
              <span className="admin-archive__operation-kicker">منبع محتوا</span>
              <h2>اسکرپ آرشیو</h2>
            </div>
          </div>
          <p>آخرین اسنپ‌شات منبع را دریافت کن و وضعیت اجرای آن را در تاریخچه ببین.</p>
          <div className="admin-archive__operation-form">
            <input value={archiveUrl} onChange={(event) => setArchiveUrl(event.target.value)} placeholder="https://example.com" dir="ltr" />
            <button type="button" onClick={() => void startScrape()} disabled={!archiveUrl.trim() || scrapeJobList.some((job) => job.status === 'running')}>شروع اسکرپ</button>
          </div>
          {(() => {
            const activeJob = (scrapeJobList ?? []).find((job) => job.job_id === activeScrapeJobId);
            if (!activeJob || activeJob.status !== 'running') return null;
            return (
              <div className="admin-archive__scrape-progress is-running">
                <div className="admin-archive__scrape-progress-head">
                  <div>
                    <span>وضعیت زنده</span>
                    <strong>اسکرپ در حال اجراست…</strong>
                  </div>
                  <span className="admin-archive__live-dot">فعال</span>
                </div>
                <div className="admin-archive__scrape-status-row">
                  <FiClock aria-hidden />
                  <span>پایان عملیات از طریق وضعیت سرور پیگیری می‌شود.</span>
                </div>
              </div>
            );
          })()}
        </article>

        <article className="admin-archive__operation">
          <div className="admin-archive__operation-head">
            <div className="admin-archive__operation-icon admin-archive__operation-icon--green"><FiRefreshCw /></div>
            <div>
              <span className="admin-archive__operation-kicker">پردازش خودکار</span>
              <h2>زیرنویس‌ها</h2>
            </div>
            {subtitleStatus.data?.status === 'running' && <span className="admin-archive__live-dot">فعال</span>}
          </div>
          <p>زیرنویس‌های آرشیو را پردازش می‌کند تا برای پخش آماده باشند.</p>
          <div className="admin-archive__operation-foot">
            <button type="button" className="admin-archive__secondary-button" onClick={() => void startSubtitles()} disabled={subtitleStatus.data?.status === 'running'}>
              {subtitleStatus.data?.status === 'running' ? 'در حال پردازش…' : 'شروع پردازش زیرنویس'}
            </button>
            {subtitleStatus.data?.status === 'running' && (
              <span className="admin-archive__progress-copy">
                {subtitleStatus.data.processed.toLocaleString('fa-IR')} از {subtitleStatus.data.total.toLocaleString('fa-IR')}
              </span>
            )}
          </div>
        </article>

        <button
          type="button"
          className="admin-archive__health-card"
          onClick={() => { setSubtitleInvalidPage(1); setShowSubtitleReport(true); }}
        >
          <div className="admin-archive__health-top">
            <div className="admin-archive__operation-icon admin-archive__operation-icon--soft"><FiCheckCircle /></div>
            <span className="admin-archive__health-label">کیفیت آرشیو</span>
          </div>
          <strong>گزارش سلامت زیرنویس</strong>
          <span>درصد آیتم‌های دارای زیرنویس معتبر را ببینید.</span>
          <FiChevronLeft className="admin-archive__health-arrow" />
        </button>
      </div>

      <div className="admin-archive__stats">
        <div className="admin-archive__stat-card admin-archive__stat-card--primary">
          <span>کل آیتم‌ها</span>
          <strong>{archive.data?.total?.toLocaleString('fa-IR') ?? '—'}</strong>
          <FiFilm />
        </div>
        <div className="admin-archive__stat-card">
          <span>در حال اجرا</span>
          <strong>{scrapeJobList.filter((job) => job.status === 'running').length.toLocaleString('fa-IR')}</strong>
          <FiClock />
        </div>
        <button type="button" className="admin-archive__utility-card" onClick={() => setShowJobs((value) => !value)}>
          <div><span>تاریخچه عملیات</span><strong>{scrapeJobList.length.toLocaleString('fa-IR')}</strong></div>
          <FiClock />
        </button>
        <button type="button" className="admin-archive__utility-card" onClick={() => { setReportGroupOpen(null); setShowReports(true); }}>
          <div><span>گزارش‌های کاربران</span><strong>{reportGroups.data?.length?.toLocaleString('fa-IR') ?? '۰'}</strong></div>
          <FiFlag />
        </button>
      </div>

      {showJobs && (
        <div className="admin-archive__jobs-panel">
          <div className="admin-archive__panel-head">
            <div>
              <span>عملیات</span>
              <strong>تاریخچه عملیات اسکرپ</strong>
              <p>همه اجراهای قبلی و وضعیت اجرای فعلی</p>
            </div>
            <button type="button" onClick={() => setShowJobs(false)} aria-label="بستن"><FiX /></button>
          </div>
          <div className="admin-archive__jobs-list">
            {scrapeJobList.length ? scrapeJobList.map((job) => (
              <div className="admin-archive__job-row" key={job.job_id}>
                <div className="admin-archive__job-main">
                  <b className={`is-${job.status}`}>{jobLabel(job.status)}</b>
                  <span dir="ltr">{job.url}</span>
                </div>
                <div className="admin-archive__job-meta">
                  <time>{new Date(job.created_at).toLocaleString('fa-IR')}</time>
                  {job.finished_at && <time>پایان: {new Date(job.finished_at).toLocaleString('fa-IR')}</time>}
                  {job.error && <small>{job.error}</small>}
                </div>
              </div>
            )) : <p className="admin-archive__empty-inline">هنوز عملیاتی ثبت نشده است.</p>}
          </div>
        </div>
      )}

      <div className="admin-archive__section-heading">
        <div>
          <span>کتابخانه</span>
          <h2>آیتم‌های آرشیو</h2>
        </div>
        <p>{archive.data?.total?.toLocaleString('fa-IR') ?? '۰'} عنوان</p>
      </div>

      <div className="admin-archive__toolbar">
        <label className="admin-archive__search">
          <FiSearch />
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="جستجو در عنوان، IMDb یا شناسه…"
          />
        </label>
        <div className="admin-archive__select-wrap">
          <span>نوع محتوا</span>
          <ArchiveDropdown
            value={type}
            options={archiveTypeOptions}
            onChange={(value) => { setType(value); setPage(1); }}
            ariaLabel="نوع محتوا"
          />
        </div>
      </div>

      <div className="admin-archive__table-card">
        {archive.isLoading ? (
          <div className="admin-archive__message"><FiRefreshCw /> در حال بارگذاری آرشیو…</div>
        ) : archive.isError ? (
          <div className="admin-archive__message admin-archive__message--error"><FiAlertCircle /> دریافت آرشیو ناموفق بود.</div>
        ) : (
          <>
            <div className="admin-archive__table-scroll">
              <table className="admin-archive__table">
                <thead>
                  <tr>
                    <th>آیتم</th>
                    <th>وضعیت</th>
                    <th>نوع</th>
                    <th>سال</th>
                    <th>امتیاز</th>
                    <th>فایل</th>
                    <th>گزارش</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {archive.data?.data.length ? archive.data.data.map((item) => (
                    <tr key={item.id} className={!item.enabled ? 'is-disabled' : undefined}>
                      <td>
                        <div className="admin-archive__item">
                          <div className="admin-archive__poster">
                            {item.poster ? <img src={item.poster} alt="" /> : <FiFilm />}
                          </div>
                          <div className="admin-archive__item-copy">
                            <strong>{item.title_en || item.title_fa || item.id}</strong>
                            <span>{item.title_fa && item.title_en ? item.title_fa : item.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={item.enabled ? 'admin-archive__status admin-archive__status--on' : 'admin-archive__status admin-archive__status--off'}
                          onClick={() => toggleEnabled.mutate({ id: item.id, enabled: !item.enabled })}
                          disabled={toggleEnabled.isPending}
                        >
                          {item.enabled ? <><FiCheckCircle /> فعال</> : <><FiEyeOff /> غیرفعال</>}
                        </button>
                      </td>
                      <td><span className="admin-archive__type-pill">{item.type === 'series' ? 'سریال' : 'فیلم'}</span></td>
                      <td>{item.year || '—'}</td>
                      <td><span className="admin-archive__rating">{item.rating || '—'}</span></td>
                      <td><span className="admin-archive__file-count">{item.files.length.toLocaleString('fa-IR')}</span></td>
                      <td>
                        <button
                          type="button"
                          className="admin-archive__table-action admin-archive__table-action--report"
                          onClick={() => { setShowSubtitleReport(false); setShowReports(true); setReportGroupOpen(item.id); }}
                        >
                          <FiFlag />
                          گزارش‌ها
                        </button>
                      </td>
                      <td>
                        <div className="admin-archive__actions">
                          <button type="button" onClick={() => { setForm(toForm(item)); setEditingId(item.id); setError(''); setShowAdvanced(false); }}>
                            <FiEdit2 />
                            ویرایش
                          </button>
                          <button
                            type="button"
                            className="danger"
                            disabled={remove.isPending}
                            onClick={() => window.confirm(`آیا «${item.title_en || item.id}» حذف شود؟`) && remove.mutate(item.id)}
                          >
                            <FiTrash2 />
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={8}><div className="admin-archive__empty-table"><FiFilm /> آیتمی با این فیلتر پیدا نشد.</div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="admin-archive__pagination">
              <span>{archive.data?.total?.toLocaleString('fa-IR') ?? '۰'} آیتم</span>
              <div>
                <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><FiChevronRight /></button>
                <strong>صفحه {page.toLocaleString('fa-IR')} از {(archive.data?.totalPages ?? 1).toLocaleString('fa-IR')}</strong>
                <button type="button" disabled={page >= (archive.data?.totalPages ?? 1)} onClick={() => setPage((value) => value + 1)}><FiChevronLeft /></button>
              </div>
            </div>
          </>
        )}
      </div>

      {form && (
        <div className="admin-archive__overlay" onMouseDown={(event) => event.currentTarget === event.target && setForm(null)}>
          <form className="admin-archive__modal admin-archive__modal--editor" onSubmit={submit}>
            <header className="admin-archive__modal-head">
              <div>
                <span>{editingId ? 'ویرایش آیتم' : 'آیتم جدید'}</span>
                <h2>{form.title_en || 'آرشیو جدید'}</h2>
                <p>اطلاعات پایه، متادیتا و فایل‌های دانلود را مدیریت کنید.</p>
              </div>
              <button type="button" onClick={() => setForm(null)} aria-label="بستن"><FiX /></button>
            </header>

            <div className="admin-archive__modal-body">
              {error && <div className="admin-archive__error"><FiAlertCircle />{error}</div>}

              <section className="admin-archive__form-section">
                <div className="admin-archive__form-section-head">
                  <div><span>هویت</span><h3>اطلاعات اصلی</h3></div>
                  <small>موارد ستاره‌دار برای شناسایی آیتم ضروری‌اند.</small>
                </div>
                <div className="admin-archive__form-top">
                  <label><span>شناسه</span><input value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} disabled={Boolean(editingId)} required dir="ltr" /></label>
                  <div className="admin-archive__dropdown-field">
                    <span>نوع</span>
                    <ArchiveDropdown
                      value={form.type}
                      options={formTypeOptions}
                      onChange={(value) => setForm({ ...form, type: value })}
                      ariaLabel="نوع"
                    />
                  </div>
                  <label className="admin-archive__toggle-field"><span>وضعیت انتشار</span><div className={form.enabled ? 'is-on' : 'is-off'}>{form.enabled ? <><FiCheckCircle /> فعال</> : <><FiEyeOff /> غیرفعال</>}<small>از جدول آرشیو تغییر دهید</small></div></label>
                </div>
                <div className="admin-archive__form-grid">
                  {metadataFields.map((key) => (
                    <label key={key}><span>{key}</span><input value={form[key] ?? ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} dir={key === 'title_fa' ? 'auto' : 'ltr'} /></label>
                  ))}
                  <label className="full"><span>plot</span><textarea value={form.plot ?? ''} onChange={(event) => setForm({ ...form, plot: event.target.value })} rows={4} /></label>
                </div>
              </section>

              <section className="admin-archive__form-section admin-archive__form-section--compact">
                <button type="button" className="admin-archive__advanced-toggle" onClick={() => setShowAdvanced((value) => !value)}>
                  <span><FiZap />تنظیمات پیشرفته JSON</span>
                  <FiChevronDown className={showAdvanced ? 'is-open' : ''} />
                </button>
                <div className={`admin-archive__advanced-wrap ${showAdvanced ? 'is-open' : ''}`}>
                  <div className="admin-archive__advanced">
                    <label><span>links JSON</span><textarea value={form.linksJson} onChange={(event) => setForm({ ...form, linksJson: event.target.value })} rows={5} dir="ltr" /></label>
                    <label><span>related JSON</span><textarea value={form.relatedJson} onChange={(event) => setForm({ ...form, relatedJson: event.target.value })} rows={4} dir="ltr" /></label>
                    <label><span>OMDb JSON</span><textarea value={form.omdbJson} onChange={(event) => setForm({ ...form, omdbJson: event.target.value })} rows={6} dir="ltr" /></label>
                  </div>
                </div>
              </section>

              <section className="admin-archive__form-section admin-archive__files">
                <div className="admin-archive__section-head">
                  <div><span>دانلود</span><h3>لینک‌های دانلود</h3><small>{form.files.length.toLocaleString('fa-IR')} فایل</small></div>
                  <button type="button" onClick={() => setForm({ ...form, files: [...form.files, emptyFile()] })}><FiPlus /> افزودن فایل</button>
                </div>
                <div className="admin-archive__file-list">
                  {form.files.length ? form.files.map((file, index) => (
                    <div className="admin-archive__file" key={`${index}-${file.filename}`}>
                      <div className="admin-archive__file-head">
                        <div><span>فایل {index + 1}</span><strong>{file.filename || 'فایل جدید'}</strong></div>
                        <button type="button" onClick={() => setForm({ ...form, files: form.files.filter((_, i) => i !== index) })} aria-label="حذف فایل"><FiTrash2 /></button>
                      </div>
                      {fileFields.map((key) => (
                        <label key={key}><span>{key}</span><input value={file[key] ?? ''} onChange={(event) => updateFile(index, { [key]: event.target.value })} dir="ltr" /></label>
                      ))}
                      <label><span>season</span><input type="number" value={file.season ?? ''} onChange={(event) => updateFile(index, { season: event.target.value === '' ? null : Number(event.target.value) })} /></label>
                      <label><span>episode</span><input type="number" value={file.episode ?? ''} onChange={(event) => updateFile(index, { episode: event.target.value === '' ? null : Number(event.target.value) })} /></label>
                      <label><span>status</span><input type="number" value={file.status} onChange={(event) => updateFile(index, { status: Number(event.target.value) || 0 })} /></label>
                      <label className="checkbox"><input type="checkbox" checked={file.valid} onChange={(event) => updateFile(index, { valid: event.target.checked })} /><span>لینک معتبر است</span></label>
                    </div>
                  )) : (
                    <div className="admin-archive__files-empty"><FiFilm /><span>هنوز فایل دانلودی اضافه نشده است.</span></div>
                  )}
                </div>
              </section>
            </div>

            <footer>
              <button type="button" onClick={() => setForm(null)}>انصراف</button>
              <button className="save" disabled={save.isPending}>{save.isPending ? 'در حال ذخیره…' : 'ذخیره تغییرات'}</button>
            </footer>
          </form>
        </div>
      )}

      {showSubtitleReport && (
        <div className="admin-archive__overlay" onMouseDown={(event) => event.currentTarget === event.target && setShowSubtitleReport(false)}>
          <div className="admin-archive__modal admin-archive__modal--report">
            <header className="admin-archive__modal-head">
              <div><span>گزارش سلامت زیرنویس</span><h2>وضعیت زیرنویس کل آرشیو</h2><p>کیفیت زیرنویس‌ها را قبل از انتشار بررسی کنید.</p></div>
              <button type="button" onClick={() => setShowSubtitleReport(false)} aria-label="بستن"><FiX /></button>
            </header>
            <div className="admin-archive__modal-body admin-archive__subtitle-report">
              {subtitleReport.isLoading ? <div className="admin-archive__message"><FiRefreshCw /> در حال محاسبه…</div> : subtitleReport.data ? (
                <>
                  <div className="admin-archive__subtitle-kpis">
                    <div><span>کل آیتم‌ها</span><strong>{subtitleReport.data.total_items.toLocaleString('fa-IR')}</strong></div>
                    <div className="is-good"><span>زیرنویس معتبر</span><strong>{subtitleReport.data.valid_items.toLocaleString('fa-IR')}</strong></div>
                    <div className="is-warning"><span>بدون زیرنویس معتبر</span><strong>{subtitleReport.data.invalid_items.toLocaleString('fa-IR')}</strong></div>
                  </div>
                  <div className="admin-archive__subtitle-progress">
                    <div><span>درصد آیتم‌های دارای زیرنویس معتبر</span><strong>{subtitleReport.data.valid_percentage.toFixed(1)}٪</strong></div>
                    <div className="admin-archive__progress-track"><span style={{ width: `${Math.max(0, Math.min(100, subtitleReport.data.valid_percentage))}%` }} /></div>
                  </div>
                  <div className="admin-archive__invalid-block">
                    <div className="admin-archive__section-head"><div><span>نیازمند رسیدگی</span><h3>آیتم‌های بدون زیرنویس معتبر</h3></div><small>{invalidSubtitleItems.data?.total?.toLocaleString('fa-IR') ?? '۰'} عنوان</small></div>
                    {invalidSubtitleItems.isLoading ? <div className="admin-archive__message"><FiRefreshCw /> در حال دریافت فهرست…</div> : invalidSubtitleItems.data?.data?.length ? (
                      <>
                        <div className="admin-archive__invalid-list">
                          {invalidSubtitleItems.data.data.map((item) => (
                            <div className="admin-archive__invalid-item" key={item.id}>
                              <div><strong>{item.title_en || item.title_fa || item.id}</strong><span>{item.title_fa && item.title_en ? item.title_fa : item.id}</span></div>
                              <em>{item.type === 'series' ? 'سریال' : 'فیلم'}</em>
                            </div>
                          ))}
                        </div>
                        <div className="admin-archive__invalid-pagination">
                          <button type="button" disabled={subtitleInvalidPage <= 1} onClick={() => setSubtitleInvalidPage((value) => value - 1)}><FiChevronRight /></button>
                          <span>صفحه {subtitleInvalidPage.toLocaleString('fa-IR')} از {(invalidSubtitleItems.data.totalPages || 1).toLocaleString('fa-IR')}</span>
                          <button type="button" disabled={subtitleInvalidPage >= (invalidSubtitleItems.data.totalPages || 1)} onClick={() => setSubtitleInvalidPage((value) => value + 1)}><FiChevronLeft /></button>
                        </div>
                      </>
                    ) : <div className="admin-archive__message"><FiCheckCircle /> همه آیتم‌ها زیرنویس معتبر دارند.</div>}
                  </div>
                </>
              ) : <div className="admin-archive__message admin-archive__message--error">گزارش در دسترس نیست.</div>}
            </div>
          </div>
        </div>
      )}

      {showReports && (
        <div className="admin-archive__overlay" onMouseDown={(event) => event.currentTarget === event.target && closeReports()}>
          <div className="admin-archive__modal admin-archive__modal--reports">
            <header className="admin-archive__modal-head">
              <div><span>مرکز گزارش‌ها</span><h2>عنوان‌های دارای گزارش</h2><p>هر عنوان را باز کنید تا جزئیات گزارش‌های کاربران را ببینید.</p></div>
              <button type="button" onClick={closeReports} aria-label="بستن"><FiX /></button>
            </header>
            <div className="admin-archive__reports-index">
              {reportGroups.isLoading ? <div className="admin-archive__message"><FiRefreshCw /> در حال دریافت گزارش‌ها…</div> : reportGroups.data?.length ? reportGroups.data.map((group: AdminArchiveReportGroup) => {
                const open = reportGroupOpen === group.media_id;
                return (
                  <article className={`admin-archive__report-group ${open ? 'is-open' : ''}`} key={group.media_id}>
                    <button
                      type="button"
                      className="admin-archive__report-group-trigger"
                      onClick={() => setReportGroupOpen(open ? null : group.media_id)}
                      aria-expanded={open}
                    >
                      <span className="admin-archive__report-group-poster">{group.poster ? <img src={group.poster} alt="" /> : <FiFilm />}</span>
                      <span className="admin-archive__report-group-title">
                        <strong>{group.title_en || group.title_fa || group.media_id}</strong>
                        <small>{group.title_fa && group.title_en ? group.title_fa : group.media_id}</small>
                      </span>
                      <span className="admin-archive__report-group-count">{group.report_count.toLocaleString('fa-IR')} گزارش</span>
                      <FiChevronDown className="admin-archive__report-group-chevron" />
                    </button>
                    <div className="admin-archive__report-group-collapse" aria-hidden={!open}>
                      <div className="admin-archive__report-group-body">
                        {open ? (
                          reports.isLoading ? <div className="admin-archive__message"><FiRefreshCw /> در حال دریافت جزئیات…</div> : reports.data?.length ? (
                            <div className="admin-archive__report-list">
                              {reports.data.map((report: AdminArchiveReport) => (
                                <article key={report.id} className="admin-archive__report">
                                  <div className="admin-archive__report-head">
                                    <div><strong>{reportTypeLabel[report.report_type] || report.report_type}</strong><span>{report.username || 'کاربر بدون نام'} · {report.phone || 'شماره ثبت نشده'}</span></div>
                                    <time>{new Date(report.created_at).toLocaleString('fa-IR')}</time>
                                  </div>
                                  <div className="admin-archive__report-target">{report.target_type === 'media' ? 'کل عنوان' : report.target_type === 'episode' ? `فصل ${report.season}، قسمت ${report.episode}` : `فایل: ${report.file_url}`}</div>
                                  {report.custom_text && <p>{report.custom_text}</p>}
                                </article>
                              ))}
                            </div>
                          ) : <div className="admin-archive__message"><FiFlag /> گزارشی برای این عنوان ثبت نشده است.</div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              }) : <div className="admin-archive__message"><FiFlag /> هنوز گزارشی ثبت نشده است.</div>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Archive;
