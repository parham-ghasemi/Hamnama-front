import clsx from 'clsx';
import { useTheme } from '../../../context/ThemeContext';
import './Steps.scss';

const Steps = () => {
  const steps = ['ساخت حساب کاربری', "ساخت اتاق سینما", "انتخاب فیلم و تماشا"]
  const { isLight } = useTheme();
  return (
    <div className='home-steps'>
      <div className="home-steps__blob"></div>
      {/* 
      <div className="home-steps__right-bar">
        <span className='home-steps__right-bar__white-bar'></span>
        <span className='home-steps__right-bar__dot'></span>
        <span className='home-steps__right-bar__dot'></span>
        <span className='home-steps__right-bar__dot'></span>
      </div> */}


      <ul className="home-steps__steps-container">
        <div className={clsx("img", isLight && "img--light")}>
          <img
            src="/homepage/lightglowlights.png"
            className='light'
            alt=""
          />
          <img
            src="/homepage/glowlights.png"
            className='dark'
            alt=""
          />
        </div>
        {
          steps.map((step, ind) => (
            <li key={`home-step-item-${ind}`}>
              <span>{ind + 1}</span>
              <p>{step}</p>
            </li>
          ))
        }
      </ul>
    </div>
  )
}

export default Steps