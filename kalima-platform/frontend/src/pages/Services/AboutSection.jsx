import React, {  useMemo } from "react";

import { motion } from "framer-motion";

import {
  FaAward,

  FaChalkboardTeacher,
  FaClock,
 
} from "react-icons/fa";

const AboutSection = React.memo(({ isRTL }) => {
  const features = useMemo(
    () => [
      {
        icon: <FaChalkboardTeacher />,
        text: isRTL ? "معلمين محترفين" : "Professional Teachers",
      },
      {
        icon: <FaAward />,
        text: isRTL ? "كورسات عالية الجودة" : "High Quality Courses",
      },
      {
        icon: <FaClock />,
        text: isRTL ? "تعلم في أي وقت" : "Learn Anytime",
      },
    ],
    [isRTL]
  );

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 rounded-3xl">
      <div className="max-w-7xl mx-auto">
        <div
          className={`flex flex-col lg:flex-row items-center gap-8 ${
            isRTL ? "lg:flex-row-reverse" : ""
          }`}
        >
          <div className="w-full lg:w-1/2 space-y-6">
            <h3 className="text-xl font-bold text-primary">
              {isRTL ? "معلومات عنا" : "About Us"}
            </h3>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-base-content leading-tight">
              {isRTL ? (
                <>
                  تعلم وجيب الدرجات النهائية{" "}
                  <span className="text-primary relative inline-block">
                    معانا
                    <svg
                      className="absolute -bottom-3 left-0 w-full"
                      width="140"
                      height="16"
                      viewBox="0 0 140 16"
                      fill="none"
                    >
                      <path
                        d="M0 8C20 16 40 0 60 8C80 16 100 0 120 8C140 16 140 0 140 8"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </>
              ) : (
                <>
                  Learn and achieve final grades{" "}
                  <span className="text-primary relative inline-block">
                    with us
                    <svg
                      className="absolute -bottom-3 left-0 w-full"
                      width="140"
                      height="16"
                      viewBox="0 0 140 16"
                      fill="none"
                    >
                      <path
                        d="M0 8C20 16 40 0 60 8C80 16 100 0 120 8C140 16 140 0 140 8"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </>
              )}
            </h2>
            <p
              className={`text-lg text-base-content/80 leading-relaxed ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              {isRTL
                ? "منصة فكرة هي منصة تعليم إلكتروني توفر المنصة موارد للطلاب من الصف الرابع الابتدائي حتى الصف الثالث الثانوي."
                : "Fekra Platform is an e-learning platform that provides resources for students from 4th grade through 12th grade."}
            </p>
            <div className="relative">
              <div className="flex flex-col gap-4 relative z-10">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="text-primary text-xl bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm">
                      {feature.icon}
                    </div>
                    <span className="text-base-content font-medium flex-1">
                      {feature.text}
                    </span>
                    {index === 0 && (
                      <div
                        className={`hidden sm:block ${isRTL ? "mr-4" : "ml-4"}`}
                      >
                        <img
                          src={
                            isRTL
                              ? "/curved-arrow-about.png"
                              : "/curved-arrow-services.png"
                          }
                          alt=""
                          className="h-12 w-auto object-contain"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="w-full lg:w-1/2 relative"
            style={{ height: "clamp(400px, 60vw, 500px)" }}
          >
            <div className="absolute inset-0 overflow-hidden z-0">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <pattern
                  id="dotsPattern"
                  x="0"
                  y="0"
                  width="25"
                  height="25"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(0)"
                >
                  <circle
                    cx="2.5"
                    cy="2.5"
                    r="1.5"
                    fill="currentColor"
                    className="text-primary/20"
                  />
                </pattern>
                <rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill="url(#dotsPattern)"
                />
              </svg>
            </div>

            <motion.div
              className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 z-10"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative w-full h-full max-w-[500px]">
                <img
                  src="/man-working.jpg"
                  alt={isRTL ? "طلاب يدرسون" : "Students learning"}
                  className="w-full h-full object-contain rounded-xl"
                  loading="lazy"
                />
                <div className="absolute -inset-4 rounded-xl bg-primary/10 mix-blend-multiply filter blur-xl z-0" />
              </div>
            </motion.div>
            <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-primary/10 mix-blend-multiply filter blur-xl z-0" />
            <div className="absolute -right-6 bottom-6 w-32 h-32 rounded-full bg-secondary/10 mix-blend-multiply filter blur-xl z-0" />
          </div>
        </div>
      </div>
    </section>
  );
});
export default AboutSection;