import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, ChevronLeft, Users } from "lucide-react";
import { Plus, Clock, Heart, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

function AssistantsSection() {
  const { t, i18n } = useTranslation("coursesDashboard");
  const isRTL = i18n.language === "ar";
  const getImagePath = (id) => {
    const paths = {
      1: "1573497019940-1c28c88b4f3e",
      2: "1438761681033-6461ffad8d80",
      3: "1544725176-7c40e5a71c5e",
      4: "1544005313-94ddf0286df2",
      5: "1507003211169-0a1dd7228f2d",
      6: "1554151228-14d9def656e4"
    };
    return paths[id];
  };
  
  // Assistant IDs for mapping
  const assistantIds = [1, 2, 3, 4, 5, 6];

  return (
    <section
      className="relative py-8 md:py-16 bg-base-100"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Background pattern similar to TeachersSection */}
      <div className="absolute top-0 left-0 w-2/3 h-full pointer-events-none z-0 opacity-10">
        <img
          src="/background-courses.png"
          alt="background pattern"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="container mx-auto px-2 sm:px-4 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 gap-4 md:gap-6"
        >
          <div className="flex items-center gap-2 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-primary dark:text-primary-400" />
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-primary hover:text-primary-600">
              {isRTL ? "نخبه من المساعدين" : "Elite Assistants"}
              <span className="block h-1 w-12 md:w-16 mt-1 md:mt-2 bg-primary dark:bg-primary-400 rounded-full"></span>
            </h2>
          </div>

          <Link
            to="/assistants"
            className="flex items-center text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium text-xs sm:text-sm md:text-base transition-colors duration-300"
          >
            {isRTL ? "مشاهده الجميع" : "View All"}
            <ChevronLeft
              className={`h-3 w-3 sm:h-4 sm:w-4 ${isRTL ? "mr-1 sm:mr-2" : "ml-1 sm:ml-2 rotate-180"}`}
            />
          </Link>
        </motion.div>

        {/* Assistants Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        <AnimatePresence>
          {assistantIds.map((id, index) => {
            const assistant = t(`assistants.${id}`, { returnObjects: true });
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{
                  y: -5,
                  boxShadow: "0 5px 15px -5px rgba(0, 0, 0, 0.1)",
                }}
                className="bg-base-100 rounded-xl shadow-lg hover:shadow-lg transition-all duration-300 relative mt-16 sm:mt-20 md:mt-24"
              >
                {/* Assistant Image container */}
                <div className="absolute -top-12 sm:-top-16 md:-top-20 left-1/2 transform -translate-x-1/2 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40">
                  <div className="w-full h-full p-1 shadow-lg overflow-hidden">
                    <img
                      src={`https://images.unsplash.com/photo-${getImagePath(id)}?w=200&auto=format&fit=crop&q=80`}
                      alt={assistant.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Content container */}
                <div className="pt-16 sm:pt-20 md:pt-24 pb-4 sm:pb-6 px-4 sm:px-6 flex flex-col items-center text-center">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-base-content">
                    {assistant.name}
                  </h3>
                  <p className="text-base-content text-xs sm:text-sm md:text-base mb-2 sm:mb-4">
                    {assistant.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      </div>
    </section>
  );
}
export default AssistantsSection;