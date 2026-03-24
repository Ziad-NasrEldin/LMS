import { useState } from "react";
import Hero from "./hero";
import UserManagementTable from "./userManageTable";
import PromoCodeGenerator from "./PromoCodesGenerator";
import { FaWhatsapp } from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import PromoCodesTable from "./PromoCodesTable";
import LecturerRevenue from "./LecturerRevenue";
import { designTokens } from "../../../../constants/designTokens";

const AdminDashboard = () => {
  const { t, i18n } = useTranslation('admin');
  const [isOpen, setIsOpen] = useState(true);
  const [whatsappModal, setWhatsappModal] = useState({
    isOpen: false,
    phoneNumber: "",
    message: "",
  });

  const TOKENS = designTokens.colors;
  const SHADOWS = designTokens.shadows;
  const GRADIENTS = designTokens.gradients;

  const isRTL = i18n.language === 'ar'; 
  const dir = isRTL ? 'rtl' : 'ltr';

  const openWhatsappModal = () => {
    setWhatsappModal({
      isOpen: true,
      phoneNumber: "",
      message: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setWhatsappModal(prev => ({ ...prev, [name]: value }));
  };

  const sendWhatsappMessage = () => {
    const { phoneNumber, message } = whatsappModal;

    if (!phoneNumber) {
      alert(t('admin.errors.phoneRequired'));
      return;
    }

    let formattedNumber = phoneNumber.replace(/\D/g, "");
    if (!formattedNumber.startsWith("2")) {
      formattedNumber = "2" + formattedNumber;
    }

    const whatsappUrl = `https://wa.me/${formattedNumber}${
      message ? `?text=${encodeURIComponent(message)}` : ""
    }`;

    window.open(whatsappUrl, "_blank");
    setWhatsappModal({ isOpen: false, phoneNumber: "", message: "" });
  };

  return (
    <div 
      className="relative mx-auto w-full max-w-full p-6 md:p-10 min-h-screen font-[Cairo]" 
      dir={dir}
      style={{ background: TOKENS.creamSurface, color: TOKENS.inkText }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-50" style={{ background: GRADIENTS.pageAtmosphere }} />

      <div className="transition-all duration-300 space-y-8 relative z-10">
        <Hero />
        <LecturerRevenue />
        <PromoCodeGenerator />
        <PromoCodesTable />
        <UserManagementTable />
        
        <div className="flex justify-center flex-col items-center pb-36 max-sm:pt-20 gap-4 mt-12">
          <div className="flex items-center gap-4">
            <a target="_blank" href="https://api.whatsapp.com/send/?phone=01279614767&text&type=phone_number&app_absent=0" 
               rel="noreferrer"
               className="transition-transform hover:scale-110">
              <img alt="whatsapp" src="/whatsApp.png" className="w-14 max-sm:w-16 drop-shadow-md" />
            </a>
            <img alt="arrow" src="/AdminA.png" className="w-36 hidden md:block opacity-80 mix-blend-multiply" />
          </div>

          <button 
            className="flex items-center justify-center gap-2 w-48 py-3 rounded-full font-bold text-white transition-transform hover:-translate-y-1" 
            style={{ background: GRADIENTS.hero, boxShadow: SHADOWS.level1 }}
            onClick={openWhatsappModal}
          >
            <FaWhatsapp className="w-5 h-5" />
            {t('admin.sendOffer')}
          </button>
        </div>

        {/* Decorative elements */}
        <div className="pointer-events-none">
          <img alt="" src="/rDots.png" 
               className="absolute h-32 w-20 left-16 bottom-20 max-sm:left-0 animate-float-up-dottedball opacity-40 mix-blend-multiply" />
        </div>
        <div className="pointer-events-none">
          <img alt="" src="/bDots.png" 
               className="absolute h-32 w-20 right-16 bottom-44 max-sm:bottom-72 max-sm:right-0 animate-float-down-dottedball opacity-40 mix-blend-multiply" />
        </div>

        {/* WhatsApp Modal */}
        {whatsappModal.isOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div 
              className="p-6 md:p-8 rounded-[2rem] w-full max-w-md max-h-[90vh] overflow-y-auto" 
              dir={dir}
              style={{ background: TOKENS.neutralCloud, boxShadow: SHADOWS.level2, border: "1px solid rgba(17,24,39,0.08)" }}
            >
              <h3 className="text-2xl font-bold mb-6" style={{ color: TOKENS.deepTeal }}>
                {t('admin.whatsappModal.title')}
              </h3>
              
              <div className="mb-5">
                <label className="block mb-2 text-sm font-semibold opacity-80">{t('admin.whatsappModal.phoneLabel')}</label>
                <input
                  type="text"
                  name="phoneNumber"
                  className="w-full px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-[#4DB3C2] transition-all bg-white"
                  style={{ border: "1px solid rgba(17,24,39,0.1)", color: TOKENS.inkText }}
                  placeholder={t('admin.whatsappModal.phonePlaceholder')}
                  value={whatsappModal.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="mb-6">
                <label className="block mb-2 text-sm font-semibold opacity-80">{t('admin.whatsappModal.messageLabel')}</label>
                <textarea
                  name="message"
                  className="w-full px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-[#4DB3C2] transition-all bg-white h-32 resize-none"
                  style={{ border: "1px solid rgba(17,24,39,0.1)", color: TOKENS.inkText }}
                  placeholder={t('admin.whatsappModal.messagePlaceholder')}
                  value={whatsappModal.message}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-3 mt-8">
                <button
                  className="px-6 py-2.5 rounded-full font-semibold transition-all hover:bg-black/5"
                  style={{ color: TOKENS.slateText }}
                  onClick={() => setWhatsappModal({ isOpen: false, phoneNumber: "", message: "" })}
                >
                  {t('admin.whatsappModal.cancel')}
                </button>
                <button 
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-white transition-transform hover:-translate-y-[1px]"
                  style={{ background: TOKENS.warmMango, boxShadow: SHADOWS.level1 }}
                  onClick={sendWhatsappMessage}
                >
                  <FaWhatsapp className="w-5 h-5" /> 
                  {t('admin.whatsappModal.send')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;