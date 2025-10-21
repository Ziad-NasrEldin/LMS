import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation, Trans } from "react-i18next";

const WelcomeSection = React.memo(() => {
  const { t, i18n } = useTranslation("home");
  const isRTL = i18n.language === "ar";
  const navigate = useNavigate();

  const images = useMemo(
    () => ({
      maleStudent: "/servicesherosection2",
      femaleStudent: "/servicesherosection1",
    }),
    []
  );
  const titleParts = t("welcome.title").split(/({{highlight}}|{{\/highlight}})/);
  const HighlightedText = ({ children, isRTL }) => (
    <span className="relative inline-block text-primary">
      {children}
      <svg
        className={`absolute -bottom-3 w-full ${isRTL ? "right-0" : "left-0"}`}
        width="140"
        height="16"
        viewBox="0 0 140 16"
        preserveAspectRatio="none"
      >
        <path
          d="M0 8C20 16 40 0 60 8C80 16 100 0 120 8C140 16 140 0 140 8"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
  const fadeIn = (direction, type, delay, duration) => ({
    hidden: {
      x: direction === "left" ? 50 : direction === "right" ? -50 : 0,
      y: direction === "up" ? 50 : direction === "down" ? -50 : 0,
      opacity: 0,
    },
    show: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: {
        type: type || "spring",
        delay: delay || 0,
        duration: duration || 1,
        ease: "easeOut",
      },
    },
  });

  return (
    <div
      className={`flex flex-col lg:flex-row items-center gap-8 ${
        isRTL ? "lg:flex-row-reverse" : ""
      }`}
    >
      <motion.div
        variants={fadeIn(isRTL ? "left" : "right", "tween", 0.2, 1)}
        className="w-full lg:w-1/2 relative"
        style={{ height: "clamp(350px, 55vw, 500px)" }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -left-20 -top-20 w-64 h-64 rounded-full bg-primary/10 mix-blend-multiply filter blur-xl opacity-70"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -right-10 bottom-10 w-40 h-40 rounded-full bg-secondary/10 mix-blend-multiply filter blur-xl opacity-70"
        />
        <div className="relative h-full w-full z-10">
          <motion.div
            className="absolute left-8 sm:left-12 md:left-16 bottom-0 h-[70%] sm:h-[75%] md:h-[80%] w-[45%] sm:w-[40%] md:w-[35%] rounded-t-full rounded-b-full p-2 sm:p-3 md:p-4 z-0"
            whileHover={{ y: -10 }}
          >
            <img
              src={images.maleStudent}
              alt={t("welcome.maleStudentAlt")}
              className="w-full h-full object-cover rounded-t-full rounded-b-full shadow-lg md:shadow-xl border-2 border-secondary/30"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "servicesherosection2.png";
              }}
            />
          </motion.div>
          <motion.div
            className="absolute right-8 sm:right-12 md:right-16 bottom-8 sm:bottom-12 md:bottom-16 h-[85%] sm:h-[90%] md:h-[100%] w-[55%] sm:w-[50%] md:w-[45%] rounded-t-full rounded-b-full p-2 sm:p-3 md:p-4 z-10"
            whileHover={{ y: -10 }}
          >
            <img
              src={images.femaleStudent}
              alt={t("welcome.femaleStudentAlt")}
              className="w-full h-full object-cover rounded-t-full rounded-b-full shadow-lg md:shadow-xl border-2 border-primary/30"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "servicesherosection1.png";
              }}
            />
            <motion.div
              className="absolute -top-5 sm:-top-6 md:-top-7 left-1/2 -translate-x-1/2 text-lg sm:text-xl md:text-2xl font-bold text-primary whitespace-nowrap"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
            >
              {t("welcome.kalima")}
            </motion.div>
          </motion.div>
        </div>
        <motion.div
          className="absolute top-6 sm:top-8 md:top-10 left-6 sm:left-8 md:left-10 w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 rounded-full bg-accent"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-12 sm:bottom-16 md:bottom-20 right-12 sm:right-16 md:right-20 w-5 sm:w-6 md:w-6 h-5 sm:h-6 md:h-6 rounded-full bg-error"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
        />
      </motion.div>

      <motion.div
        variants={fadeIn(isRTL ? "right" : "left", "tween", 0.2, 1)}
        className="w-full lg:w-1/2 space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-0"
      >
        <div className="relative">
        <motion.h1
  initial={{ x: isRTL ? 50 : -50, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.6 }}
  className={`text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-base-content leading-tight ${
    isRTL ? "text-right" : "text-left"
  }`}
>
  {(() => {
    const title = t("welcome.title");
    const parts = [];
    const regex = /\{\{highlight\}\}(.*?)\{\{\/highlight\}\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(title)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(title.substring(lastIndex, match.index));
      }
      // Add highlighted component
      parts.push(
        <HighlightedText key={match[1]} isRTL={isRTL}>
          {match[1]}
        </HighlightedText>
      );
      lastIndex = regex.lastIndex;
    }
    // Add remaining text after last match
    if (lastIndex < title.length) {
      parts.push(title.substring(lastIndex));
    }

    return parts;
  })()}
</motion.h1>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`relative ${isRTL ? "text-right" : "text-left"}`}
        >
          <motion.p className="text-lg sm:text-xl md:text-2xl text-base-content/80 leading-relaxed mb-6">
            {t("welcome.description")}
          </motion.p>
          <div className="w-20 h-1 bg-gradient-to-r from-primary to-secondary rounded-full mb-6"></div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`flex flex-wrap gap-4 ${isRTL ? "justify-start" : "justify-end"}`}
        >
          <motion.button
            onClick={() => navigate("/login")}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 25px -5px rgba(var(--p), 0.2)",
            }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary btn-md gap-2"
          >
            {t("signIn")}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isRTL ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              )}
            </svg>
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
});

export default WelcomeSection;