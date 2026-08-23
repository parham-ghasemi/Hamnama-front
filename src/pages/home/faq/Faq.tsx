import { PiCaretDownBold } from 'react-icons/pi';
import './Faq.scss';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import Reveal from '../reveal/Reveal';

const Faq = () => {
  const questions = [
    {
      q: 'با هم‌نما چه کار هایی میشه کرد ؟!',
      a: 'هم‌نما یک فضای تماشای آنلاین گروهی است که به شما اجازه می‌دهد با دوستانتان در یک اتاق مشترک فیلم و سریال تماشا کنید، هم‌زمان با یکدیگر چت کنید و تجربه‌ای گروهی و هماهنگ داشته باشید.'
    },
    {
      q: 'چطور یک اتاق تماشا بسازم یا به اتاق دوستانم بپیوندم ؟!',
      a: 'بعد از ورود به حساب کاربری، می‌توانید یک اتاق جدید بسازید یا با وارد کردن کد اتاق دوستتان به اتاق او بپیوندید. همچنین می‌توانید به‌راحتی به اتاق‌های قبلی خود برگردید.'
    },
    {
      q: 'چطور می‌توانم فیلم یا سریال موردنظرم را در اتاق پخش کنم ؟!',
      a: 'می‌توانید محتوای موردنظرتان را از آرشیو هم‌نما با بیش از ۱۴٬۰۰۰ فیلم و سریال انتخاب کنید یا لینک شخصی هر فایل ویدیویی که می‌خواهید را در اتاق وارد کنید و تماشای آن را با سایر اعضای اتاق لذت ببرید.'
    },
    {
      q: 'آیا پخش ویدیو برای همه اعضای اتاق هم‌زمان است ؟!',
      a: 'بله. پخش ویدیو در اتاق با سایر اعضا هماهنگ می‌شود تا همه بتوانند محتوا را به‌صورت هم‌زمان تماشا کنند.'
    },
    {
      q: 'آیا هنگام تماشای فیلم می‌توانم با دوستانم چت کنم ؟!',
      a: 'بله. هر اتاق دارای چت متنی است و می‌توانید در حین تماشا با دوستانتان گفتگو کنید، به پیام‌ها پاسخ دهید و از واکنش‌های ایموجی استفاده کنید. چت صوتی نیز برای گفتگو در حین تماشا در دسترس است.'
    },
    {
      q: 'آیا استفاده از هم‌نما رایگان است ؟!',
      a: 'بله! هم‌نما از زمان لانچ تا یک ماه به‌صورت کاملاً رایگان در اختیار کاربران خواهد بود. بعد از پایان این دوره، جزئیات مربوط به پلن‌ها و قیمت‌گذاری اعلام خواهد شد.'
    },
  ];

  const [show, setShow] = useState<number[]>([])

  const toggleShow = (ind: number) => {
    setShow(prev =>
      prev.includes(ind)
        ? prev.filter(item => item !== ind)
        : [...prev, ind]
    );
  };

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // The pointer-tracked border light is decorative: skip it entirely for
    // touch devices and for users who asked for reduced motion.
    const supportsGlow = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)"
    );
    if (!supportsGlow.matches) return;

    const handler = (e: MouseEvent) => {
      itemRefs.current.forEach(item => {
        if (!item) return;

        const rect = item.getBoundingClientRect();

        const closestX = Math.max(rect.left, Math.min(e.clientX, rect.right));
        const closestY = Math.max(rect.top, Math.min(e.clientY, rect.bottom));

        const dx = e.clientX - closestX;
        const dy = e.clientY - closestY;

        const distance = Math.sqrt(dx * dx + dy * dy);

        const radius = 190;

        const opacity = 0.15 + 0.65 * Math.max(
          0.35,
          1 - Math.pow(distance / radius, 2)
        );


        if (distance < radius) {
          item.style.setProperty("--mx", `${e.clientX - rect.left}px`);
          item.style.setProperty("--my", `${e.clientY - rect.top}px`);

          item.style.setProperty("--glow-opacity", `${opacity}`);
        } else {
          item.style.setProperty("--glow-opacity", "0");
        }
      });
    };

    window.addEventListener("mousemove", handler, { passive: true });

    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div className='home-faq'>
      <div className='home-faq__blob'></div>

      {
        questions.map((ques, ind) => {
          const isOpen = show.indexOf(ind) >= 0;

          return (
            <Reveal
              className="home-faq__item"
              key={`homefaq-${ind}`}
              delay={ind * 70}
            >
              <div
                // @ts-ignore
                ref={(el) => (itemRefs.current[ind] = el)}
                className="home-faq__item__inner"
              >
                <div className="home-faq__glow" />

                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  aria-controls={`homefaq-answer-${ind}`}
                  onClick={() => toggleShow(ind)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleShow(ind);
                    }
                  }}
                  className={clsx(
                    isOpen && 'home-faq__item__trigger--show',
                    'home-faq__item__trigger'
                  )}
                >
                  {ques.q}
                  <PiCaretDownBold />
                </div>

                <div
                  id={`homefaq-answer-${ind}`}
                  className={clsx(
                    'home-faq__item__answer',
                    isOpen && 'home-faq__item__answer--show'
                  )}
                >
                  <div>
                    {ques.a}
                  </div>
                </div>
              </div>
            </Reveal>
          )
        })
      }
    </div>
  )
}

export default Faq
