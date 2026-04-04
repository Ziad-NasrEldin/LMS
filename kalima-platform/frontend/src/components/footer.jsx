import { useTranslation } from 'react-i18next';
import { Facebook, Instagram, Twitter, Linkedin, Music2, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from "react-router-dom";
import { designTokens } from "../constants/designTokens";

export default function Footer() {
  const { t, i18n } = useTranslation("footer");
  const isRTL = i18n.language === 'ar';
  
  const TOKENS = designTokens.colors;

  return (
    <footer 
      className="relative mt-20 overflow-hidden border-t" 
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        background: TOKENS.creamSurface,
        borderColor: TOKENS.lightAquaMist,
        color: TOKENS.inkText,
      }}
    >
      <div className="container mx-auto px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          
          {/* Brand & About */}
          <div className={`col-span-1 space-y-6 ${isRTL ? 'lg:pl-8' : 'lg:pr-8'} md:col-span-2 lg:col-span-1`}>
            <div className={`flex items-center ${isRTL ? 'justify-start' : 'justify-start'}`}>
              <img src="/Fekra.png" alt="Fekra Logo" className="h-12 w-auto object-contain" />
            </div>
            <p className="text-sm leading-relaxed opacity-80 max-w-sm">
              {t('aboutText')}
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Facebook, href: "https://www.facebook.com/kalima010", color: "hover:text-blue-600" },
                { icon: Instagram, href: "#", color: "hover:text-pink-600" },
                { icon: Youtube, href: "https://www.youtube.com/@kalima1", color: "hover:text-red-500" },
                { icon: Twitter, href: "#", color: "hover:text-blue-400" },
                { icon: Music2, href: "#", color: "hover:text-black" },
              ].map((Social, idx) => (
                <a
                  key={idx}
                  href={Social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 hover:-translate-y-1 ${Social.color}`}
                  style={{ 
                    borderColor: TOKENS.lightAquaMist, 
                    background: TOKENS.neutralCloud 
                  }}
                >
                  <Social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className={isRTL ? 'lg:pr-12' : 'lg:pl-12'}>
            <h3 className="mb-6 text-lg font-bold" style={{ color: TOKENS.deepTeal }}>
              {isRTL ? 'روابط سريعة' : 'Quick Links'}
            </h3>
            <ul className="space-y-4 text-sm font-medium">
              {[
                { name: t('home'), path: '/' },
                { name: t('courses'), path: '/courses' },
                { name: t('teachers'), path: '/teachers' },
                { name: t('privacyPolicy'), path: '/privacy-policy', isStatic: true },
              ].map((link, idx) => (
                <li key={idx}>
                  <Link 
                    to={link.path} 
                    className="inline-block transition-transform hover:translate-x-1 opacity-80 hover:opacity-100"
                    style={{ color: TOKENS.inkText }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="md:col-span-2 lg:col-span-2">
            <h3 className="mb-6 text-lg font-bold" style={{ color: TOKENS.deepTeal }}>{t('contact')}</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3 opacity-80">
                <Phone className="mt-1 h-5 w-5 shrink-0" style={{ color: TOKENS.warmMango }} />
                <a 
                  href="tel:+201027314148" 
                  className="font-medium hover:underline transition-colors"
                  style={{ color: TOKENS.inkText }}
                  dir="ltr"
                >
                  +20 102 731 4148
                </a>
              </li>
              <li className="flex items-start gap-3 opacity-80">
                <Mail className="mt-1 h-5 w-5 shrink-0" style={{ color: TOKENS.warmMango }} />
                <span>support@fekra-platform.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div 
          className="mt-16 flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm opacity-70 md:flex-row"
          style={{ borderColor: TOKENS.lightAquaMist }}
        >
          <p dir="ltr" className="text-center md:text-left">
            © {new Date().getFullYear()} <span className="font-bold" style={{ color: TOKENS.deepTeal }}>Fekra</span>. All rights reserved.
          </p>
          <p dir="ltr" className="text-center md:text-right">
            Developed by <span className="font-bold">Fekra Team</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
