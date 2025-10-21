import React  from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const ExamPreparationSection = React.memo(({ isRTL }) => {
  const navigate = useNavigate();
  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 rounded-xl mt-10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative text-center mb-8 sm:mb-12"
        >
          <div className="relative inline-block">
            <h2 className="text-sm sm:text-sm md:text-sm font-bold text-primary relative z-10 pb-2">
              {isRTL ? "التحضير للأمتحان" : "Exam Preparation"}
              <svg
                className="absolute bottom-0 left-0 w-full h-2 text-primary"
                viewBox="0 0 200 10"
                preserveAspectRatio="none"
              >
                <path
                  d={
                    isRTL
                      ? "M0,5 C50,0 150,10 200,5"
                      : "M0,5 C50,10 150,0 200,5"
                  }
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </h2>
            <motion.div
              className="absolute -top-3 -right-4 w-3 h-3 rounded-full bg-secondary"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-2 -left-3 w-2 h-2 rounded-full bg-accent"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <motion.div
            initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className={`relative rounded-2xl overflow-hidden shadow-xl h-72 sm:h-96 ${
              isRTL ? "bg-secondary" : "bg-primary"
            }`}
          >
            <div
              className={`flex h-full ${
                isRTL ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`flex-1 flex flex-col justify-center p-6 sm:p-8 ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                <h3 className="text-2xl sm:text-3xl font-bold mb-3">
                  {isRTL
                    ? "التحضير للامتحانات النهائية"
                    : "Final Exam Preparation"}
                </h3>
                <p className=" mb-6 text-base sm:text-lg max-w-[90%]">
                  {isRTL
                    ? "دورات مكثفة مع أفضل المدرسين لتأهيلك للامتحانات"
                    : "Intensive courses with top teachers to prepare you for exams"}
                </p>
                <div
                  className={`flex ${isRTL ? "justify-end" : "justify-start"}`}
                >
                  <motion.button
                    onClick={() => {
                      navigate("/register");
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium bg-primary hover:bg-primary/10 border border-secondary flex items-center gap-2 transition-all"
                  >
                    {isRTL ? (
                      <>
                        <span>سجل الآن</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                          />
                        </svg>
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                        <span>Register Now</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
              <div className="flex-1 relative hidden sm:block">
                <motion.img
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  src="/education-card1.png"
                  alt={isRTL ? "طلاب في محاضرة" : "Students in lecture"}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className={`relative rounded-2xl overflow-hidden shadow-xl h-72 sm:h-96 ${
              isRTL ? "bg-primary" : "bg-secondary"
            }`}
          >
            <div
              className={`flex h-full ${
                isRTL ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`flex-1 flex flex-col justify-center p-6 sm:p-8 ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                <h3 className="text-2xl sm:text-3xl font-bold mb-3">
                  {isRTL
                    ? "دورات تقوية شاملة"
                    : "Comprehensive Training Courses"}
                </h3>
                <p className=" mb-6 text-base sm:text-lg max-w-[90%]">
                  {isRTL
                    ? "برامج تدريبية متخصصة لتعزيز مهاراتك الأكاديمية"
                    : "Specialized training programs to enhance your academic skills"}
                </p>
                <div
                  className={`flex ${isRTL ? "justify-end" : "justify-start"}`}
                >
                  <motion.button
                    onClick={() => {
                      navigate("/register");
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium bg-primary hover:bg-secondary border border-secondary flex items-center gap-2 transition-all"
                  >
                    {isRTL ? (
                      <>
                        <span>سجل الآن</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                          />
                        </svg>
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                        <span>Register Now</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
              <div className="flex-1 relative hidden sm:block">
                <motion.img
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  src="/courses-photo.jpg"
                  alt={isRTL ? "مجموعة دراسة" : "Study group"}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
});
export default ExamPreparationSection;