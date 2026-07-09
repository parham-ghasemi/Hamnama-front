import './Payments.scss';

// Fake data array structured to mimic your rows
const PAYMENTS_DATA = [
  {
    id: '001',
    date: '1404/10/22',
    planType: { title: 'پلن کاپلی', duration: 'یک ماهه' },
    amount: '۱۰۹،۰۰۰ تومان',
    status: 'پرداخت شده',
  },
  {
    id: '002',
    date: '1404/10/22',
    planType: { title: 'پلن کاپلی', duration: 'یک ماهه' },
    amount: '۱۰۹،۰۰۰ تومان',
    status: 'پرداخت نشده',
  }
];

const Payments = () => {
  return (
    <div className='user-payments'>
      <div className='user-payments__blob' />
      <div className='user-payments__list-container'>

        {/* Header Section */}
        <div className='user-payments__list-container__header'>
          <div className='user-payments__list-container__header__cell'>تاریخ سفارش</div>
          <div className='user-payments__list-container__header__cell'>نوع سفارش</div>
          <div className='user-payments__list-container__header__cell'>شماره سفارش</div>
          <div className='user-payments__list-container__header__cell'>مبلغ پرداختی</div>
          <div className='user-payments__list-container__header__cell'>وضعیت پرداخت</div>
        </div>

        {/* Dynamic Body Section */}
        <div className='user-payments__list-container__body-wrapper'>
          {PAYMENTS_DATA.map((payment) => (
            <div key={payment.id} className='user-payments__list-container__body-wrapper__row'>

              <div className='user-payments__list-container__body-wrapper__row__cell'>
                {payment.date}
              </div>

              <div className='user-payments__list-container__body-wrapper__row__cell'>
                <span className='user-payments__list-container__body-wrapper__row__cell__text'>
                  {payment.planType.title}
                </span>
                {payment.planType.duration}
              </div>

              <div className='user-payments__list-container__body-wrapper__row__cell'>
                {payment.id}
              </div>

              <div className='user-payments__list-container__body-wrapper__row__cell'>
                {payment.amount}
              </div>

              {/* Conditional Tailwind utility class applied here */}
              <div className={`user-payments__list-container__body-wrapper__row__cell ${payment.status === 'پرداخت نشده' ? 'red' : 'green'
                }`}>
                {payment.status}
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default Payments;