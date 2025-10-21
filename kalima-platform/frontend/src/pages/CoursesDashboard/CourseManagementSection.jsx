import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader } from "lucide-react";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllSubjects } from "../../routes/courses";
import { CourseCard } from "../../components/CourseCard";
import { Link, useNavigate } from "react-router-dom";

export default function CourseManagementSection() {
  const { t, i18n } = useTranslation("coursesDashboard");
  const isRTL = i18n.language === "ar";
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();
  const navigate = useNavigate();

  // Generate course IDs for translation mapping
  const courseIds = [1, 2, 3, 1, 2, 3, 1, 2, 3];

  // Enhanced fake data using translations
  const fakeCourses = courseIds.map((id, index) => {
    const courseData = t(`courseManagement.courses.${id}`, { returnObjects: true });
    return {
      id: index + 1,
      image: `/course-${(index % 3) + 1}.png`,
      ...courseData,
      duration: 12 + index,
      rating: 4 + (index % 2) * 0.5,
    };
  });

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllSubjects();
      if (result.success && result.data?.data?.subjects?.length > 0) {
        const subjectsData = result.data.data.subjects;
        setCourses(
          subjectsData.map((subject, index) => {
            const courseData = t(`courseManagement.courses.${(index % 3) + 1}`, {
              returnObjects: true,
            });

            return {
              id: subject._id,
              image: `/course-${(index % 3) + 1}.png`,
              title: courseData.title,
              subject: courseData.subject,
              teacher: courseData.teacher,
              instructor: courseData.instructor,
              grade: courseData.grade,
              level: courseData.level,
              stage: courseData.stage,
              duration: 12 + index,
              durationText: courseData.durationText,
              rating: 4 + (index % 2) * 0.5,
            };
          })
        );
      } else {
        setCourses(fakeCourses);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError(t("courseManagement.error"));
      setCourses(fakeCourses);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return (
    <section className="p-4 md:p-8 bg-base-100" dir={isRTL ? "rtl" : "ltr"}>
      <div className="container mx-auto px-2 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-4 md:gap-6 mb-6 md:mb-8"
        >
          <div className={`w-full flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/coursesform')}
              className={`flex items-center gap-1 md:gap-2 text-primary px-3 py-1 md:px-4 md:py-2 rounded-full text-sm md:text-base shadow-sm hover:shadow-md transition-all border border-primary ${
                isRTL ? 'mr-auto' : 'ml-auto'
              }`}
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              <span>{t("courseManagement.createButton")}</span>
            </motion.button>
          </div>

          <div className="text-center">
            <h1 className="text-xl md:text-3xl font-bold text-primary">
              {t("courseManagement.sectionTitle")}
            </h1>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-48 md:h-64">
            <Loader className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
            <span className={isRTL ? "mr-2" : "ml-2"}>
              {t("courseManagement.loading")}
            </span>
          </div>
        ) : error ? (
          <div className="alert alert-error max-w-md mx-auto">
            <p>{error}</p>
            <button className="btn btn-sm btn-outline" onClick={fetchCourses}>
              {t("courseManagement.tryAgain")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <AnimatePresence>
              {courses.slice(0, 9).map((course) => (
                <motion.div
                  key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md overflow-hidden border border-base-200/50 transition-all duration-300"
                    >
                    <Link href={`/courses/${course.id}`} passHref>
                      <div className="relative">
                        <CourseCard
                          {...course}
                          durationText={course.durationText}
                        />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>
    );
  }