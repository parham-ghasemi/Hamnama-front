import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiEdit2, FiFilm, FiPlus, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from '../../../components/toast';
import { adminApi, type AdminArchiveFileInput, type AdminArchiveItem } from '../../../apiCalls/adminApi';
import './Archive.scss';

type Form = Omit<AdminArchiveItem, 'links' | 'related' | 'omdb' | 'files'> & { linksJson: string; relatedJson: string; omdbJson: string; files: AdminArchiveFileInput[] };
const emptyFile = (): AdminArchiveFileInput => ({ url: '', filename: '', season: null, episode: null, quality_tags: '', version: '', release: '', size: '', status: 0, content_type: '', valid: false, final_url: '', error: '' });
const emptyForm = (): Form => ({ id: '', type: 'movie', title_en: '', title_fa: '', year: '', rating: '', votes: '', rated: '', released: '', runtime: '', genre: '', director: '', writer: '', actors: '', plot: '', language: '', country: '', awards: '', poster: '', metascore: '', box_office: '', imdb_rating: '', imdb_votes: '', linksJson: '{}', relatedJson: '[]', omdbJson: '', files: [] });
const jsonText = (value: unknown, fallback: unknown) => value == null ? JSON.stringify(fallback, null, 2) : JSON.stringify(value, null, 2);
const toForm = (item: AdminArchiveItem): Form => ({ ...emptyForm(), ...item, linksJson: jsonText(item.links, {}), relatedJson: jsonText(item.related, []), omdbJson: item.omdb ? jsonText(item.omdb, null) : '', files: item.files.map((file) => ({ ...file })) });
const parse = (text: string, fallback: unknown) => text.trim() ? JSON.parse(text) : fallback;
const metadataFields = ['title_en', 'title_fa', 'year', 'rating', 'votes', 'rated', 'released', 'runtime', 'genre', 'director', 'writer', 'actors', 'language', 'country', 'awards', 'poster', 'metascore', 'box_office', 'imdb_rating', 'imdb_votes'] as const;
const fileFields = ['url', 'filename', 'quality_tags', 'version', 'release', 'size', 'content_type', 'final_url', 'error'] as const;

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
  const [isStartingScrape, setIsStartingScrape] = useState(false);
  const [isStartingSubtitles, setIsStartingSubtitles] = useState(false);
  const params = useMemo(() => ({ search, type: type || undefined, page, limit: 10 }), [search, type, page]);
  const archive = useQuery({ queryKey: ['admin-archive', params], queryFn: () => adminApi.listArchive(params).then((r) => r.data) });
  const scrapeJobs = useQuery({
    queryKey: ['admin-scrape-jobs'],
    queryFn: () => adminApi.getScrapeJobs().then((r) => r.data),
    refetchInterval: 10000,
  });
  const subtitleStatus = useQuery({
    queryKey: ['admin-subtitle-sync', subtitleJobId],
    queryFn: () => adminApi.getSubtitleSyncStatus(subtitleJobId as string).then((r) => r.data),
    enabled: Boolean(subtitleJobId),
    refetchInterval: (query) => query.state.data?.status === 'running' ? 1500 : false,
  });

  const save = useMutation({
    mutationFn: (value: Form) => {
      const payload: Record<string, unknown> = { ...Object.fromEntries(metadataFields.map((key) => [key, value[key] ?? ''])), id: value.id.trim(), type: value.type, plot: value.plot ?? '', links: parse(value.linksJson, {}), related: parse(value.relatedJson, []), omdb: parse(value.omdbJson, null), files: value.files.filter((file) => file.url.trim()) };
      return editingId ? adminApi.updateArchiveItem(editingId, payload) : adminApi.createArchiveItem(payload);
    },
    onSuccess: () => { toast.success('آیتم آرشیو ذخیره شد'); setForm(null); setEditingId(null); setError(''); void qc.invalidateQueries({ queryKey: ['admin-archive'] }); },
    onError: () => { setError('ذخیره‌سازی انجام نشد. اطلاعات و لینک‌ها را بررسی کنید.'); toast.error('ذخیره‌سازی آیتم آرشیو با مشکل مواجه شد'); },
  });
  const remove = useMutation({ mutationFn: adminApi.deleteArchiveItem, onSuccess: () => { toast.success('آیتم حذف شد'); void qc.invalidateQueries({ queryKey: ['admin-archive'] }); }, onError: () => toast.error('حذف آیتم با مشکل مواجه شد') });

  const startScrape = async () => {
    if (!archiveUrl.trim() || isStartingScrape) return;
    setIsStartingScrape(true);
    try { await adminApi.triggerArchiveScrape(archiveUrl.trim()); toast.success('عملیات آرشیو آغاز شد'); setArchiveUrl(''); void scrapeJobs.refetch(); }
    catch { toast.error('آغاز عملیات آرشیو با مشکل مواجه شد'); }
    finally { setIsStartingScrape(false); }
  };
  const startSubtitles = async () => {
    if (isStartingSubtitles || subtitleStatus.data?.status === 'running') return;
    setIsStartingSubtitles(true);
    try { const response = await adminApi.triggerSubtitleSync(); setSubtitleJobId(response.data.job_id); toast.success('پردازش زیرنویس کل آرشیو آغاز شد'); }
    catch { toast.error('آغاز پردازش زیرنویس‌ها با مشکل مواجه شد'); }
    finally { setIsStartingSubtitles(false); }
  };

  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!form) return; try { parse(form.linksJson, {}); parse(form.relatedJson, []); parse(form.omdbJson, null); } catch { setError('JSON معتبر نیست.'); return; } save.mutate(form); };
  const updateFile = (index: number, patch: Partial<AdminArchiveFileInput>) => setForm((current) => current ? { ...current, files: current.files.map((file, i) => i === index ? { ...file, ...patch } : file) } : current);

  return <section className="admin-archive">
    <header className="admin-archive__header"><div><p className="admin-archive__eyebrow">آرشیو</p><h1 className="admin-archive__title">مدیریت آرشیو</h1><p className="admin-archive__subtitle">افزودن، ویرایش و حذف دستی فیلم‌ها، سریال‌ها و لینک‌های دانلود.</p></div><button className="admin-archive__primary" onClick={() => { setForm(emptyForm()); setEditingId(null); setError(''); }}><FiPlus /> افزودن آیتم</button></header>
    <div className="admin-archive__toolbar"><label className="admin-archive__search"><FiSearch /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="جستجو در عنوان یا شناسه" /></label><select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}><option value="">همه</option><option value="movie">فیلم</option><option value="series">سریال</option></select></div>
    <div className="admin-archive__ops">
      <div className="admin-archive__op-card"><div><strong>اسکرپ آرشیو</strong><span>دریافت آرشیو از یک منبع و جایگزینی اسنپ‌شات فعلی.</span></div><div className="admin-archive__op-form"><input value={archiveUrl} onChange={(e) => setArchiveUrl(e.target.value)} placeholder="https://example.com" dir="ltr" /><button type="button" onClick={() => void startScrape()} disabled={isStartingScrape || !archiveUrl.trim()}>{isStartingScrape ? 'در حال ارسال…' : 'شروع اسکرپ'}</button></div></div>
      <div className="admin-archive__op-card"><div><strong>زیرنویس آرشیو</strong><span>فایل‌های زیرنویس را دریافت و برای پخش به JSON تبدیل می‌کند.</span></div><div className="admin-archive__op-form"><button type="button" onClick={() => void startSubtitles()} disabled={isStartingSubtitles || subtitleStatus.data?.status === 'running'}>{isStartingSubtitles || subtitleStatus.data?.status === 'running' ? 'در حال پردازش…' : 'دریافت زیرنویس کل آرشیو'}</button>{subtitleStatus.data && <small>{subtitleStatus.data.status === 'completed' ? 'پردازش کامل شد' : subtitleStatus.data.status === 'running' ? `پردازش ${subtitleStatus.data.processed.toLocaleString('fa-IR')} از ${subtitleStatus.data.total.toLocaleString('fa-IR')}` : `خطا${subtitleStatus.data.error ? `: ${subtitleStatus.data.error}` : ''}`}</small>}</div></div>
    </div>
    {scrapeJobs.data?.jobs?.length ? <div className="admin-archive__jobs"><strong>آخرین عملیات اسکرپ</strong>{scrapeJobs.data.jobs.slice(0, 5).map((job) => <div key={job.job_id}><span dir="ltr">{job.url}</span><b>{job.status === 'completed' ? 'پایان یافته' : job.status === 'running' ? 'در حال انجام' : 'خطا'}</b></div>)}</div> : null}

    <div className="admin-archive__table-card">{archive.isLoading ? <div className="admin-archive__message">در حال بارگذاری…</div> : archive.isError ? <div className="admin-archive__message">امکان بارگذاری آرشیو وجود ندارد.</div> : <><div className="admin-archive__table-scroll"><table className="admin-archive__table"><thead><tr><th>آیتم</th><th>نوع</th><th>سال</th><th>امتیاز</th><th>فایل‌ها</th><th>عملیات</th></tr></thead><tbody>{archive.data?.data.map((item) => <tr key={item.id}><td><div className="admin-archive__item"><div className="admin-archive__poster">{item.poster ? <img src={item.poster} alt="" /> : <FiFilm />}</div><div><strong>{item.title_en || item.title_fa || item.id}</strong><span>{item.id}</span></div></div></td><td>{item.type === 'series' ? 'سریال' : 'فیلم'}</td><td>{item.year || '—'}</td><td>{item.rating || '—'}</td><td>{item.files.length}</td><td><div className="admin-archive__actions"><button onClick={() => { setForm(toForm(item)); setEditingId(item.id); setError(''); }}><FiEdit2 /> ویرایش</button><button className="danger" disabled={remove.isPending} onClick={() => window.confirm(`آیا «${item.title_en || item.id}» حذف شود؟`) && remove.mutate(item.id)}><FiTrash2 /> حذف</button></div></td></tr>)}</tbody></table></div><div className="admin-archive__pagination"><button disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>قبلی</button><span>صفحه {page} از {archive.data?.totalPages ?? 1}</span><button disabled={page >= (archive.data?.totalPages ?? 1)} onClick={() => setPage((v) => v + 1)}>بعدی</button></div></>}</div>
    {form && <div className="admin-archive__overlay" onMouseDown={(e) => e.currentTarget === e.target && setForm(null)}><form className="admin-archive__modal" onSubmit={submit}><header><div><p>{editingId ? 'ویرایش آیتم' : 'آیتم جدید'}</p><h2>{form.title_en || 'آرشیو'}</h2></div><button type="button" onClick={() => setForm(null)}><FiX /></button></header>{error && <div className="admin-archive__error">{error}</div>}<div className="admin-archive__form-grid"><label><span>شناسه</span><input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} disabled={Boolean(editingId)} required dir="ltr" /></label><label><span>نوع</span><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'movie' | 'series' })}><option value="movie">فیلم</option><option value="series">سریال</option></select></label>{metadataFields.map((key) => <label key={key}><span>{key}</span><input value={form[key] ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} dir={key === 'title_fa' ? 'auto' : 'ltr'} /></label>)}<label className="full"><span>plot</span><textarea value={form.plot ?? ''} onChange={(e) => setForm({ ...form, plot: e.target.value })} rows={4} /></label><label className="full"><span>links JSON</span><textarea value={form.linksJson} onChange={(e) => setForm({ ...form, linksJson: e.target.value })} rows={5} dir="ltr" /></label><label className="full"><span>related JSON</span><textarea value={form.relatedJson} onChange={(e) => setForm({ ...form, relatedJson: e.target.value })} rows={4} dir="ltr" /></label><label className="full"><span>OMDb JSON</span><textarea value={form.omdbJson} onChange={(e) => setForm({ ...form, omdbJson: e.target.value })} rows={6} dir="ltr" /></label></div>
      <div className="admin-archive__files"><div className="admin-archive__section-head"><h3>لینک‌های دانلود</h3><button type="button" onClick={() => setForm({ ...form, files: [...form.files, emptyFile()] })}><FiPlus /> افزودن فایل</button></div>{form.files.length === 0 ? <p className="muted">هنوز فایل دانلودی اضافه نشده است.</p> : form.files.map((file, index) => <div className="admin-archive__file" key={`${index}-${file.filename}`}><div className="admin-archive__file-head"><strong>فایل {index + 1}</strong><button type="button" onClick={() => setForm({ ...form, files: form.files.filter((_, i) => i !== index) })}><FiTrash2 /></button></div>{fileFields.map((key) => <label key={key}><span>{key}</span><input value={file[key] ?? ''} onChange={(e) => updateFile(index, { [key]: e.target.value })} dir="ltr" /></label>)}<label><span>season</span><input type="number" value={file.season ?? ''} onChange={(e) => updateFile(index, { season: e.target.value === '' ? null : Number(e.target.value) })} /></label><label><span>episode</span><input type="number" value={file.episode ?? ''} onChange={(e) => updateFile(index, { episode: e.target.value === '' ? null : Number(e.target.value) })} /></label><label><span>status</span><input type="number" value={file.status} onChange={(e) => updateFile(index, { status: Number(e.target.value) || 0 })} /></label><label className="checkbox"><input type="checkbox" checked={file.valid} onChange={(e) => updateFile(index, { valid: e.target.checked })} /><span>لینک معتبر است</span></label></div>)}</div>
      <footer><button type="button" onClick={() => setForm(null)}>انصراف</button><button className="save" disabled={save.isPending}>{save.isPending ? 'در حال ذخیره…' : 'ذخیره تغییرات'}</button></footer></form></div>}
  </section>;
};
export default Archive;
