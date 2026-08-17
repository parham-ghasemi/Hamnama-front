import clsx from 'clsx';
import { useTheme } from '../../../context/ThemeContext';
import './Steps.scss';
import StepAnimation from './stepAnimation/StepAnimation';
import { toPersianNumerals } from '../../../helpers/NumberConversion';
import Reveal from '../reveal/Reveal';

const Steps = () => {
  const steps = ['ساخت حساب کاربری', "ساخت اتاق سینما", "انتخاب فیلم و تماشا"]
  const { isLight } = useTheme();
  return (
    <div className='home-steps'>
      <StepAnimation />

      <div className="home-steps__blob"></div>

      <ul className="home-steps__steps-container">
        <div className={clsx("img", isLight && "img--light")}>
          <img
            src="/homepage/lightglowlights.webp"
            className='light'
            alt=""
          />
          <img
            src="/homepage/glowlights.webp"
            className='dark'
            alt=""
          />
        </div>
        {
          steps.map((step, ind) => (
            <Reveal as='li' key={`home-step-item-${ind}`} delay={ind * 110}>
              <span>{toPersianNumerals(ind + 1)}</span>
              <p>{step}</p>
            </Reveal>
          ))
        }
      </ul>
    </div>
  )
}

export default Steps
