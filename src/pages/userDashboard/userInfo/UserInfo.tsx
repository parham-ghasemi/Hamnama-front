import { PiCameraLight } from 'react-icons/pi';
import { IoPencilSharp } from "react-icons/io5";
import './UserInfo.scss';

const UserInfo = () => {
  const info = {
    username: 'parham',
    phonenumber: '0900000000',
  }

  return (
    <div className='user-info'>
      <div className="user-info__blob" />

      <div className="user-info__top-card">
        <div className="user-info__top-card__right">
          <div className="user-info__top-card__right__img">
            <img src="/rodeocover.png" alt="profile image" />
            <span>
              <PiCameraLight />
            </span>
          </div>
          <div className="user-info__top-card__right__subinfo">
            <p>وضعیت اشتراک</p>
            <span>اشتراک ندارید</span>
          </div>
        </div>

        <div className="user-info__top-card__left">
          <button>خرید اشتراک</button>
        </div>
      </div>

      <div className="user-info__info-card">
        {
          ["نام کاربری", "شماره موبایل", "رمز عبور"].map((item, ind) => (
            <div className="user-info__info-card__section" key={`userinfosection${ind}`}>
              <div className="user-info__info-card__section__right">
                <p>{item}</p>
                <span>
                  {
                    ind === 0 ? info.username : ind === 1 ? info.phonenumber : "•••••••••••••"
                  }
                </span>
              </div>

              <div className="user-info__info-card__section__left">
                <button>
                  <IoPencilSharp />
                  ویرایش {item}
                </button>
              </div>
            </div>
          ))
        }
      </div>

      <div className="user-info__chart-container">
        LINE CHART
      </div>
    </div>
  )
}

export default UserInfo