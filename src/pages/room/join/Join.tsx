import { BsPlusLg } from 'react-icons/bs';
import Header from '../../../components/header/Header';
import './Join.scss';
import Sidebar from './sidebar/Sidebar';
import { IoCopyOutline } from 'react-icons/io5';
import { PiFilmSlateFill, PiUsersThreeFill, PiClockCounterClockwiseFill, PiPlayFill } from 'react-icons/pi';
import CreateRoomModal from './createRoomModal/CreateRoomModal';
import { useState } from 'react';
import { joinRoom } from '../../../apiCalls/roomApi';
import { useNavigate } from 'react-router-dom';


const Join = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState<number | string>("")
  const nav = useNavigate()

  const handleJoin = async () => {
    const data = await joinRoom(Number(code))
    nav(`/room/${data.id}`)
  }

  return (
    <div className='join-page'>
      <Header />

      <div className="join-page__content">

        <Sidebar />

        <div className="join-page__content__main">

          <div className="join-page__content__main__blob" />

          <div className="join-page__content__main__inner">

            <div className="join-page__content__main__intro">
              <h1 className="join-page__content__main__intro__title">
                یک <span>اتاق سینمایی</span> انتخاب کنید
              </h1>
              <p className="join-page__content__main__intro__sub">
                وارد اتاق شخصی خود شوید، به اتاق دوستانتان بپیوندید یا اتاق تازه‌ای بسازید.
              </p>
            </div>

            <div className="join-page__content__main__cards">
              <div className="join-page__content__main__cards__card">
                <span className="join-page__content__main__cards__card__badge" aria-hidden="true">
                  <PiFilmSlateFill />
                </span>

                <h4>اتاق شخصی</h4>

                <div className="join-page__content__main__cards__card__i">
                  <span className="join-page__content__main__cards__card__i__screen" aria-hidden="true">
                    <PiPlayFill />
                  </span>
                </div>

                <div className="join-page__content__main__cards__card__code">
                  کد شما: ---
                  <span>
                    <IoCopyOutline />
                  </span>
                </div>

                <button className="join-page__content__main__cards__card__enter">ورود</button>
              </div>

              <div className="join-page__content__main__cards__card">
                <span className="join-page__content__main__cards__card__badge" aria-hidden="true">
                  <PiUsersThreeFill />
                </span>

                <h4>تماشا با دیگران</h4>

                <div className="join-page__content__main__cards__card__i">
                  <span className="join-page__content__main__cards__card__i__screen" aria-hidden="true">
                    <PiUsersThreeFill />
                  </span>
                </div>

                <div className="join-page__content__main__cards__card__code__wrapper">
                  <input className="join-page__content__main__cards__card__code" type='text' placeholder='کد اتاق' value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} />
                  <span onClick={() => navigator.clipboard.writeText(String(code))}>
                    <IoCopyOutline />
                  </span>
                </div>
                <button className="join-page__content__main__cards__card__enter" onClick={handleJoin}>پیوستن</button>
              </div>

              {/* Last visited room — UI only for now, no data wired up yet. */}
              <div className="join-page__content__main__cards__last">
                <span className="join-page__content__main__cards__last__icon" aria-hidden="true">
                  <PiClockCounterClockwiseFill />
                </span>

                <div className="join-page__content__main__cards__last__info">
                  <p className="join-page__content__main__cards__last__info__label">آخرین اتاق شما</p>
                  <p className="join-page__content__main__cards__last__info__name">
                    اتاق پرهام
                    <span className="join-page__content__main__cards__last__info__code">۴۵۲۹۱۸</span>
                  </p>
                </div>

                <button className="join-page__content__main__cards__last__action" type="button" disabled>
                  بازگشت به اتاق
                </button>
              </div>

              <div className="join-page__content__main__cards__card--create" onClick={() => setIsModalOpen(true)}>
                <p>ساخت اتاق شخصی</p>
                <span><BsPlusLg strokeWidth={1} /></span>
              </div>
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
