import { useCallback, type ReactNode } from 'react';
import clsx from 'clsx';
import {
  PiArrowDown,
  PiArrowsClockwise,
  PiBookOpenTextFill,
  PiChatCircleDotsFill,
  PiCheckCircleFill,
  PiClockCounterClockwiseFill,
  PiFilmSlateFill,
  PiGearSixFill,
  PiHeartFill,
  PiHouseFill,
  PiKeyFill,
  PiLockKeyFill,
  PiMicrophoneFill,
  PiMonitorPlayFill,
  PiNotePencilFill,
  PiPlayCircleFill,
  PiShareNetworkFill,
  PiTicketFill,
  PiUserCircleFill,
  PiUsersThreeFill,
  PiVideoCameraFill,
  PiWarningCircleFill,
} from 'react-icons/pi';
import { SEO } from '../../components/seo/SEO';
import CinemaAmbience from '../home/ambience/CinemaAmbience';
import Reveal from '../home/reveal/Reveal';
import { useTheme } from '../../context/ThemeContext';
import './Tutorial.scss';

const tableOfContents = [
  { id: 'getting-started', title: 'شروع کار', icon: <PiHouseFill /> },
  { id: 'account', title: 'حساب کاربری', icon: <PiUserCircleFill /> },
  { id: 'room-entry', title: 'ورود به اتاق', icon: <PiKeyFill /> },
  { id: 'room-creation', title: 'ساخت اتاق', icon: <PiVideoCameraFill /> },
  { id: 'media', title: 'انتخاب و پخش محتوا', icon: <PiFilmSlateFill /> },
  { id: 'player', title: 'کنترل پخش', icon: <PiMonitorPlayFill /> },
  { id: 'subtitles', title: 'زیرنویس', icon: <PiNotePencilFill /> },
  { id: 'chat', title: 'چت اتاق', icon: <PiChatCircleDotsFill /> },
  { id: 'voice-reactions', title: 'ویس و واکنش‌ها', icon: <PiMicrophoneFill /> },
  { id: 'members', title: 'اعضا و مدیریت', icon: <PiUsersThreeFill /> },
  { id: 'settings', title: 'تنظیمات اتاق', icon: <PiGearSixFill /> },
  { id: 'dashboard', title: 'حساب و داشبورد', icon: <PiUserCircleFill /> },
  { id: 'tickets', title: 'تیکت و پشتیبانی', icon: <PiTicketFill /> },
  { id: 'current-state', title: 'امکانات در حال توسعه', icon: <PiWarningCircleFill /> },
];

