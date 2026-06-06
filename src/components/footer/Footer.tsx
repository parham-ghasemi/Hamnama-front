import './Footer.scss';
import { PiFacebookLogoFill, PiInstagramLogoFill, PiPinterestLogoFill, PiTelegramLogoFill } from "react-icons/pi"

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
          <li>درباره ما</li>
          <li>گزارش مشکل</li>
        </ul>

        <div className="footer__social">
          <p className="footer__section-title">مارا در شبکات اجتماعی دنبال کنید :</p>
          <div className="footer__social-links">
            <PiInstagramLogoFill />
            <PiTelegramLogoFill />
            <PiFacebookLogoFill />
            <PiPinterestLogoFill />
          </div>
        </div>
      </div>

      <div className="footer-rights">
        © 2026 هم نما . تمامی حقوق محفوظ است.
      </div>
    </div>
  )
}

export default Footer