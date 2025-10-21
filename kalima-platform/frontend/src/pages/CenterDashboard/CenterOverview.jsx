import { useTranslation } from "react-i18next";
import { MapPin, Users, Calendar, BookOpen } from 'lucide-react';

const CenterOverview = ({ center, lecturersCount, studentsCount, lessonsCount }) => {
  const { t, i18n } = useTranslation("centerDashboard");
  const isRTL = i18n.language === "ar";
  
  // Format date to be more readable
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  return (
    <div className="bg-base-100 rounded-lg shadow-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{center.name}</h1>
          <div className="flex items-center mt-2 text-base-content/70">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{center.location}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="stat bg-base-200 rounded-lg p-4 min-w-[120px]">
            <div className="stat-figure text-primary">
              <Users className="w-8 h-8" />
            </div>
            <div className="stat-title">{t('centerOverview.lecturers')}</div>
            <div className="stat-value">{lecturersCount}</div>
          </div>
          
          <div className="stat bg-base-200 rounded-lg p-4 min-w-[120px]">
            <div className="stat-figure text-primary">
              <Users className="w-8 h-8" />
            </div>
            <div className="stat-title">{t('centerOverview.students')}</div>
            <div className="stat-value">{studentsCount}</div>
          </div>
          
          <div className="stat bg-base-200 rounded-lg p-4 min-w-[120px]">
            <div className="stat-figure text-primary">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="stat-title">{t('centerOverview.courses')}</div>
            <div className="stat-value">{lessonsCount}</div>
          </div>
          
          <div className="stat bg-base-200 rounded-lg p-4 min-w-[120px]">
            <div className="stat-figure text-primary">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="stat-title">{t('centerOverview.created')}</div>
            <div className="stat-desc text-base font-medium">{formatDate(center.createdAt)}</div>
          </div>
        </div>
      </div>
      
      <div className="divider"></div>
    </div>
  );
};

export default CenterOverview;