const Tutorial = () => {
  const { isLight } = useTheme();

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start', });
  }, []);

  return (
    <>
      <SEO
        title="راهنمای استفاده از هم‌نما"
        description="راهنمای کامل استفاده از هم‌نما؛ از ساخت حساب و اتاق تا انتخاب فیلم، چت، ویس، زیرنویس، مدیریت اعضا و تیکت پشتیبانی."
        canonical="https://hamnama.net/tutorial"
      />

      <div className={clsx('tutorial-page', isLight && 'tutorial-page--light')}>
        <CinemaAmbience />

        <Reveal className="tutorial-page__hero" variant="fade">
          <span className="tutorial-page__badge">
            <PiBookOpenTextFill aria-hidden="true" />
            راهنمای کامل هم‌نما
          </span>
          <h1>
            همه‌چیز را درباره‌ی <span>هم‌نما</span> بدانید
          </h1>
          <p>
            این صفحه قدم‌به‌قدم توضیح می‌دهد هر بخش هم‌نما چه کاری انجام می‌دهد و از اولین ورود
            تا تماشای فیلم، گفت‌وگو، مدیریت اتاق و دریافت پشتیبانی چه اتفاقی می‌افتد.
          </p>
        </Reveal>

        <Reveal className="tutorial-page__video" variant="scale" delay={80}>
          <div className="tutorial-page__video__film" aria-hidden="true" />
          <div className="tutorial-page__video__screen">
            <div className="tutorial-page__video__screen__orb" aria-hidden="true" />
            <span className="tutorial-page__video__screen__icon" aria-hidden="true">
              <PiPlayCircleFill />
            </span>
            <strong>ویدیوی آموزش هم‌نما</strong>
            <small>ویدیوی راهنما در این بخش قرار می‌گیرد.</small>
          </div>
        </Reveal>

        <section className="tutorial-page__section tutorial-page__toc-section" aria-labelledby="tutorial-toc-title">
          <Reveal as="h2" className="tutorial-page__section-title" id="tutorial-toc-title">
            از کجا <span>شروع کنم؟</span>
          </Reveal>
          <Reveal className="tutorial-page__section-lead" variant="fade" delay={50}>
            روی هر کارت بزنید تا دقیقاً به همان بخش بروید. این فهرست عمداً بر اساس مسیر واقعی استفاده
            از سایت چیده شده است.
          </Reveal>

          <div className="tutorial-page__toc" aria-label="فهرست مطالب آموزش">
            {tableOfContents.map((item, index) => (
              <Reveal
                as="button"
                className="tutorial-page__toc-card"
                key={item.id}
                delay={index * 45}
                variant="up"
                onClick={() => scrollToSection(item.id)}
              >
                <span className="tutorial-page__toc-card__icon" aria-hidden="true">{item.icon}</span>
                <span className="tutorial-page__toc-card__body">
                  <strong>{item.title}</strong>
                  <span>رفتن به این بخش</span>
                </span>
                <PiArrowDown className="tutorial-page__toc-card__arrow" aria-hidden="true" />
              </Reveal>
            ))}
          </div>
        </section>

        <TutorialSection id="getting-started" title="شروع کار" icon={<PiHouseFill />}>
          <p>
            هم‌نما برای تماشای همزمان فیلم و سریال در یک اتاق مشترک ساخته شده است. نقطه‌ی شروع از صفحه‌ی اصلی
            است؛ در آنجا دو مسیر اصلی می‌بینید: «شروع به تماشا» برای رفتن به صفحه‌ی اتاق‌ها و «خرید اشتراک» برای
            رفتن به صفحه‌ی پلن‌ها. در وضعیت فعلی سایت، هم‌نما رایگان است و کنترل‌های خرید توسط سیستم فعلی رایگان
            بودن سایت پوشانده شده‌اند، بنابراین برای استفاده از اتاق لازم نیست پرداختی انجام دهید.
          </p>
          <InfoGrid items={[
            ['مسیر اصلی', 'خانه → شروع به تماشا → ورود یا ساخت اتاق → انتخاب محتوا'],
            ['پشتیبانی', 'دکمه‌ی شناور پشتیبانی در صفحات اصلی حتی قبل از ثبت‌نام هم قابل استفاده است.'],
            ['ظاهر سایت', 'تم تاریک و روشن در بخش‌های مختلف وجود دارد و بسیاری از صفحات از همان فضای سینمایی، نورپردازی و انیمیشن‌های ورود استفاده می‌کنند.'],
          ]} />
        </TutorialSection>

        <TutorialSection id="account" title="ساخت حساب و ورود" icon={<PiUserCircleFill />}>
          <p>
            ورود و ثبت‌نام با شماره موبایل شروع می‌شود. ابتدا هم‌نما بررسی می‌کند شماره قبلاً حساب داشته یا نه.
            اگر حساب وجود داشته باشد، می‌توانید با رمز عبور وارد شوید یا از مسیر رمز یکبارمصرف استفاده کنید.
            اگر حساب جدید باشد، کد یکبارمصرف برای ثبت‌نام ارسال می‌شود؛ بعد از تأیید کد، نام کاربری و رمز عبور
            را تعیین می‌کنید و حساب ساخته می‌شود.
          </p>
          <div className="tutorial-page__steps">
            <Step title="شماره موبایل" text="شماره را وارد کنید تا هم‌نما مسیر ورود یا ثبت‌نام را مشخص کند." />
            <Step title="ورود یا OTP" text="کاربر قدیمی می‌تواند رمز عبور یا کد ورود را انتخاب کند؛ کاربر جدید ابتدا کد ثبت‌نام را تأیید می‌کند." />
            <Step title="اطلاعات حساب" text="در ثبت‌نام، نام کاربری و رمز عبور ثبت می‌شود و پس از موفقیت، نشست شما ساخته و به صفحه‌ی اصلی برمی‌گردید." />
          </div>
          <div className="tutorial-page__note tutorial-page__note--info">
            <PiLockKeyFill aria-hidden="true" />
            <span>بعد از ورود، لازم نیست هر بار دوباره وارد حساب شوید؛ تا زمانی که ورود شما معتبر باشد، هم‌نما اطلاعات لازم برای باز کردن بخش‌های مختلف حساب را در مرورگر نگه می‌دارد.</span>
          </div>
        </TutorialSection>

        <TutorialSection id="room-entry" title="ورود به اتاق" icon={<PiKeyFill />}>
          <p>
            صفحه‌ی «انتخاب اتاق» چند راه برای ورود در اختیار شما می‌گذارد. می‌توانید کد اتاق را دستی وارد کنید،
            مستقیماً یکی از اتاق‌های عمومی فعال را انتخاب کنید، به آخرین اتاق فعال خود برگردید یا وارد اتاق شخصی
            فعلی خود شوید. اگر همین حالا عضو یک اتاق باشید، ساخت یا پیوستن به اتاق دیگری از همان صفحه با محدودیت
            سرور روبه‌رو می‌شود تا همزمان داخل چند اتاق نباشید.
          </p>
          <InfoGrid items={[
            ['کد اتاق', 'کد اتاق را وارد کنید و «پیوستن» را بزنید. کدهای واردشده عددی هستند و فیلد ورود تا ۶ کاراکتر را می‌پذیرد.'],
            ['اتاق‌های عمومی', 'اتاق‌های عمومی فعال با نام، تصویر در صورت وجود و کد نمایش داده می‌شوند و با دکمه‌ی «پیوستن» می‌توانید مستقیم وارد شوید.'],
            ['آخرین اتاق', 'آخرین اتاق فعال شما همراه با کد نمایش داده می‌شود تا دوباره با یک کلیک وارد آن شوید.'],
            ['اتاق شخصی', 'اگر در حال حاضر اتاقی داشته باشید، کد آن نمایش داده می‌شود و دکمه‌ی «ورود» شما را به همان اتاق می‌برد.'],
          ]} />
          <div className="tutorial-page__note tutorial-page__note--success">
            <PiArrowsClockwise aria-hidden="true" />
            <span>اگر صفحه را تازه‌سازی کنید یا دوباره لینک اتاق را باز کنید، می‌توانید به همان اتاق برگردید و دوباره به فهرست اعضای آن اضافه شوید.</span>
          </div>
        </TutorialSection>

        <TutorialSection id="room-creation" title="ساخت اتاق شخصی" icon={<PiVideoCameraFill />}>
          <p>
            در «ساخت اتاق شخصی» می‌توانید نام، تصویر، نوع دسترسی و سطح دسترسی کنترل پخش را تعیین کنید. نام برای
            اتاق خصوصی اختیاری است، اما برای اتاق عمومی باید نام داشته باشد. تصویر اتاق هم اختیاری است و بعداً
            توسط سازنده قابل تغییر یا حذف است.
          </p>
          <div className="tutorial-page__choice-grid">
            <Choice icon={<PiLockKeyFill />} title="خصوصی" text="اتاق برای ورود مستقیم با کد/عضویت استفاده می‌شود و نام آن می‌تواند خالی باشد." />
            <Choice icon={<PiShareNetworkFill />} title="عمومی" text="اتاق در فهرست اتاق‌های عمومی فعال نمایش داده می‌شود و برای آن نام اتاق لازم است." />
            <Choice icon={<PiUserCircleFill />} title="فقط مدیران" text="کنترل محتوای در حال پخش فقط در اختیار مدیران اتاق است." />
            <Choice icon={<PiUsersThreeFill />} title="همه کاربران" text="اعضای اتاق هم می‌توانند کنترل پخش را انجام دهند." />
          </div>
          <p>
            بعد از ساخت موفق، شما وارد همان اتاق می‌شوید. اگر تصویر اتاق انتخاب کرده باشید، فایل تصویر نیز بعد از
            ساخت اتاق آپلود می‌شود؛ خطای آپلود تصویر مانع ورود شما به خود اتاق نمی‌شود.
          </p>
        </TutorialSection>

        <TutorialSection id="media" title="انتخاب فیلم، سریال یا فایل" icon={<PiFilmSlateFill />}>
          <p>
            داخل اتاق، دکمه‌ی «انتخاب فیلم» منبع پخش را باز می‌کند. سه مسیر واقعی در این بخش وجود دارد: انتخاب از
            آرشیو فیلم و سریال، پخش با لینک مستقیم و آپلود فایل ویدیویی خودتان. بعد از انتخاب محتوا، وضعیت پخش و
            عنوان فعلی بین اعضای اتاق همگام می‌شود.
          </p>
          <div className="tutorial-page__media-paths">
            <article>
              <span><PiFilmSlateFill /></span>
              <h3>آرشیو هم‌نما</h3>
              <p>جست‌وجو، فیلتر نوع محتوا و مرتب‌سازی در آرشیو وجود دارد. برای هر عنوان جزئیات و فایل‌های موجود نمایش داده می‌شود و انتخاب فایل می‌تواند شامل کیفیت، فصل و قسمت باشد.</p>
              <p>در آرشیو امکان افزودن عنوان به علاقه‌مندی‌ها و گزارش محتوای مشکل‌دار نیز وجود دارد. سریال‌ها می‌توانند قسمت بعدی را هم به عنوان ادامه‌ی آماده داشته باشند.</p>
            </article>
            <article>
              <span><PiShareNetworkFill /></span>
              <h3>پخش با لینک</h3>
              <p>پس از انتخاب «پخش با لینک»، فیلد لینک فعال می‌شود. لینک را وارد کنید و «ثبت» را بزنید تا همان آدرس به عنوان منبع پخش اتاق ثبت شود.</p>
              <p>در این حالت محتوای آرشیوی انتخاب نشده و اطلاعات فیلم/سریال نیز به صورت خودکار از آرشیو دریافت نمی‌شود.</p>
            </article>
            <article>
              <span><PiVideoCameraFill /></span>
              <h3>آپلود فایل خودتان</h3>
              <p>یک ویدیو را انتخاب کنید و در صورت نیاز فایل زیرنویس SRT نیز بدهید. سقف فایل ویدیو ۲ گیگابایت است و فرمت‌های MP4، MKV، WebM، MOV، M4V، AVI، MPEG، MPG و OGV پذیرفته می‌شوند.</p>
              <p>زیرنویس اختیاری است، باید SRT باشد و حداکثر ۵ مگابایت حجم داشته باشد. درصد پیشرفت آپلود نیز داخل پنجره نمایش داده می‌شود.</p>
            </article>
          </div>
          <div className="tutorial-page__note tutorial-page__note--warning">
            <PiWarningCircleFill aria-hidden="true" />
            <span>کنترل انتخاب و تغییر رسانه تابع مجوز پخش اتاق است؛ اگر اتاق روی «فقط مدیران» باشد، اعضای معمولی امکان تغییر محتوای در حال پخش را ندارند.</span>
          </div>
          <div className="tutorial-page__note tutorial-page__note--info">
            <PiWarningCircleFill aria-hidden="true" />
            <span>در iPhone و iPad با Safari، فایل‌های MKV و لینک‌های مستقیم ویدیو ممکن است پخش نشوند. برای تماشای مطمئن‌تر روی این دستگاه‌ها، بهتر است ویدیوهای خودتان را با فرمت‌هایی مثل MP4 بارگذاری کنید.</span>
          </div>
        </TutorialSection>

        <TutorialSection id="player" title="پخش همزمان و کنترل‌های ویدیو" icon={<PiMonitorPlayFill />}>
          <p>
            پخش‌کننده‌ی ویدیو وضعیت تماشا را بین اعضای اتاق هماهنگ می‌کند. کسی که اجازه‌ی کنترل پخش داشته باشد می‌تواند
            ویدیو را پخش یا متوقف کند، به بخش دیگری از آن برود و در صورت وجود قسمت بعدی، آن را برای همه شروع کند.
          </p>
          <InfoGrid items={[
            ['پخش و توقف', 'دکمه‌ی Play/Pause وضعیت پخش اتاق را تغییر می‌دهد.'],
            ['جلو/عقب', 'دکمه‌های جابه‌جایی ۱۰ ثانیه‌ای و نوار زمان برای جابجایی در زمان ویدیو استفاده می‌شوند.'],
            ['صدا', 'ولوم و بی‌صدا کردن مستقل داخل پخش‌کننده کنترل می‌شود.'],
            ['تمام‌صفحه', 'پخش‌کننده دکمه‌ی تمام‌صفحه دارد و در صورت پشتیبانی مرورگر می‌تواند وارد حالت Picture-in-Picture هم شود.'],
            ['قسمت بعد', 'برای سریالی که قسمت بعدی در داده‌ی فعلی دارد، امکان رفتن به قسمت بعد و شروع آن از زمان صفر وجود دارد.'],
            ['کیفیت', 'اطلاعات کیفیت فایل انتخاب‌شده در نوار «در حال پخش» نشان داده می‌شود؛ خود پخش‌کننده از منبع همان فایل استفاده می‌کند.'],
          ]} />
          <div className="tutorial-page__shortcut-grid">
            <Shortcut keys="J / L" text="عقب یا جلو ۱۰ ثانیه" />
            <Shortcut keys="K / Space" text="پخش یا توقف" />
            <Shortcut keys="← / →" text="عقب یا جلو ۵ ثانیه" />
            <Shortcut keys="F" text="تمام‌صفحه" />
            <Shortcut keys="موبایل" text="دو ضربه روی نیمه‌ی چپ یا راست برای جابه‌جایی ۱۰ ثانیه‌ای" />
          </div>
        </TutorialSection>

        <TutorialSection id="subtitles" title="زیرنویس و شخصی‌سازی آن" icon={<PiNotePencilFill />}>
          <p>
            پخش‌کننده هنگام در دسترس بودن زیرنویس، بخش تنظیمات زیرنویس را فعال می‌کند. برای محتوای آرشیو، زیرنویس‌های
            مربوط به همان فیلم/قسمت از آرشیو خوانده می‌شوند. برای محتوای آپلودی یا اتاق، زیرنویس می‌تواند به صورت فایل
            SRT یا لینک مستقیم SRT ثبت شود و زیرنویس جدید جایگزین زیرنویس قبلی اتاق می‌شود.
          </p>
          <div className="tutorial-page__choice-grid tutorial-page__choice-grid--compact">
            <Choice icon={<PiNotePencilFill />} title="روشن/خاموش" text="وقتی زیرنویس برای ویدیو در دسترس باشد، می‌توانید نمایش آن را روشن یا خاموش کنید." />
            <Choice icon={<PiHeartFill />} title="ظاهر متن" text="اندازه متن، شفافیت متن، شفافیت پس‌زمینه و وزن قلم قابل تنظیم است." />
            <Choice icon={<PiArrowDown />} title="جایگاه" text="زیرنویس بین جایگاه پایین و میانی قابل جابه‌جایی است." />
            <Choice icon={<PiArrowsClockwise />} title="هماهنگ‌سازی" text="با تنظیم زمان‌بندی زیرنویس، می‌توانید آن را کمی جلوتر یا عقب‌تر بیاورید تا با تصویر هماهنگ شود." />
          </div>
          <p>
            برای هر فایل SRT، اعتبار فرمت نیز در رابط بررسی می‌شود. هنگام بارگذاری زیرنویس اختصاصی، فقط یکی از دو
            ورودی فایل یا لینک باید استفاده شود و فایل محلی باید SRT معتبر باشد.
          </p>
        </TutorialSection>

        <TutorialSection id="chat" title="چت و گفت‌وگوی اتاق" icon={<PiChatCircleDotsFill />}>
          <p>
            چت اتاق کنار پخش‌کننده قرار دارد و پیام‌ها همراه با رویدادهای ورود و خروج اعضا در یک فهرست گفتگو نمایش داده
            می‌شوند. پیام‌های جدید بدون نیاز به تازه‌سازی صفحه نمایش داده می‌شوند و در صورت فعال بودن صداهای رویداد، برای پیام جدید دیگران هم اعلان صوتی پخش می‌شود.
          </p>
          <div className="tutorial-page__chat-features">
            <Feature title="ارسال پیام" text="پیام را بنویسید و با دکمه ارسال یا Enter (بدون Shift/Ctrl/Meta) ارسال کنید." />
            <Feature title="پاسخ به پیام" text="در دسکتاپ از منوی پیام و در موبایل با کشیدن پیام به کنار می‌توانید پاسخ بدهید. روی نقل‌قول پاسخ هم می‌توان به پیام اصلی رفت." />
            <Feature title="ویرایش پیام خودتان" text="از گزینه‌های پیام خودتان وارد ویرایش شوید، متن را اصلاح کنید و ذخیره را بزنید." />
            <Feature title="ایموجی" text="انتخابگر ایموجی کنار فیلد پیام وجود دارد و ایموجی در محل مکان‌نما وارد می‌شود." />
            <Feature title="عرض چت" text="در دسکتاپ دسته‌ی کنار چت را بکشید تا عرض پنل تغییر کند؛ دوبار کلیک روی همان ناحیه عرض پیش‌فرض را برمی‌گرداند." />
            <Feature title="اعلان مدیریت" text="اعلان‌های مدیریت سایت داخل چت نمایش داده می‌شوند و هر اعلان را می‌توانید از همان کارت مخفی کنید." />
          </div>
        </TutorialSection>

        <TutorialSection id="voice-reactions" title="چت صوتی و واکنش‌ها" icon={<PiMicrophoneFill />}>
          <p>
            چت صوتی به صورت جدا از چت متنی وارد می‌شود. با انتخاب «چت صوتی»، مرورگر از شما دسترسی میکروفون می‌خواهد و
            بعد از اتصال، میکروفون به صورت پیش‌فرض mute است؛ بنابراین ورود به voice chat به معنی باز بودن خودکار میکروفون نیست.
          </p>
          <InfoGrid items={[
            ['میکروفون', 'بعد از ورود به چت صوتی، دکمه‌ی میکروفون برای روشن/خاموش کردن صدای خودتان استفاده می‌شود.'],
            ['اتصال صوتی', 'بعد از ورود به چت صوتی، صدای اعضای حاضر را از طریق مرورگر می‌شنوید و می‌توانید میکروفون خودتان را هر زمان که خواستید روشن یا خاموش کنید.'],
            ['واکنش سریع', 'دکمه‌ی واکنش پنج انتخاب آماده دارد: 😭، 😂، ❤️، 😍 و 🔥. با انتخاب هرکدام، واکنش به اتاق ارسال و افکت ذرات روی رابط نمایش داده می‌شود.'],
            ['صداهای رویداد', 'ورود و خروج کاربران، پیام جدید و اعلان مدیریت می‌توانند صدای رویداد جداگانه داشته باشند و ولوم هرکدام قابل تنظیم است.'],
          ]} />
        </TutorialSection>

        <TutorialSection id="members" title="اعضا، مدیران و کنترل اتاق" icon={<PiUsersThreeFill />}>
          <p>
            بخش «کاربران» لیست اعضای حاضر، تعداد آنلاین‌ها، نقش‌ها و وضعیت اتصال هر نفر را نشان می‌دهد. مدیر می‌تواند
            اعضای دیگر را جست‌وجو کند و برای هر عضو، نقش «عضو» یا «مدیر» تعیین کند یا او را از اتاق اخراج کند.
          </p>
          <div className="tutorial-page__role-grid">
            <Role title="عضو اتاق" text="می‌تواند از امکاناتی که برای همه مجاز شده استفاده کند، در چت پیام بفرستد و در صورت ورود به voice chat از میکروفون خود استفاده کند." />
            <Role title="مدیر اتاق" text="مدیریت اعضا و کنترل محتوای پخش را بر اساس مجوز اتاق در اختیار دارد. مدیر می‌تواند نقش اعضا را عوض یا آن‌ها را اخراج کند." />
            <Role title="سازنده اتاق" text="نام و تصویر اتاق، عمومی/خصوصی بودن و مجوز کنترل پخش را تغییر می‌دهد و تنها نقش مجاز برای این تنظیمات است." />
          </div>
          <div className="tutorial-page__note tutorial-page__note--warning">
            <PiWarningCircleFill aria-hidden="true" />
            <span>اخراج عضو با تأییدیه انجام می‌شود. تغییر نقش و اخراج روی سایر اعضا قابل انجام است، اما حساب مدیر جاری یا خود کاربر از این کنترل‌ها مستثناست.</span>
          </div>
        </TutorialSection>

        <TutorialSection id="settings" title="تنظیمات اتاق و تجربه‌ی تماشا" icon={<PiGearSixFill />}>
          <p>
            پنل تنظیمات اتاق دو گروه اصلی دارد: تنظیمات خود اتاق و تنظیمات تجربه‌ی رابط. سازنده می‌تواند اطلاعات اتاق
            را تغییر دهد و هر کاربری که وارد پنل شود می‌تواند تم و صداهای رویداد خود را تنظیم کند. این تنظیمات باید از
            تغییرات مربوط به محتوای پخش جدا در نظر گرفته شوند.
          </p>
          <div className="tutorial-page__settings-grid">
            <Setting title="نام و تصویر" text="سازنده می‌تواند نام اتاق و تصویر آن را تغییر دهد یا تصویر فعلی را حذف کند." />
            <Setting title="حریم خصوصی" text="سازنده بین «خصوصی» و «عمومی» انتخاب می‌کند؛ عمومی بودن نام اتاق را الزامی می‌کند." />
            <Setting title="کنترل پخش" text="سازنده مشخص می‌کند فقط مدیران کنترل پخش داشته باشند یا همه کاربران اتاق." />
            <Setting title="تم اتاق" text="سه ظاهر «تک‌رنگ»، «پیش‌فرض» و «روشن» برای فضای اتاق در نظر گرفته شده است." />
            <Setting title="صداهای رویداد" text="ولوم ورود خودتان، ورود دیگران، خروج دیگران، پیام جدید و اعلان مدیریت جداگانه قابل تنظیم است." />
          </div>
        </TutorialSection>

        <TutorialSection id="dashboard" title="پروفایل و داشبورد کاربر" icon={<PiUserCircleFill />}>
          <p>
            بعد از ورود، بخش کاربری از مسیر /user در دسترس است. در نسخه‌ی فعلی، «اطلاعات کاربر» و «تیکت‌ها» فعال هستند.
            در صفحه اطلاعات کاربر می‌توانید نام کاربری، شماره موبایل، رمز عبور و تصویر پروفایل را مدیریت کنید و گزارش ساعات
            تماشا را ببینید.
          </p>
          <InfoGrid items={[
            ['نام کاربری', 'از فرم ویرایش برای ثبت نام کاربری جدید استفاده کنید.'],
            ['شماره موبایل', 'شماره جدید ثبت می‌شود و برای تأیید تغییر، کد OTP وارد می‌کنید.'],
            ['رمز عبور', 'رمز فعلی و رمز جدید را وارد می‌کنید تا تغییر انجام شود.'],
            ['تصویر پروفایل', 'تصویر جدید انتخاب و آپلود می‌شود؛ تصویر فعلی نیز قابل حذف است. در رابط کاربری سقف ۱۰ مگابایت اعلام شده است.'],
            ['گزارش تماشا', 'ساعات تماشا برای هفته گذشته، ماه گذشته، سال گذشته یا کل زمان‌ها قابل بررسی است و روزهای بدون داده با صفر در نمودار پر می‌شوند.'],
          ]} />
          <div className="tutorial-page__note tutorial-page__note--info">
            <PiClockCounterClockwiseFill aria-hidden="true" />
            <span>داده‌ی نمودار از watch-stats کاربر گرفته می‌شود؛ این صفحه مدت تماشای ثبت‌شده را نمایش می‌دهد، نه مدت زمانی که صرفاً ویدیو در مرورگر باز بوده باشد.</span>
          </div>
        </TutorialSection>

        <TutorialSection id="tickets" title="تیکت و پشتیبانی" icon={<PiTicketFill />}>
          <p>
            برای مشکلات یا درخواست‌هایی که نیاز به پیگیری دارند، از بخش «تیکت‌ها» استفاده کنید. با ثبت تیکت، موضوع و متن
            اولیه ذخیره می‌شود و تیکت در فهرست شخصی شما همراه با شماره، وضعیت و تاریخ دیده می‌شود. با باز کردن تیکت، گفت‌وگوی
            شما و پشتیبان را می‌بینید و می‌توانید پاسخ بدهید یا تیکت را ببندید.
          </p>
          <div className="tutorial-page__ticket-statuses">
            <Status title="باز" text="تیکت ایجاد شده و هنوز وارد وضعیت پاسخ‌داده‌شده یا بسته‌شده نشده است." />
            <Status title="در انتظار پاسخ" text="تیکت منتظر پاسخ پشتیبانی است." />
            <Status title="پاسخ داده شده" text="پشتیبان پاسخ داده و می‌توانید دوباره در همان گفت‌وگو پاسخ دهید." />
            <Status title="بسته شده" text="گفت‌وگو بسته است و ورودی پاسخ در صفحه نمایش داده نمی‌شود." />
          </div>
          <p>
            روی دسکتاپ، با انتخاب یک تیکت، گفت‌وگوی آن به صورت مودال باز می‌شود؛ در موبایل به مسیر جداگانه‌ی همان تیکت
            منتقل می‌شوید. داخل صفحه‌ی تیکت نیز پاسخ و بستن تیکت در دسترس است. علاوه بر تیکت، ویجت «پشتیبانی هم‌نما» در
            صفحات اصلی اجازه می‌دهد حتی قبل از ثبت‌نام یک گفت‌وگوی پشتیبانی بسازید؛ نام می‌تواند ناشناس باشد.
          </p>
          <div className="tutorial-page__note tutorial-page__note--success">
            <PiCheckCircleFill aria-hidden="true" />
            <span>تیکت برای مسئله‌ای است که می‌خواهید پیگیری شود؛ ویجت پشتیبانی برای شروع سریع یک گفت‌وگوی مستقیم با تیم پشتیبانی طراحی شده است.</span>
          </div>
        </TutorialSection>

        <TutorialSection id="current-state" title="امکاناتی که هنوز فعال نیستند" icon={<PiWarningCircleFill />}>
          <p>
            چند قابلیت برای مراحل بعدی در نظر گرفته شده‌اند و پس از انتشار، امکانات بیشتری به هم‌نما اضافه می‌کنند.
            در ادامه می‌بینید هرکدام چه کاری انجام خواهند داد.
          </p>
          <div className="tutorial-page__roadmap">
            <Roadmap title="پرداخت و خرید اشتراک" text="با راه‌اندازی این بخش، می‌توانید پلن مناسب خودتان را انتخاب کنید، اشتراک بخرید و امکانات مربوط به پلن را در حساب خود مدیریت کنید." />
            <Roadmap title="پرداخت‌های کاربر" text="این بخش در آینده تاریخچه‌ی خریدها و پرداخت‌های شما را در یک مکان نمایش می‌دهد تا بتوانید سوابق مالی اشتراک خود را ببینید." />
            <Roadmap title="رتبه‌بندی" text="پس از انتشار، می‌توانید جایگاه خود را در میان کاربران هم‌نما ببینید و بر اساس زمان تماشا با دیگران مقایسه شوید." />
            <Roadmap title="مدیریت اعضای پلن" text="در آینده، اگر پلنی داشته باشید که امکان استفاده‌ی چندنفره داشته باشد، می‌توانید اعضای آن را اضافه، حذف و مدیریت کنید." />
            <Roadmap title="اپلیکیشن اندروید و ویندوز" text="با عرضه‌ی این نسخه‌ها، می‌توانید هم‌نما را مستقیماً روی دستگاه‌های اندرویدی و ویندوزی اجرا کنید و تجربه‌ی تماشا را راحت‌تر ادامه دهید." />
            <Roadmap title="اشتراک صفحه نمایش" text="با انتشار این قابلیت، می‌توانید صفحه‌نمایش خود را با اعضای اتاق به اشتراک بگذارید؛ برای مثال وقتی می‌خواهید چیزی خارج از پخش‌کننده را برای دوستانتان نشان دهید." />
          </div>
        </TutorialSection>

        <Reveal className="tutorial-page__closing" variant="fade">
          <span className="tutorial-page__closing__icon" aria-hidden="true"><PiFilmSlateFill /></span>
          <div>
            <span className="tutorial-page__closing__eyebrow">جمع‌بندی</span>
            <h2>مسیر واقعی استفاده از هم‌نما خیلی ساده است.</h2>
            <p>
              حساب بسازید یا وارد شوید، یک اتاق داشته باشید، دوستانتان را با کد دعوت کنید، منبع پخش را انتخاب کنید و
              تماشای همزمان را شروع کنید؛ بقیه‌ی امکانات برای این هستند که همان اتاق، حس یک فضای مشترک واقعی را داشته باشد.
            </p>
          </div>
        </Reveal>
      </div>
    </>
  );
};

