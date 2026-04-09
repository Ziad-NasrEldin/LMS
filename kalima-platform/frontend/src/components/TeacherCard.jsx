import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FileText, Clock, Star } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { designTokens } from "../constants/designTokens";
import { buildTeacherPath } from "../seo/site.mjs";
import Button from "./ui/Button"

function TeacherCard({ teacher, isRTL }) {
  const { t, i18n } = useTranslation("teachers");
  const rtl = typeof isRTL === "boolean" ? isRTL : i18n.language === 'ar';
  const TOKENS = designTokens.colors;
  const SHADOWS = designTokens.shadows;
  const navigate = useNavigate();

  return (
    <motion.div
      className="h-full overflow-hidden rounded-[1.4rem] border bg-white transition-all duration-300 hover:-translate-y-[2px]"
      whileHover={{ scale: 1.05 }}
      style={{ borderColor: "rgba(17,24,39,0.08)", boxShadow: SHADOWS.level1 }}
    >
      <div className="relative">
        <img
          src={teacher.image || "/placeholder.svg"}
          alt={`${t('alts.teacherProfile')} ${teacher.name}`}
          className="w-full h-48 object-cover"
        />
        <div
          className={`absolute top-2 ${rtl ? 'right-2' : 'left-2'} text-xs px-3 py-1 rounded-full font-semibold`}
          style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}
        >
          {teacher.subject}
        </div>
      </div>
      <div className="p-4">
        <h4 className={`font-bold text-lg mb-3 ${rtl ? 'text-right' : 'text-left'}`} style={{ color: TOKENS.inkText }}>
          {teacher.name}
        </h4>
        
        {/* Experience */}
        <div className={`flex items-center gap-2 mb-2 ${rtl ? 'flex-row-reverse justify-end' : ''}`}>
          
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#E8EEF7" }}>
            <Clock className="h-3 w-3" />
          </div>
          <span className="text-sm" style={{ color: TOKENS.slateText }}>{teacher.experience}</span>
        </div>

        {/* Grade */}
        <div className={`flex items-center gap-2 mb-4 ${rtl ? 'flex-row-reverse justify-end' : ''}`}>
          
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#F3F4F6" }}>
            <FileText className="h-3 w-3" />
          </div>
          <span className="text-sm" style={{ color: TOKENS.slateText }}>{teacher.grade}</span>
        </div>

        {/* Rating and Button */}
        <div className={`flex items-center justify-between ${rtl ? 'flex-row-reverse' : ''}`}>
          <div className="flex">
            {[...Array(teacher.rating)].map((_, i) => (
              <Star key={i} className="h-4 w-4" style={{ fill: TOKENS.goldenSand, color: TOKENS.goldenSand }} />
            ))}
          </div>
           <Button 
             size="sm" 
             className="rounded-full border-none"
             style={{ background: TOKENS.deepTeal, color: '#F8FCFF' }}
             onClick={() => navigate(buildTeacherPath({ _id: teacher.id, name: teacher.name }))}
           >
             {t('buttons.viewDetails')}
           </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default TeacherCard;
