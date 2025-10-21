"use client"

import React, { useMemo } from "react"
import { motion } from "framer-motion"
import { FaCertificate, FaClock, FaGraduationCap, FaMedal } from "react-icons/fa"
import ServiceCard from "../../components/ServiceCard"
import { useTranslation } from "react-i18next"

const ServicesGrid = React.memo(() => {
  const { t, i18n } = useTranslation("home")
  const isRTL = i18n.language === "ar"

  const services = useMemo(
    () => [
      {
        icon: FaClock,
        title: t("services.learnAnytime.title"),
        subtitle: t("services.learnAnytime.subtitle"),
        description: t("services.learnAnytime.description"),
      },
      {
        icon: FaGraduationCap,
        title: t("services.teachers.title"),
        subtitle: t("services.teachers.subtitle"),
        description: t("services.teachers.description"),
      },
      {
        icon: FaMedal,
        title: t("services.curriculum.title"),
        subtitle: t("services.curriculum.subtitle"),
        description: t("services.curriculum.description"),
      },
      {
        icon: FaCertificate,
        title: t("services.certificates.title"),
        subtitle: t("services.certificates.subtitle"),
        description: t("services.certificates.description"),
      },
    ],
    [t]
  )
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 rounded-xl">
      <div className="max-w-7xl mx-auto flex flex-row justify-end items-center">
        <img src="waves.png" alt="waves" className="w-16 h-16 object-cover animate-float-zigzag" />
      </div>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative text-center mb-8 sm:mb-12"
        >
          <div className="relative inline-block">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary relative z-10 pb-2">
            {t("services.title")}
              <svg
                className="absolute bottom-0 left-0 w-full h-2 text-primary"
                viewBox="0 0 200 10"
                preserveAspectRatio="none"
              >
                <path
                  d={isRTL ? "M0,5 C50,0 150,10 200,5" : "M0,5 C50,10 150,0 200,5"}
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </h2>
            <motion.div
              className="absolute -top-3 -right-4 w-4 h-4 rounded-full bg-secondary"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            />
            <motion.div
              className="absolute -bottom-2 -left-3 w-3 h-3 rounded-full bg-accent"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
            />
          </div>
          <motion.p
            className={`mt-6 text-xl sm:text-2xl text-base-content/80 max-w-2xl mx-auto relative ${
              isRTL ? "text-right" : "text-left"
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {isRTL
              ? "هدفنا هو تبسيط المعلومة لضمان تفوقك الدراسي"
              : "Our goal is to simplify information to ensure your academic excellence"}
            <span className={`inline-flex items-center ${isRTL ? "mr-2" : "ml-2"}`}>
              {[...Array(3)].map((_, i) => (
                <motion.span
                  key={i}
                  className="w-2 h-2 mx-0.5 rounded-full bg-primary"
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </span>
          </motion.p>
        </motion.div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${isRTL ? "rtl" : "ltr"}`}>
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <ServiceCard
                icon={service.icon}
                title={service.title}
                subtitle={service.subtitle}
                description={service.description}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
})

export default ServicesGrid;