const TutorialSection = ({ id, title, icon, children }: { id: string; title: string; icon: ReactNode; children: ReactNode }) => (
  <section id={id} className="tutorial-page__section tutorial-page__content-section">
    <Reveal className="tutorial-page__section-heading" variant="up">
      <span className="tutorial-page__section-heading__icon" aria-hidden="true">{icon}</span>
      <div>
        <span className="tutorial-page__section-heading__eyebrow">راهنمای هم‌نما</span>
        <h2>{title}</h2>
      </div>
    </Reveal>
    <Reveal className="tutorial-page__content-card" variant="fade" delay={50}>
      {children}
    </Reveal>
  </section>
);

const InfoGrid = ({ items }: { items: [string, string][] }) => (
  <div className="tutorial-page__info-grid">
    {items.map(([title, text]) => (
      <article key={title}>
        <strong>{title}</strong>
        <p>{text}</p>
      </article>
    ))}
  </div>
);

const Step = ({ title, text }: { title: string; text: string }) => (
  <article className="tutorial-page__step">
    <PiCheckCircleFill aria-hidden="true" />
    <div><strong>{title}</strong><p>{text}</p></div>
  </article>
);

const Choice = ({ icon, title, text }: { icon: ReactNode; title: string; text: string }) => (
  <article className="tutorial-page__choice">
    <span>{icon}</span>
    <div><strong>{title}</strong><p>{text}</p></div>
  </article>
);

