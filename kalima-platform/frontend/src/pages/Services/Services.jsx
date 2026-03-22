import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { motion } from "framer-motion";

import { AppDownloadSection } from "./app-download-section";
import WelcomeSection from "./WelcomeSection";
import BenefitsSection from "./BenefitsSection";
import AboutSection from "./AboutSection";
import ServicesGrid from "./ServicesGrid";
import ExamPreparationSection from "./ExamPreparationSection";
import CoursesOverviews from "./CoursesOverview";
import { TeachersSection } from "./teachers-section";
import { CoursesSection } from "./courses-section";

// Utility functions
const staggerContainer = (staggerChildren, delayChildren) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: staggerChildren || 0.1,
      delayChildren: delayChildren || 0,
    },
  },
});

const Services = () => {
  const { t, i18n } = useTranslation("home");
  const isRTL = i18n.language === "ar";
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Auto-rotation effect for testimonials
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3); // Assuming 3 testimonials
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  return (
    <motion.section
      variants={staggerContainer()}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -100px 0px" }}
      className="bg-gradient-to-b from-base-100 to-base-200 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto">
        <WelcomeSection isRTL={isRTL} t={t} />
        <BenefitsSection isRTL={isRTL} />
        <AboutSection isRTL={isRTL} />
        <AppDownloadSection />
        <ServicesGrid isRTL={isRTL} />
        <ExamPreparationSection isRTL={isRTL} />
        <CoursesSection isRTL={isRTL} />
        <TeachersSection isRTL={isRTL} />
        <CoursesOverviews isRTL={isRTL} />
      </div>
    </motion.section>
  );
};

export default Services;
