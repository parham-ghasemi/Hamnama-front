import { PiCaretDownBold } from 'react-icons/pi';
import './Faq.scss';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import Reveal from '../reveal/Reveal';

const Faq = () => {
  const questions = [
    {
      q: 'با هم نما چه کار هایی میشه کرد ؟!',
      a: 'لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است و برای شرایط فعلی تکنولوژی مورد نیاز و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد'
    },
    {
      q: 'چند حالت برای تماشای فیلم وجود دارد ؟!',
      a: 'لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است و برای شرایط فعلی تکنولوژی مورد نیاز و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد'
    },
    {
      q: 'چند حالت برای پخش موزیک وجود دارد ؟!',
      a: 'لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است و برای شرایط فعلی تکنولوژی مورد نیاز و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد'
    },
    {
      q: 'اشتراک های چند نفره به چه صورت فعال میشوند ؟!',
      a: 'لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است و برای شرایط فعلی تکنولوژی مورد نیاز و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد'
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
    <div className='home-v2-faq'>
      <div className='home-v2-faq__blob'></div>

      {
        questions.map((ques, ind) => {
          const isOpen = show.indexOf(ind) >= 0;

          return (
            <Reveal
              className="home-v2-faq__item"
              key={`homefaq-${ind}`}
              delay={ind * 70}
            >
              <div
                // @ts-ignore
                ref={(el) => (itemRefs.current[ind] = el)}
                className='home-v2-faq__item__inner'
                onClick={() => toggleShow(ind)}
              >
                <div className="home-v2-faq__glow" />

                <div
                  role='button'
                  tabIndex={0}
                  aria-expanded={isOpen}
                  aria-controls={`homefaq-answer-${ind}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleShow(ind);
                    }
                  }}
                  className={clsx(isOpen && 'home-v2-faq__item__trigger--show', 'home-v2-faq__item__trigger')}
                >
                  {ques.q}
                  <PiCaretDownBold />
                </div>

                <div
                  id={`homefaq-answer-${ind}`}
                  className={clsx(isOpen ? 'home-v2-faq__item__answer home-v2-faq__item__answer--show' : 'home-v2-faq__item__answer')}
                >
                  <div> {/* <-- Inner wrapper ensures smooth calculation */}
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