const Feature = ({ title, text }: { title: string; text: string }) => (
  <article className="tutorial-page__feature">
    <strong>{title}</strong>
    <p>{text}</p>
  </article>
);

const Shortcut = ({ keys, text }: { keys: string; text: string }) => (
  <article className="tutorial-page__shortcut">
    <kbd>{keys}</kbd>
    <span>{text}</span>
  </article>
);

const Role = ({ title, text }: { title: string; text: string }) => (
  <article className="tutorial-page__role">
    <strong>{title}</strong>
    <p>{text}</p>
  </article>
);

const Setting = ({ title, text }: { title: string; text: string }) => (
  <article className="tutorial-page__setting">
    <PiGearSixFill aria-hidden="true" />
    <div><strong>{title}</strong><p>{text}</p></div>
  </article>
);

const Status = ({ title, text }: { title: string; text: string }) => (
  <article className="tutorial-page__status-card">
    <span><PiTicketFill /></span>
    <div><strong>{title}</strong><p>{text}</p></div>
  </article>
);

const Roadmap = ({ title, text }: { title: string; text: string }) => (
  <article className="tutorial-page__roadmap-card">
    <span><PiWarningCircleFill /></span>
    <div><strong>{title}</strong><p>{text}</p></div>
  </article>
);

export default Tutorial;
