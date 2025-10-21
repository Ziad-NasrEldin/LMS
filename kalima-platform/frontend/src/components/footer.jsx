import { useTranslation } from 'react-i18next';
import { Facebook, Instagram, Twitter, Linkedin, Music2,Youtube } from 'lucide-react';
import { Link } from "react-router-dom";

export default function Footer() {
  const { t, i18n } = useTranslation("footer");
  const isRTL = i18n.language === 'ar';

  return (
    <footer className="py-10" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h3 className="text-xl font-bold mb-4">{t('contact')}</h3>
            <p className="mb-2">01027314148</p>
            <h4 className="text-lg font-bold mb-2">{t('followUs')}</h4>
            <div className='flex gap-4 '>
              <a href="https://www.facebook.com/kalima010" target="_blank" rel="noopener noreferrer">
                <Facebook className="w-5 h-5 hover:text-blue-600 transition-colors" />
              </a>
              <a target="_blank" rel="noopener noreferrer">
                <Instagram className="w-5 h-5 hover:text-pink-500 transition-colors" />
              </a>
              <a href="https://www.youtube.com/@kalima1" target="_blank" rel="noopener noreferrer">
                <Youtube className="w-5 h-5 hover:text-red-500 transition-colors" />
              </a>
              <a target="_blank" rel="noopener noreferrer">
                <Twitter className="w-5 h-5 hover:text-blue-400 transition-colors" />
              </a>
              <a target="_blank" rel="noopener noreferrer">
                <Music2 className="w-5 h-5 hover:text-pink-500 transition-colors" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className={isRTL ? 'text-right' : 'text-left'}>
            {/* <h3 className="text-xl font-bold mb-4">{t('links')}</h3> */}
            <ul className="space-y-2">
              <li><Link to='/'>{t('home')}</Link></li>
              <li><Link to='/courses'>{t('courses')}</Link></li>
              <li><Link to='/teachers'>{t('teachers')}</Link></li>
              <li><Link to='/packages'>{t('services')}</Link></li>
            </ul>
          </div>

          {/* About */}
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <div className="flex justify-center mb-4">
              <img src="/Kalima.png" alt="Kalima Logo" className="h-10" />
            </div>
            <p className="text-base font-semibold mb-4">
              {t('aboutText')}
            </p>
          </div>
        </div>

        <div className="text-center mt-8 pt-4 border-t border-base-300 "dir='ltr'>
          <p className="text-sm">
            @Copyright 2025 <Link className="text-primary" to={'/'}>Kalima</Link> | Developed by <Link className="text-primary" to={'/'}>Kalima</Link> team, All rights reserved.
          </p>
          <p className='font-bold text-sm'><Link to={"/privacy-policy"} className='underline text-blue-600'>Privacy Policy</Link></p>
        </div>
      </div>
    </footer>
  );
}