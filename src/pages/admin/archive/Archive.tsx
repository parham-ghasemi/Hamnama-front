import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FiAlertCircle,
  FiCheckCircle,
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

const jsonText = (value: unknown, fallback: unknown) => value == null ? JSON.stringify(fallback, null, 2) : JSON.stringify(value, null, 2);
const toForm = (item: AdminArchiveItem): Form => ({
  ...emptyForm(), ...item,
  linksJson: jsonText(item.links, {}), relatedJson: jsonText(item.related, []),
  omdbJson: item.omdb ? jsonText(item.omdb, null) : '', files: item.files.map((file) => ({ ...file })),
});
const parse = (text: string, fallback: unknown) => text.trim() ? JSON.parse(text) : fallback;
const metadataFields = ['title_en', 'title_fa', 'year', 'rating', 'votes', 'rated', 'released', 'runtime', 'genre', 'director', 'writer', 'actors', 'language', 'country', 'awards', 'poster', 'metascore', 'box_office', 'imdb_rating', 'imdb_votes'] as const;
const fileFields = ['url', 'filename', 'quality_tags', 'version', 'release', 'size', 'content_type', 'final_url', 'error'] as const;

const jobLabel = (status: string) => status === 'running' ? 'در حال اجرا' : status === 'completed' ? 'پایان یافته' : 'ناموفق';
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
  const [reportsItem, setReportsItem] = useState<AdminArchiveItem | null>(null);
  const [showJobs, setShowJobs] = useState(false);
  const [showSubtitleReport, setShowSubtitleReport] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const params = useMemo(() => ({ search, type: type || undefined, page, limit: 12 }), [search, type, page]);
  const archive = useQuery({ queryKey: ['admin-archive', params], queryFn: () => adminApi.listArchive(params).then((r) => r.data) });
  const scrapeJobs = useQuery({ queryKey: ['admin-scrape-jobs'], queryFn: () => adminApi.getScrapeJobs().then((r) => Array.isArray(r.data) ? { jobs: r.data } : r.data), refetchInterval: 5000 });
  const subtitleStatus = useQuery({
    queryKey: ['admin-subtitle-sync', subtitleJobId],
    queryFn: () => adminApi.getSubtitleSyncStatus(subtitleJobId as string).then((r) => r.data),
    enabled: Boolean(subtitleJobId),
    refetchInterval: (query) => query.state.data?.status === 'running' ? 1500 : false,
  });
  const subtitleReport = useQuery({ queryKey: ['admin-subtitle-health'], queryFn: () => adminApi.getSubtitleHealthReport().then((r) => r.data), enabled: showSubtitleReport });
  const reports = useQuery({ queryKey: ['admin-archive-reports', reportsItem?.id], queryFn: () => adminApi.getArchiveReports(reportsItem!.id).then((r) => r.data.reports), enabled: Boolean(reportsItem) });

  const save = useMutation({
    mutationFn: (value: Form) => {
      const payload: Record<string, unknown> = {
        ...Object.fromEntries(metadataFields.map((key) => [key, value[key] ?? ''])),
        id: value.id.trim(), type: value.type, plot: value.plot ?? '',
        links: parse(value.linksJson, {}), related: parse(value.relatedJson, []), omdb: parse(value.omdbJson, null),
        files: value.files.filter((file) => file.url.trim()),
      };
      return editingId ? adminApi.updateArchiveItem(editingId, payload) : adminApi.createArchiveItem(payload);
    },
    onSuccess: () => { toast.success('آیتم آرشیو با موفقیت ذخیره شد'); setForm(null); setEditingId(null); setError(''); void qc.invalidateQueries({ queryKey: ['admin-archive'] }); },
    onError: () => { setError('ذخیره‌سازی انجام نشد. اطلاعات و لینک‌ها را بررسی کنید.'); toast.error('ذخیره‌سازی آیتم آرشیو با مشکل مواجه شد'); },
  });
  const remove = useMutation({ mutationFn: adminApi.deleteArchiveItem, onSuccess: () => { toast.success('آیتم حذف شد'); void qc.invalidateQueries({ queryKey: ['admin-archive'] }); }, onError: () => toast.error('حذف آیتم با مشکل مواجه شد') });
  const toggleEnabled = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => adminApi.setArchiveItemEnabled(id, enabled),
    onSuccess: (_, vars) => { toast.success(vars.enabled ? 'آیتم فعال شد' : 'آیتم غیرفعال شد'); void qc.invalidateQueries({ queryKey: ['admin-archive'] }); },
    onError: () => toast.error('تغییر وضعیت آیتم انجام نشد'),
  });

  const startScrape = async () => {
    if (!archiveUrl.trim()) return;
    try { await adminApi.triggerArchiveScrape(archiveUrl.trim()); toast.success('عملیات اسکرپ آغاز شد'); setShowJobs(true); setArchiveUrl(''); void scrapeJobs.refetch(); }
    catch { toast.error('آغاز عملیات اسکرپ با مشکل مواجه شد'); }
  };
  const startSubtitles = async () => {
    if (subtitleStatus.data?.status === 'running') return;
    try { const response = await adminApi.triggerSubtitleSync(); setSubtitleJobId(response.data.job_id); toast.success('پردازش زیرنویس‌ها آغاز شد'); }
    catch { toast.error('آغاز پردازش زیرنویس‌ها با مشکل مواجه شد'); }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); if (!form) return;
    try { parse(form.linksJson, {}); parse(form.relatedJson, []); parse(form.omdbJson, null); }
    catch { setError('JSON واردشده معتبر نیست.'); return; }
    save.mutate(form);
  };
  const updateFile = (index: number, patch: Partial<AdminArchiveFileInput>) => setForm((current) => current ? { ...current, files: current.files.map((file, i) => i === index ? { ...file, ...patch } : file) } : current);

  return <section className="admin-archive" dir="rtl">
    <header className="admin-archive__header">
      <div><p className="admin-archive__eyebrow">آرشیو</p><h1 className="admin-archive__title">مرکز مدیریت آرشیو</h1><p className="admin-archive__subtitle">اسکرپ، زیرنویس، وضعیت انتشار و گزارش‌های کاربران را از یکجا کنترل کنید.</p></div>
      <button className="admin-archive__primary" onClick={() => { setForm(emptyForm()); setEditingId(null); setError(''); setShowAdvanced(false); }}><FiPlus /> افزودن آیتم</button>
    </header>

    <div className="admin-archive__ops">
      <div className="admin-archive__op-card admin-archive__op-card--accent">
        <div className="admin-archive__op-icon"><FiZap /></div><div className="admin-archive__op-content"><strong>اسکرپ آرشیو</strong><span>اسنپ‌شات جدید را از منبع دریافت می‌کند؛ وضعیت اجرای همه عملیات در تاریخچه ثبت می‌شود.</span></div>
        <div className="admin-archive__op-form"><input value={archiveUrl} onChange={(e) => setArchiveUrl(e.target.value)} placeholder="https://example.com" dir="ltr" /><button type="button" onClick={() => void startScrape()} disabled={!archiveUrl.trim()}>شروع اسکرپ</button></div>
      </div>
      <div className="admin-archive__op-card">
        <div className="admin-archive__op-icon"><FiRefreshCw /></div><div className="admin-archive__op-content"><strong>زیرنویس‌ها</strong><span>زیرنویس‌های آرشیو را دریافت و برای پخش آماده می‌کند.</span></div>
        <div className="admin-archive__op-form admin-archive__op-form--stack"><button type="button" onClick={() => void startSubtitles()} disabled={subtitleStatus.data?.status === 'running'}>{subtitleStatus.data?.status === 'running' ? 'در حال پردازش…' : 'شروع پردازش زیرنویس'}</button>{subtitleStatus.data?.status === 'running' && <small>{subtitleStatus.data.processed.toLocaleString('fa-IR')} از {subtitleStatus.data.total.toLocaleString('fa-IR')}</small>}</div>
      </div>
      <button type="button" className="admin-archive__report-card" onClick={() => setShowSubtitleReport(true)}><div className="admin-archive__report-card-icon"><FiCheckCircle /></div><div><strong>گزارش سلامت زیرنویس</strong><span>درصد آیتم‌های دارای زیرنویس معتبر را ببینید</span></div><FiChevronLeft /></button>
    </div>

    <div className="admin-archive__summary-row">
      <div className="admin-archive__summary"><FiFilm /><span>کل آیتم‌ها</span><strong>{archive.data?.total?.toLocaleString('fa-IR') ?? '—'}</strong></div>
      <div className="admin-archive__summary"><FiClock /><span>در حال اجرا</span><strong>{scrapeJobs.data?.jobs?.filter((job) => job.status === 'running').length.toLocaleString('fa-IR') ?? '۰'}</strong></div>
      <button type="button" className="admin-archive__jobs-toggle" onClick={() => setShowJobs((v) => !v)}><FiClock /> تاریخچه کامل عملیات <span>{scrapeJobs.data?.jobs?.length?.toLocaleString('fa-IR') ?? '۰'}</span></button>
    </div>

    {showJobs && <div className="admin-archive__jobs-panel"><div className="admin-archive__panel-head"><div><strong>تاریخچه عملیات اسکرپ</strong><span>همه اجراهای قبلی و وضعیت اجرای فعلی</span></div><button onClick={() => setShowJobs(false)}><FiX /></button></div><div className="admin-archive__jobs-list">{scrapeJobs.data?.jobs?.length ? scrapeJobs.data.jobs.map((job) => <div className="admin-archive__job-row" key={job.job_id}><div className="admin-archive__job-main"><b>{jobLabel(job.status)}</b><span dir="ltr">{job.url}</span></div><div className="admin-archive__job-meta"><time>{new Date(job.created_at).toLocaleString('fa-IR')}</time>{job.finished_at && <time>پایان: {new Date(job.finished_at).toLocaleString('fa-IR')}</time>}{job.error && <small>{job.error}</small>}</div></div>) : <p className="muted">هنوز عملیاتی ثبت نشده است.</p>}</div></div>}

    <div className="admin-archive__toolbar"><label className="admin-archive__search"><FiSearch /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="جستجو در عنوان، IMDb یا شناسه…" /></label><select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}><option value="">همه انواع</option><option value="movie">فیلم</option><option value="series">سریال</option></select></div>

    <div className="admin-archive__table-card">
      {archive.isLoading ? <div className="admin-archive__message">در حال بارگذاری آرشیو…</div> : archive.isError ? <div className="admin-archive__message admin-archive__message--error"><FiAlertCircle /> دریافت آرشیو ناموفق بود.</div> : <>
        <div className="admin-archive__table-scroll"><table className="admin-archive__table"><thead><tr><th>آیتم</th><th>وضعیت</th><th>نوع</th><th>سال</th><th>امتیاز</th><th>فایل</th><th>گزارش</th><th>عملیات</th></tr></thead><tbody>
          {archive.data?.data.map((item) => <tr key={item.id} className={!item.enabled ? 'is-disabled' : undefined}>
            <td><div className="admin-archive__item"><div className="admin-archive__poster">{item.poster ? <img src={item.poster} alt="" /> : <FiFilm />}</div><div><strong>{item.title_en || item.title_fa || item.id}</strong><span>{item.title_fa && item.title_en ? item.title_fa : item.id}</span></div></div></td>
            <td><button type="button" className={item.enabled ? 'admin-archive__status admin-archive__status--on' : 'admin-archive__status admin-archive__status--off'} onClick={() => toggleEnabled.mutate({ id: item.id, enabled: !item.enabled })} disabled={toggleEnabled.isPending}>{item.enabled ? <><FiCheckCircle /> فعال</> : <><FiEyeOff /> غیرفعال</>}</button></td>
            <td>{item.type === 'series' ? 'سریال' : 'فیلم'}</td><td>{item.year || '—'}</td><td>{item.rating || '—'}</td><td>{item.files.length.toLocaleString('fa-IR')}</td>
            <td><button className="admin-archive__icon-action admin-archive__icon-action--report" onClick={() => setReportsItem(item)}><FiFlag /><span>گزارش‌ها</span></button></td>
            <td><div className="admin-archive__actions"><button onClick={() => { setForm(toForm(item)); setEditingId(item.id); setError(''); setShowAdvanced(false); }}><FiEdit2 /> ویرایش</button><button className="danger" disabled={remove.isPending} onClick={() => window.confirm(`آیا «${item.title_en || item.id}» حذف شود؟`) && remove.mutate(item.id)}><FiTrash2 /> حذف</button></div></td>
          </tr>)}
        </tbody></table></div>
        <div className="admin-archive__pagination"><span>{archive.data?.total?.toLocaleString('fa-IR') ?? '۰'} آیتم</span><div><button disabled={page <= 1} onClick={() => setPage((v) => v - 1)}><FiChevronRight /></button><strong>صفحه {page.toLocaleString('fa-IR')} از {(archive.data?.totalPages ?? 1).toLocaleString('fa-IR')}</strong><button disabled={page >= (archive.data?.totalPages ?? 1)} onClick={() => setPage((v) => v + 1)}><FiChevronLeft /></button></div></div>
      </>}
    </div>

    {form && <div className="admin-archive__overlay" onMouseDown={(e) => e.currentTarget === e.target && setForm(null)}><form className="admin-archive__modal" onSubmit={submit}><header className="admin-archive__modal-head"><div><p>{editingId ? 'ویرایش آیتم' : 'آیتم جدید'}</p><h2>{form.title_en || 'آرشیو جدید'}</h2></div><button type="button" onClick={() => setForm(null)}><FiX /></button></header>
      <div className="admin-archive__modal-body">{error && <div className="admin-archive__error">{error}</div>}
        <div className="admin-archive__form-top"><label><span>شناسه</span><input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} disabled={Boolean(editingId)} required dir="ltr" /></label><label><span>نوع</span><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'movie' | 'series' })}><option value="movie">فیلم</option><option value="series">سریال</option></select></label><label className="admin-archive__toggle-field"><span>وضعیت انتشار</span><div className={form.enabled ? 'is-on' : 'is-off'}>{form.enabled ? <><FiCheckCircle /> فعال</> : <><FiEyeOff /> غیرفعال</>}<small>از جدول آرشیو تغییر دهید</small></div></label></div>
        <div className="admin-archive__form-grid">{metadataFields.map((key) => <label key={key}><span>{key}</span><input value={form[key] ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} dir={key === 'title_fa' ? 'auto' : 'ltr'} /></label>)}<label className="full"><span>plot</span><textarea value={form.plot ?? ''} onChange={(e) => setForm({ ...form, plot: e.target.value })} rows={4} /></label></div>
        <button type="button" className="admin-archive__advanced-toggle" onClick={() => setShowAdvanced((v) => !v)}>{showAdvanced ? 'پنهان کردن تنظیمات پیشرفته' : 'نمایش تنظیمات پیشرفته JSON'}</button>
        {showAdvanced && <div className="admin-archive__advanced"><label><span>links JSON</span><textarea value={form.linksJson} onChange={(e) => setForm({ ...form, linksJson: e.target.value })} rows={5} dir="ltr" /></label><label><span>related JSON</span><textarea value={form.relatedJson} onChange={(e) => setForm({ ...form, relatedJson: e.target.value })} rows={4} dir="ltr" /></label><label><span>OMDb JSON</span><textarea value={form.omdbJson} onChange={(e) => setForm({ ...form, omdbJson: e.target.value })} rows={6} dir="ltr" /></label></div>}
        <div className="admin-archive__files"><div className="admin-archive__section-head"><div><h3>لینک‌های دانلود</h3><span>{form.files.length.toLocaleString('fa-IR')} فایل</span></div><button type="button" onClick={() => setForm({ ...form, files: [...form.files, emptyFile()] })}><FiPlus /> افزودن فایل</button></div>{form.files.map((file, index) => <div className="admin-archive__file" key={`${index}-${file.filename}`}><div className="admin-archive__file-head"><strong>فایل {index + 1}</strong><button type="button" onClick={() => setForm({ ...form, files: form.files.filter((_, i) => i !== index) })}><FiTrash2 /></button></div>{fileFields.map((key) => <label key={key}><span>{key}</span><input value={file[key] ?? ''} onChange={(e) => updateFile(index, { [key]: e.target.value })} dir="ltr" /></label>)}<label><span>season</span><input type="number" value={file.season ?? ''} onChange={(e) => updateFile(index, { season: e.target.value === '' ? null : Number(e.target.value) })} /></label><label><span>episode</span><input type="number" value={file.episode ?? ''} onChange={(e) => updateFile(index, { episode: e.target.value === '' ? null : Number(e.target.value) })} /></label><label><span>status</span><input type="number" value={file.status} onChange={(e) => updateFile(index, { status: Number(e.target.value) || 0 })} /></label><label className="checkbox"><input type="checkbox" checked={file.valid} onChange={(e) => updateFile(index, { valid: e.target.checked })} /><span>لینک معتبر است</span></label></div>)}</div>
      </div><footer><button type="button" onClick={() => setForm(null)}>انصراف</button><button className="save" disabled={save.isPending}>{save.isPending ? 'در حال ذخیره…' : 'ذخیره تغییرات'}</button></footer></form></div>}

    {reportsItem && <div className="admin-archive__overlay" onMouseDown={(e) => e.currentTarget === e.target && setReportsItem(null)}><div className="admin-archive__report-modal"><header className="admin-archive__modal-head"><div><p>گزارش‌های کاربران</p><h2>{reportsItem.title_en || reportsItem.title_fa || reportsItem.id}</h2><span>{reportsItem.id}</span></div><button onClick={() => setReportsItem(null)}><FiX /></button></header><div className="admin-archive__modal-body">{reports.isLoading ? <div className="admin-archive__message">در حال دریافت گزارش‌ها…</div> : reports.data?.length ? <div className="admin-archive__report-list">{reports.data.map((report: AdminArchiveReport) => <article key={report.id} className="admin-archive__report"><div className="admin-archive__report-head"><div><strong>{reportTypeLabel[report.report_type] || report.report_type}</strong><span>{report.username || 'کاربر بدون نام'} · {report.phone || 'شماره ثبت نشده'}</span></div><time>{new Date(report.created_at).toLocaleString('fa-IR')}</time></div><div className="admin-archive__report-target">{report.target_type === 'media' ? 'کل عنوان' : report.target_type === 'episode' ? `فصل ${report.season}، قسمت ${report.episode}` : `فایل: ${report.file_url}`}</div>{report.custom_text && <p>{report.custom_text}</p>}</article>)}</div> : <div className="admin-archive__message"><FiFlag /> برای این آیتم هنوز گزارشی ثبت نشده است.</div>}</div></div></div>}

    {showSubtitleReport && <div className="admin-archive__overlay" onMouseDown={(e) => e.currentTarget === e.target && setShowSubtitleReport(false)}><div className="admin-archive__subtitle-modal"><header className="admin-archive__modal-head"><div><p>گزارش سلامت زیرنویس</p><h2>وضعیت زیرنویس کل آرشیو</h2></div><button onClick={() => setShowSubtitleReport(false)}><FiX /></button></header><div className="admin-archive__subtitle-report">{subtitleReport.isLoading ? <div className="admin-archive__message">در حال محاسبه…</div> : subtitleReport.data ? <><div className="admin-archive__subtitle-kpis"><div><span>کل آیتم‌ها</span><strong>{subtitleReport.data.total_items.toLocaleString('fa-IR')}</strong></div><div><span>زیرنویس معتبر</span><strong>{subtitleReport.data.valid_items.toLocaleString('fa-IR')}</strong></div><div><span>بدون زیرنویس معتبر</span><strong>{subtitleReport.data.invalid_items.toLocaleString('fa-IR')}</strong></div></div><div className="admin-archive__subtitle-progress"><div><span>درصد آیتم‌های دارای زیرنویس معتبر</span><strong>{subtitleReport.data.valid_percentage.toFixed(1)}٪</strong></div><div className="admin-archive__progress-track"><span style={{ width: `${Math.max(0, Math.min(100, subtitleReport.data.valid_percentage))}%` }} /></div></div></> : <div className="admin-archive__message admin-archive__message--error">گزارش در دسترس نیست.</div>}</div></div></div>}
  </section>;
};

export default Archive;
