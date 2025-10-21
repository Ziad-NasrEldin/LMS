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
import LanguageBooks from "./LanguageBooks";
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const books = useMemo(
    () => [
      { id: 1, title: "العلم جميع اللغات", image: "/Book.png" },
      { id: 2, title: "اللغة العربية", image: "/Book-1.png" },
      { id: 3, title: "اللغة الإنجليزية", image: "/Book-2.png" },
      { id: 4, title: "اللغة الفرنسية", image: "/Book-3.png" },
      { id: 5, title: "اللغة الألمانية", image: "/Book-4.png" },
      { id: 6, title: "اللغة الإسبانية", image: "/Book-5.png" },
      { id: 7, title: "اللغة الصينية", image: "/Book-2.png" },
    ],
    []
  );

  const books1 = useMemo(
    () => [
      { id: 1, title: "العلم جميع اللغات", image: "/Book-6.png" },
      { id: 2, title: "اللغة العربية", image: "/Book-7.png" },
      { id: 3, title: "اللغة الإنجليزية", image: "/Book-8.png" },
      { id: 4, title: "اللغة الفرنسية", image: "/Book-9.png" },
      { id: 5, title: "اللغة الألمانية", image: "/Book-10.png" },
      { id: 6, title: "اللغة الإسبانية", image: "/Book-11.png" },
      { id: 7, title: "اللغة الصينية", image: "/Book-12.png" },
    ],
    []
  );

  const books2 = useMemo(
    () => [
      { id: 1, title: "العلم جميع اللغات", image: "/Book-13.png" },
      { id: 2, title: "اللغة العربية", image: "/Book-14.png" },
      { id: 3, title: "اللغة الإنجليزية", image: "/Book-15.png" },
      { id: 4, title: "اللغة الفرنسية", image: "/Book-16.png" },
      { id: 5, title: "اللغة الألمانية", image: "/Book-17.png" },
      { id: 6, title: "اللغة الإسبانية", image: "/Book-18.png" },
      { id: 7, title: "اللغة الصينية", image: "/Book-19.png" },
    ],
    []
  );

  // Auto-rotation effect for testimonials
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 3); // Assuming 3 testimonials
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
        <LanguageBooks books={books1} isRTL={isRTL} />
        <LanguageBooks books={books} isRTL={isRTL} />
        <LanguageBooks books={books2} isRTL={isRTL} />
      </div>
    </motion.section>
  );
};

export default Services;
