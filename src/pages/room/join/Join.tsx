import { BsPlusLg } from 'react-icons/bs';
import Header from '../../../components/header/Header';
import './Join.scss';
import Sidebar from './sidebar/Sidebar';
import { IoCopyOutline } from 'react-icons/io5';

const Join = () => {
  return (
    <div className='join-page'>
      <Header />

      <div className="join-page__content">

        <Sidebar />

        <div className="join-page__content__main">

          <div className="join-page__content__main__blob" />

          <div className="join-page__content__main__cards">
            <div className="join-page__content__main__cards__card">
              <h4>اتاق شخصی</h4>

              <div className="join-page__content__main__cards__card__i"></div>

              <div className="join-page__content__main__cards__card__code">
                کد شما: ---
                <span>
                  <IoCopyOutline />
                </span>
              </div>

              <button className="join-page__content__main__cards__card__enter">ورود</button>
            </div>

            <div className="join-page__content__main__cards__card">
              <h4>تماشا با دیگران</h4>

              <div className="join-page__content__main__cards__card__i"></div>

              <input className="join-page__content__main__cards__card__code" type='text' placeholder='کد اتاق' />

              <button className="join-page__content__main__cards__card__enter">پیوستن</button>
            </div>

            <div className="join-page__content__main__cards__card--create">
              <p>ساخت اتاق شخصی</p>
              <span><BsPlusLg strokeWidth={1} /></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Join