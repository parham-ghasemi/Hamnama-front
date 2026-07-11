import './Leaderboard.scss';

/*
UPDATE:
  THE CURRENT USER SHOULD BE HIGHLIGHTED AND BE SCROLLED TO IN THE LEADER BOARD
  IF THEY ARE BELLOW 100 JUST SHOW THEM AT THE BOTTOM WITH THEIR CURRENT PLACEMENT
*/

const LEADERBOARD_DATA = [
  {
    id: '1',
    profileImage: '/rodeocover.png',
    name: 'سارا احمدی',
    level: 'الماسی',
    hours: 728,
  },
  {
    id: '2',
    profileImage: '/rodeocover.png',
    name: 'علی علوی',
    level: 'پلاتینیوم',
    hours: 512,
  },
  {
    id: '3',
    profileImage: '/rodeocover.png',
    name: 'رضا محمدی',
    level: 'طلایی',
    hours: 340,
  }
];

const toPersianDigits = (num: number | string) => {
  return num.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
};

const Leaderboard = () => {
  return (
    <div className='user-leaderboard'>
      <div className='user-leaderboard__blob' />
      <div className='user-leaderboard__list-container'>

        {/* Header Section */}
        <div className='user-leaderboard__list-container__header'>
          {/* Grouped Header Identity */}
          <div className='user-leaderboard__list-container__header__profile-group'>
            <div className='user-leaderboard__list-container__header__cell user-leaderboard__list-container__header__cell--image' />
            <div className='user-leaderboard__list-container__header__cell user-leaderboard__list-container__header__cell--name'>نام</div>
          </div>

          <div className='user-leaderboard__list-container__header__cell'>سطح</div>
          <div className='user-leaderboard__list-container__header__cell'>میزان تماشا</div>
          <div className='user-leaderboard__list-container__header__cell'>رتبه</div>
        </div>

        {/* Dynamic Body Section */}
        <div className='user-leaderboard__list-container__body-wrapper'>
          {LEADERBOARD_DATA.map((user, index) => (
            <div key={user.id} className='user-leaderboard__list-container__body-wrapper__row'>

              {/* Grouped Body Identity */}
              <div className='user-leaderboard__list-container__body-wrapper__row__profile-group'>
                <div className='user-leaderboard__list-container__body-wrapper__row__cell user-leaderboard__list-container__body-wrapper__row__cell--image-only'>
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className='user-leaderboard__list-container__body-wrapper__row__cell__avatar'
                  />
                </div>
                <div className='user-leaderboard__list-container__body-wrapper__row__cell user-leaderboard__list-container__body-wrapper__row__cell--name'>
                  <span className='user-leaderboard__list-container__body-wrapper__row__cell__text'>
                    {user.name}
                  </span>
                </div>
              </div>

              {/* Level Column */}
              <div className='user-leaderboard__list-container__body-wrapper__row__cell'>
                {user.level}
              </div>

              {/* Hours Watched Column */}
              <div className='user-leaderboard__list-container__body-wrapper__row__cell'>
                {toPersianDigits(user.hours)} ساعت
              </div>

              {/* Rank Column */}
              <div className='user-leaderboard__list-container__body-wrapper__row__cell'>
                {toPersianDigits(index + 1)}
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default Leaderboard;