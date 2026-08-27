import './Footer.scss';
import { PiInstagramLogoFill, PiTelegramLogoFill } from 'react-icons/pi';
import { SiGmail } from 'react-icons/si';

// Only links that actually point somewhere are kept.
// In the host app (react-router-dom) you can swap <a> for <Link to={...}>.
const LINKS = [
  { href: '/#faq', label: 'سوالات متداول' },
  { href: '/about-us', label: 'درباره ما' },
  { href: '/about-us#contact', label: 'تماس با ما' },
];

// TODO: replace '#' with the real profile URLs.
const SOCIALS = [
  { href: '#', label: 'اینستاگرام', icon: <PiInstagramLogoFill /> },
  { href: '#', label: 'تلگرام', icon: <PiTelegramLogoFill /> },
  { href: '#', label: 'جیمیل', icon: <SiGmail /> },
];

const Footer = () => {
  return (
    <footer className="site-footer" dir="rtl">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__logo">
            <img src="/logo/transparentBg/hamnama1-8-08-cropped.png" alt="" />
          </span>
          <span className="site-footer__tagline">تماشای فیلم و سریال، کنار هم</span>
        </div>

        <nav className="site-footer__nav" aria-label="لینک‌های فوتر">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="site-footer__link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="site-footer__socials">
          {SOCIALS.map((s) => (
            <a key={s.label} href={s.href} aria-label={s.label} className="site-footer__social">
              {s.icon}
            </a>
          ))}
          <a href="#" aria-label="بله" className="site-footer__social">
            <img src="/bale.png" alt="بله" />
          </a>
        </div>
      </div>

      <div className="site-footer__rights">© 2026 هم‌نما — تمامی حقوق محفوظ است.</div>
    </footer>
  );
};

export default Footer;
