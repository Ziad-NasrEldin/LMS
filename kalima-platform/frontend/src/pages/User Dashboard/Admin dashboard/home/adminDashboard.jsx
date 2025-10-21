import { useState } from "react";
import Hero from "./hero";
import UserManagementTable from "./userManageTable";
import PromoCodeGenerator from "./PromoCodesGenerator";
import { FaWhatsapp } from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import PromoCodesTable from "./PromoCodesTable";
import LecturerRevenue from "./LecturerRevenue";

const AdminDashboard = () => {
  const { t, i18n } = useTranslation('admin');
  const [isOpen, setIsOpen] = useState(true);
  const [whatsappModal, setWhatsappModal] = useState({
    isOpen: false,
    phoneNumber: "",
    message: "",
  });

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
    <div className="mx-auto w-full max-w-full p-10 bg-base-100 min-h-screen bg-gradient-to-br" dir={dir}>
      <div className="transition-all duration-300 space-y-8">
        <Hero />
        <LecturerRevenue />
        <PromoCodeGenerator />
        <PromoCodesTable />
        <UserManagementTable />
        
        <div className="flex justify-center items-center pb-36 max-sm:pt-20 rounded-3xl">
          <a target="_blank" href="https://api.whatsapp.com/send/?phone=01279614767&text&type=phone_number&app_absent=0" 
             rel="noreferrer">
            <img alt="arrow" src="/whatsApp.png" className="w-14 right-6 max-sm:w-16" />
          </a>
          <img alt="arrow" src="/AdminA.png" className="w-36" />

          <button className="btn btn-primary w-44 rounded-xl" onClick={openWhatsappModal}>
            {t('admin.sendOffer')}
          </button>
        </div>

        {/* Decorative elements */}
        <div className="relative">
          <img alt="" src="/rDots.png" 
               className="absolute h-32 w-20 left-16 bottom-20 max-sm:left-0 animate-float-up-dottedball" />
        </div>
        <div className="relative">
          <img alt="" src="/bDots.png" 
               className="absolute h-32 w-20 right-16 bottom-44 max-sm:bottom-72 max-sm:right-0 animate-float-down-dottedball" />
        </div>

        {/* WhatsApp Modal */}
        {whatsappModal.isOpen && (
          <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50">
            <div className=" bg-base-300 p-6 rounded-lg shadow-lg max-w-md w-full" dir={dir}>
              <h3 className="text-xl font-bold mb-4">{t('admin.whatsappModal.title')}</h3>
              <div className="mb-4">
                <label className="block mb-2 font-medium">{t('admin.whatsappModal.phoneLabel')}</label>
                <input
                  type="text"
                  name="phoneNumber"
                  className="input input-bordered w-full"
                  placeholder={t('admin.whatsappModal.phonePlaceholder')}
                  value={whatsappModal.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-medium">{t('admin.whatsappModal.messageLabel')}</label>
                <textarea
                  name="message"
                  className="textarea textarea-bordered w-full h-32"
                  placeholder={t('admin.whatsappModal.messagePlaceholder')}
                  value={whatsappModal.message}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="btn btn-ghost"
                  onClick={() => setWhatsappModal({ isOpen: false, phoneNumber: "", message: "" })}
                >
                  {t('admin.whatsappModal.cancel')}
                </button>
                <button className="btn btn-success gap-2" onClick={sendWhatsappMessage}>
                  <FaWhatsapp /> {t('admin.whatsappModal.send')}
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