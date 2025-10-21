import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ArrowUp, Star, Book } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { motion } from "framer-motion";

const RecommendedCourses = () => {
  const { t, i18n } = useTranslation("centerDashboard");
  const isRTL = i18n.language === "ar";
  const dir = isRTL ? "rtl" : "ltr";

  const [gradeFilter, setGradeFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");

  // Get translated reports data
  const reports = t('recommendedCourses.reports', { returnObjects: true });
  const gradeOptions = t('recommendedCourses.gradeOptions', { returnObjects: true });
  const sectionOptions = t('recommendedCourses.sectionOptions', { returnObjects: true });

  const filteredReports = reports.filter((report) => {
    const gradeMatch = !gradeFilter || report.class === gradeFilter;
    const sectionMatch = !sectionFilter || report.section.includes(sectionFilter);
    return gradeMatch && sectionMatch;
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <motion.div
      className="bg-base-100 p-6 min-h-screen"
      dir={dir}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.h1 className="text-2xl font-bold text-base-content mb-6" variants={itemVariants}>
        {t('recommendedCourses.title')}
      </motion.h1>

      <motion.div className={`flex flex-wrap gap-4 mb-8`} variants={itemVariants}>
        <div className="relative w-full md:w-56">
          <select
            className={`select select-bordered w-full ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"}`}
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
          >
            <option value="">{t('recommendedCourses.selectGrade')}</option>
            {gradeOptions.map((option, index) => (
              <option key={index} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ChevronDown className={`absolute ${isRTL ? "left-3" : "right-3"} top-1/2 transform -translate-y-1/2 h-4 w-4 text-base-content/70`} />
        </div>

        <div className="relative w-full md:w-56">
          <select
            className={`select select-bordered w-full ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"}`}
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
          >
            <option value="">{t('recommendedCourses.selectSection')}</option>
            {sectionOptions.map((option, index) => (
              <option key={index} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ChevronDown className={`absolute ${isRTL ? "left-3" : "right-3"} top-1/2 transform -translate-y-1/2 h-4 w-4 text-base-content/70`} />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
          <motion.div
            key={report.id}
            className="card bg-base-200 border border-primary-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="card-body p-6">
              <h2 className="card-title text-lg font-bold text-base-content mb-4">
                {t('recommendedCourses.reportTitle')}
              </h2>

              <div className="space-y-3 mb-2">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-base-content rounded-full mr-2"></span>
                  <p className="text-base-content font-medium">{report.name}</p>
                </div>
                <p className="text-base-content/80">{report.class}</p>
                <p className="text-base-content/80">{report.section}</p>
              </div>

              <div className="space-y-3 mb-2">
                {report.improvements.map((item, index) => (
                  <motion.div
                    key={index}
                    className={`flex items-start gap-2 ${isRTL ? "flex-row-reverse" : "flex-row"}`}
                    whileHover={{ x: isRTL ? -5 : 5 }}
                  >
                    {item.type === 'improvement' ? (
                      <ArrowUp className="h-4 w-4 text-success" />
                    ) : item.type === 'behavior' ? (
                      <Star className="h-4 w-4 text-warning" />
                    ) : (
                      <Book className="h-4 w-4 text-warning" />
                    )}
                    <p className="text-sm text-base-content/80">
                      {t(item.textKey, item.params)}
                    </p>
                  </motion.div>
                ))}
              </div>

              <motion.button
                className="btn btn-primary w-full mt-auto"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaWhatsapp className={`h-5 w-5 ${isRTL ? "ml-2" : "mr-2"}`} />
                {t('recommendedCourses.sendButton')}
              </motion.button>
            </div>
          </motion.div>
        ))}

        {filteredReports.length === 0 && (
          <motion.div className="col-span-full text-center py-4 text-base-content/70" variants={itemVariants}>
            {t('recommendedCourses.noReports')}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default RecommendedCourses;