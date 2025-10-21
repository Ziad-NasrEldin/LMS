import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FileText, Clock, Star } from "lucide-react";
import { useTranslation } from 'react-i18next';

function TeacherCard({ teacher }) {
  const { t, i18n } = useTranslation("home");
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  return (
    <motion.div
      className="rounded-lg overflow-hidden hover:scale-105 hover:shadow-xl shadow-lg duration-500"
      whileHover={{ scale: 1.05 }}
      
    >
      <div className="relative">
        <img
          src={teacher.image || "/placeholder.svg"}
          alt={`${t('alts.teacherProfile')} ${teacher.name}`}
          className="w-full h-48 object-cover"
        />
        <div className={`absolute top-2 ${isRTL ? 'right-2' : 'left-2'} bg-primary text-white text-xs px-2 py-1 rounded-full`}>
          {t(`${teacher.subject}`)}
        </div>
      </div>
      <div className="p-4">
        <h4 className={`font-bold text-lg mb-2 text-left`}>
          {teacher.name}
        </h4>
        
        {/* Experience */}
        <div className={`flex  items-center gap-2 mb-2`}>
          
          <div className="w-6 h-6 rounded-full bg-base-200 flex items-center justify-center">
            <Clock className="h-3 w-3" />
          </div>
          <span className="text-sm">{t(`${teacher.experience}`)}</span>
        </div>

        {/* Grade */}
        <div className={`flex items-center gap-2 mb-4`}>
          
          <div className="w-6 h-6 rounded-full bg-base-200 flex items-center justify-center">
            <FileText className="h-3 w-3" />
          </div>
          <span className="text-sm">{teacher.grade}</span>
        </div>

        {/* Rating and Button */}
        <div className="flex items-center justify-between">
          <div className="flex">
            {[...Array(teacher.rating)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-warning text-warning" />
            ))}
          </div>
          <button 
            className={`btn btn-sm btn-primary rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}
            onClick={() => navigate(`/teacher-details/${teacher.id}`)}
          >
            {t('buttons.viewDetails')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default TeacherCard;