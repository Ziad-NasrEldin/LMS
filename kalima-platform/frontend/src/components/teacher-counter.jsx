import { useTranslation } from 'react-i18next';
import { Plus } from "lucide-react"

export default function TeacherCounter() {
  const { t, i18n } = useTranslation("home");
  const isRTL = i18n.language === 'ar';

  return (
    <div className={`rounded-3xl bg-primary-content w-56 md:w-full h-16 md:h-full shadow-lg px-4 py-3 flex items-center gap-3 `}
    dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Text Content */}
      <div className={`flex flex-col ${isRTL ? 'items-end' : 'items-start'}`}>
        <h2 className="text-primary text-xl font-bold">
          {t("teacherCount.title")}
        </h2>
        <div className="flex items-center gap-1">
          <span className="text-primary text-2xl font-bold">
            {t("teacherCount.counter")} <span className="text-primary text-2xl font-bold">+10</span>
          </span>
        </div>
      </div>
      

      {/* Teacher Avatars */}
      <div className={`flex ${isRTL ? '' : 'flex-row-reverse'}`}>
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="rounded-full overflow-hidden -ml-2 first:ml-0">
            <img 
              src="/teacher_illustration.png" 
              alt={t("teacherCount.counter", { count: index })} 
              className="w-8 h-8 object-cover text-primary" 
            />
          </div>
        ))}
      </div>

      {/* Add Button */}
      <button 
        className="btn rounded-full bg-primary hover:bg-accent text-primary-content"
        aria-label={t("teacherCount.add")}
      >
        <Plus size={16}  />
      </button>
    </div>
  )
}