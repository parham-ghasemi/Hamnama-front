import { BsPlusLg } from 'react-icons/bs';
import './PlanUsers.scss';

const PlanUsers = () => {
  const users = [
    {
      pfp: "",
      name: "Mamad",
      daysSinceJoined: 42,
    },
    {
      pfp: "",
      name: "Mehdi",
      daysSinceJoined: 42,
    },
    {
      pfp: "/rodeocover.png",
      name: "Kassraa",
      daysSinceJoined: 42,
    },
    {
      pfp: "",
      name: "Mamad",
      daysSinceJoined: 42,
    },
  ]
  return (
    <div className="plan-users">
      <div className="plan-users__cards">
        {
          users.map((user, ind) => (
            <div className="plan-users__cards__card" key={ind}>
              <div className="plan-users__cards__card__user-info">
                {
                  user.pfp ? (
                    <img src={user.pfp} alt={`${user.name}'s profile picture`} />
                  ) : (
                    <p>{user.name[0]}</p>
                  )
                }
                <span>{user.name}</span>
              </div>

              <div className="plan-users__cards__card__since">
                {`مدت مشترک شدن: ${user.daysSinceJoined} روز`}
              </div>

              <button className='plan-users__cards__card__kick'>اخراج کاربر</button>
            </div>
          ))
        }

        <div className="plan-users__cards__card plan-users__cards__card--add">
          <span className="plan-users__cards__card__add-icon">
            <BsPlusLg strokeWidth={1} />
          </span>
          <p className="plan-users__cards__card__add-text">افزودن کاربر</p>
        </div>
      </div>
    </div>
  )
}

export default PlanUsers