import { Link } from 'react-router-dom';
import './Footer.scss';
import { PiInstagramLogoFill, PiTelegramLogoFill } from "react-icons/pi"
import { SiGmail } from "react-icons/si";


const Footer = () => {
  return (
    <div className="footer-container">
      <div className="footer">
        <ul className="footer__quick">
          <p className="footer__section-title">دسترسی سریع</p>

          <li>امکانات</li>
          <li>پلن ها</li>
          <li>آموزش</li>
        </ul>
        <ul className="footer__useful">
          <p className="footer__section-title">لینک های مفید</p>

          <li>سوالات متداول</li>
          <li>دانلود برنامه</li>
          <li>قوانین هم‌نما</li>
        </ul>
        <ul className="footer__contact">
          <p className="footer__section-title">لینک های مفید</p>

          <li>پشتیبانی</li>
          <li>
            <Link to={"/about-us"}>
              درباره ما
            </Link>
          </li>
          <li>گزارش مشکل</li>
        </ul>

        <div className="footer__social">
          <p className="footer__section-title">مارا در شبکات اجتماعی دنبال کنید :</p>
          <div className="footer__social-links">

            <PiInstagramLogoFill style={{ fill: "#bf3058" }} />
            <PiTelegramLogoFill style={{ fill: "#2e84c7" }} />
            <SiGmail style={{ fill: "#d04e2f" }} />
            <img src='/bale.png' />
          </div>
        </div>
      </div>

      <div className="footer-rights">
        © 2026 هم‌نما . تمامی حقوق محفوظ است.
      </div>
    </div>
  )
}

export default Footer