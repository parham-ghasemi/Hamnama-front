import { PiCaretDownBold } from 'react-icons/pi';
import './Faq.scss';
import clsx from 'clsx';
import { useState } from 'react';

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

  return (
    <div className='home-faq'>
      {
        questions.map((ques, ind) => (
          <div className="home-faq__item" onClick={() => toggleShow(ind)} key={`homefaq-${ind}`}>
            <div className={clsx(show.indexOf(ind) >= 0 && 'home-faq__item__trigger--show', 'home-faq__item__trigger')}>
              {ques.q}
              <PiCaretDownBold />
            </div>

            <div className={clsx(show.indexOf(ind) >= 0 ? 'home-faq__item__answer home-faq__item__answer--show' : 'home-faq__item__answer')}>
              {ques.a}
            </div>
          </div>
        ))
      }
    </div>
  )
}

export default Faq