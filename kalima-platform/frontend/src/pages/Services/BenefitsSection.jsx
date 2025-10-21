import React, { useMemo } from "react";
import { motion } from "framer-motion";

const BenefitsSection = React.memo(({ isRTL }) => {
  const benefits = useMemo(
    () => [
      {
        id: 1,
        number: "01",
        title: isRTL ? "تعلم مرن" : "Flexible Learning",
        prefix: isRTL ? "بـ" : "With",
        subheader: isRTL ? "أوقاتك" : "Your Schedule",
        content: isRTL
          ? "تعلم في أي وقت ومن أي مكان مع إمكانية الوصول الكامل إلى جميع المواد التعليمية"
          : "Learn anytime, anywhere with full access to all educational materials",
      },
      {
        id: 2,
        number: "02",
        title: isRTL ? "معلمون خبراء" : "Expert Teachers",
        prefix: isRTL ? "بـ" : "With",
        subheader: isRTL ? "متخصصين" : "Specialists",
        content: isRTL
          ? "فريق من المعلمين المؤهلين ذوي الخبرة في المناهج التعليمية المختلفة"
          : "Team of qualified teachers experienced in various curricula",
      },
      {
        id: 3,
        number: "03",
        title: isRTL ? "محتوى مميز" : "Premium Content",
        prefix: isRTL ? "بـ" : "With",
        subheader: isRTL ? "جودة عالية" : "High Quality",
        content: isRTL
          ? "مناهج مصممة بعناية لتغطية جميع احتياجات الطلاب التعليمية"
          : "Carefully designed curriculum covering all student educational needs",
      },
      {
        id: 4,
        number: "04",
        title: isRTL ? "متابعة مستمرة" : "Continuous Support",
        prefix: isRTL ? "بـ" : "With",
        subheader: isRTL ? "رعاية" : "Care",
        content: isRTL
          ? "دعم فني وتعليمي متواصل لضمان أفضل تجربة تعليمية"
          : "Continuous technical and educational support to ensure the best learning experience",
      },
      {
        id: 5,
        number: "05",
        title: isRTL ? "شهادات معتمدة" : "Certified Certificates",
        prefix: isRTL ? "بـ" : "With",
        subheader: isRTL ? "اعتماد" : "Accreditation",
        content: isRTL
          ? "شهادات معتمدة بعد إتمام كل مرحلة تعليمية بنجاح"
          : "Certified certificates upon successful completion of each educational stage",
      },
      {
        id: 6,
        number: "06",
        title: isRTL ? "تقييم وتطوير" : "Assessment & Development",
        prefix: isRTL ? "بـ" : "With",
        subheader: isRTL ? "تحسين" : "Improvement",
        content: isRTL
          ? "نظام تقييم مستمر لمتابعة التطور الأكاديمي للطلاب"
          : "Continuous assessment system to track students' academic progress",
      },
    ],
    [isRTL]
  );

  const orderedBenefits = [
    benefits.find(b => b.number === "01"),
    benefits.find(b => b.number === "02"),
    benefits.find(b => b.number === "03"),
    benefits.find(b => b.number === "04"),
    benefits.find(b => b.number === "05"),
    benefits.find(b => b.number === "06"),
  ];

  return (
    <div className="mt-24 px-4 sm:px-6">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-3xl md:text-4xl font-bold text-center mb-12 text-base-content"
      >
        {isRTL ? (
          <>
            فوائد الانضمام إلى منصة{" "}
            <span className="text-primary relative inline-block">
              فكرة
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
            Benefits of Joining{" "}
            <span className="text-primary relative inline-block">
              Fekra
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
            </span>{" "}
            Platform
          </>
        )}
      </motion.h2>

      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* First row - 01 02 03 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {orderedBenefits.slice(0, 3).map((benefit, index) => (
            <motion.div
              key={benefit.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
              viewport={{ once: true }}
              className={`p-6 rounded-xl ${
                index % 2 === 0
                  ? "bg-base-100 shadow-sm border border-base-300"
                  : "bg-primary/20 shadow-md text-white"
              } h-full`}
            >
              <div className={`flex flex-col ${isRTL ? "text-right" : "text-left"}`}>
                <span className="text-4xl font-bold mb-2 opacity-80">
                  {benefit.number}
                </span>
                <h3 className="text-xl font-bold text-base-content mb-2">
                  {benefit.title}
                </h3>
                <p className={`text-sm ${
                  index % 2 === 0 ? "text-base-content/80" : "text-white/90"
                }`}>
                  {benefit.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Second row - 04 05 06 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {orderedBenefits.slice(3, 6).map((benefit, index) => (
            <motion.div
              key={benefit.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * (index + 4) }}
              viewport={{ once: true }}
              className={`p-6 rounded-xl ${
                index % 2 === 1
                  ? "bg-base-100 shadow-sm border border-base-300"
                  : "bg-primary/20 shadow-md text-white"
              } h-full`}
            >
              <div className={`flex flex-col ${isRTL ? "text-right" : "text-left"}`}>
                <span className="text-4xl font-bold mb-2 opacity-80">
                  {benefit.number}
                </span>
                <h3 className="text-xl font-bold text-base-content mb-2">
                  {benefit.title}
                </h3>
                <p className={`text-sm ${
                  index % 2 === 1 ? "text-base-content/80" : "text-white/90"
                }`}>
                  {benefit.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default BenefitsSection;