import { BsPlusLg } from 'react-icons/bs';
import Header from '../../../components/header/Header';
import './Join.scss';
import Sidebar from './sidebar/Sidebar';
import { IoCopyOutline } from 'react-icons/io5';
import CreateRoomModal from './createRoomModal/CreateRoomModal';
import { useState } from 'react';

const Join = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
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

            <div className="join-page__content__main__cards__card--create" onClick={() => setIsModalOpen(true)}>
              <p>ساخت اتاق شخصی</p>
              <span><BsPlusLg strokeWidth={1} /></span>
            </div>
          </div>
        </div>
      </div>

      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default Join