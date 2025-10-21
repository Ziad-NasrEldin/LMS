import React from "react";
import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";

function CourseSection() {
  const { t, i18n } = useTranslation("coursesDashboard");
  const isRTL = i18n.language === "ar";

  // Category IDs and static data
  const categories = [
    { id: 1, icon: "https://cdn-icons-png.flaticon.com/512/2695/2695395.png" },
    { id: 2, icon: "https://cdn-icons-png.flaticon.com/512/2964/2964300.png" },
    { id: 3, icon: "https://cdn-icons-png.flaticon.com/512/3048/3048127.png" },
    { id: 4, icon: "https://cdn-icons-png.flaticon.com/512/3898/3898082.png" },
    { id: 5, icon: "https://cdn-icons-png.flaticon.com/512/2933/2933245.png" },
    { id: 6, icon: "https://cdn-icons-png.flaticon.com/512/3899/3899618.png" },
    { id: 7, icon: "https://cdn-icons-png.flaticon.com/512/2936/2936886.png" },
    { id: 8, icon: "https://cdn-icons-png.flaticon.com/512/3424/3424655.png" },
    { id: 9, icon: "https://cdn-icons-png.flaticon.com/512/2936/2936881.png" },
    { id: 10, icon: "https://cdn-icons-png.flaticon.com/512/2936/2936883.png" }
  ];

  return (
    <section
      className="relative py-8 md:py-16 bg-base-100"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="container mx-auto px-2 sm:px-4 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 md:mb-12"
        >
          <h2 className="text-xl md:text-3xl font-bold text-base-content mb-1 md:mb-2">
            {t("courseSection.sectionTitle")}
          </h2>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <p className="text-base-content/70 text-sm md:text-lg">
              {t("courseSection.sectionSubtitle")}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.05,
                type: "spring",
                stiffness: 100,
              }}
              whileHover={{
                y: -5,
                boxShadow: "0 5px 15px -5px rgba(0, 0, 0, 0.1)",
              }}
              className="bg-base-100 rounded-xl shadow-sm hover:shadow-md p-3 text-center transition-all duration-300 border border-base-200/50 hover:border-primary/20"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 rounded-full bg-primary/5 flex items-center justify-center p-1 sm:p-2"
              >
                <img
                  src={category.icon}
                  alt={t(`courseSection.categories.${category.id}`)}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </motion.div>
              <h3 className="font-bold text-base-content mb-1 text-sm sm:text-base md:text-lg">
                {t(`courseSection.categories.${category.id}`)}
              </h3>
              <p className="text-xs sm:text-sm text-base-content/70">
                38 {t("courseSection.courseCount")}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CourseSection;