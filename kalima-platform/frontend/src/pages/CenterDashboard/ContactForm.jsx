import { useTranslation } from "react-i18next";

const ContactForm = () => {
  const { t, i18n } = useTranslation("centerDashboard");
  const isRTL = i18n.language === "ar";

  return (
    <div className="bg-base-100 rounded-lg p-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className={`block ${isRTL ? 'text-right' : 'text-left'} mb-2 font-medium`}>
            {t('contactForm.category')}
          </label>
          <select className="select select-bordered w-full">
            <option disabled selected>{t('contactForm.selectPlaceholder')}</option>
            {Object.entries(t('contactForm.categories', { returnObjects: true })).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block ${isRTL ? 'text-right' : 'text-left'} mb-2 font-medium`}>
            {t('contactForm.content')}
          </label>
          <select className="select select-bordered w-full">
            <option disabled selected>{t('contactForm.selectPlaceholder')}</option>
            {Object.entries(t('contactForm.contentTypes', { returnObjects: true })).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block ${isRTL ? 'text-right' : 'text-left'} mb-2 font-medium`}>
            {t('contactForm.grade')}
          </label>
          <select className="select select-bordered w-full">
            <option disabled selected>{t('contactForm.selectPlaceholder')}</option>
            {Object.entries(t('contactForm.grades', { returnObjects: true })).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className={`block ${isRTL ? 'text-right' : 'text-left'} mb-2 font-medium`}>
          {t('contactForm.level')}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="text" 
            placeholder={t('contactForm.placeholders.level')} 
            className="input input-bordered w-full" 
          />
          <input 
            type="text" 
            placeholder={t('contactForm.placeholders.subLevel')} 
            className="input input-bordered w-full" 
          />
          <input 
            type="text" 
            placeholder={t('contactForm.placeholders.details')} 
            className="input input-bordered w-full" 
          />
        </div>
      </div>

      <div className="mb-4">
        <label className={`block ${isRTL ? 'text-right' : 'text-left'} mb-2 font-medium`}>
          {t('contactForm.description')}
        </label>
        <textarea
          className="textarea textarea-bordered w-full h-24"
          placeholder={t('contactForm.placeholders.description')}
        ></textarea>
      </div>

      <div className="flex justify-between items-center">
        <button className="btn btn-outline">{t('contactForm.buttons.cancel')}</button>
        <button className="btn btn-primary">{t('contactForm.buttons.submit')}</button>
      </div>
    </div>
  )
}

export default ContactForm