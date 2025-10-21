import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Users, ChevronLeft, Plus, Clock, Heart, ChevronRight } from "lucide-react";

function ReviewCoursesSection() {
  const { t, i18n } = useTranslation("coursesDashboard");
  const isRTL = i18n.language === "ar";
  const [favorites, setFavorites] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [coursesPerPage, setCoursesPerPage] = useState(6);

  // Course IDs and static data
  const courseIds = [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6, 1];
  const images = [
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1544717305-2782549b5136?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
  ];

  const allCourses = courseIds.map((id, index) => ({
    id: index + 1,
    courseId: id,
    image: images[id % 6],
    students: [165, 243, 98, 187, 312, 134][id % 6],
    isFree: [true, false, true, false, true, true][id % 6]
  }));

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        // Mobile
        setCoursesPerPage(1);
      } else if (window.innerWidth < 1024) {
        // Tablet
        setCoursesPerPage(2);
      } else {
        // Desktop
        setCoursesPerPage(6);
      }
    };

    handleResize(); // Set initial value
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Pagination logic
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = allCourses.slice(
    indexOfFirstCourse,
    indexOfLastCourse
  );
  const totalPages = Math.ceil(allCourses.length / coursesPerPage);

  const toggleFavorite = (courseId) => {
    setFavorites(prev => prev.includes(courseId) 
      ? prev.filter(id => id !== courseId) 
      : [...prev, courseId]
    );
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <section className="relative py-8 md:py-16 bg-base-100" dir={isRTL ? "rtl" : "ltr"}>
      <div className="container mx-auto px-2 sm:px-4 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-3 md:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl md:text-3xl font-bold text-base-content mb-1 md:mb-2">
              {t("reviewCourses.sectionTitle")}
            </h2>
            <p className="text-base-content/70 text-sm md:text-lg">
              {t("reviewCourses.sectionSubtitle")}
            </p>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 md:gap-2 text-primary px-3 py-1 md:px-4 md:py-2 rounded-full text-sm md:text-base shadow-sm hover:shadow-md transition-all border border-primary"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span>{t("reviewCourses.addButton")}</span>
          </motion.button>
        </div>

        {/* Responsive Courses Grid */}
        <div className={`grid gap-4 md:gap-6 mb-8 md:mb-12 ${
          coursesPerPage === 1 ? "grid-cols-1" :
          coursesPerPage === 2 ? "grid-cols-1 sm:grid-cols-2" :
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}>
          {currentCourses.map((course) => {
            const courseData = t(`reviewCourses.courses.${course.courseId}`, { returnObjects: true });
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -5 }}
                className="bg-base-100 rounded-xl shadow-sm hover:shadow-md overflow-hidden border border-base-200/50 hover:border-primary/20 transition-all duration-300"
              >
                <div className="relative h-40 sm:h-48 w-full">
                  <img
                    src={course.image}
                    alt={courseData.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-base-content text-base-100 text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                    {courseData.subject}
                  </div>

                  <motion.button
                    onClick={() => toggleFavorite(course.id)}
                    className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-base-100/80 p-1 sm:p-2 rounded-full shadow-sm hover:bg-error/20 hover:text-error transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Heart
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill={favorites.includes(course.id) ? "currentColor" : "none"}
                    />
                  </motion.button>
                </div>

                <div className="p-3 sm:p-4">
                  <p className="text-base-content/70 text-xs sm:text-sm mb-1">
                    {courseData.instructor}
                  </p>
                  <h3 className="font-bold text-base-content mb-2 sm:mb-3 text-base sm:text-lg">
                    {courseData.title}
                  </h3>

                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-base-content/70 mb-3 sm:mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{courseData.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{course.students} {t("reviewCourses.students")}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="line-through text-base-content/50 text-xs sm:text-sm mr-1 sm:mr-2">
                        {courseData.price}
                      </span>
                      {course.isFree && (
                        <span className="text-primary font-medium text-xs sm:text-sm">
                          {t("reviewCourses.freeWithCourse")}
                        </span>
                      )}
                    </div>
                    <a href="#" className="text-primary hover:text-primary/80 text-xs sm:text-sm">
                      {t("reviewCourses.viewMore")}
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-1 sm:gap-2">
          <motion.button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1 sm:p-2 rounded-full hover:bg-base-200 transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft
              className={`w-4 h-4 sm:w-5 sm:h-5 ${isRTL ? "rotate-180" : ""}`}
            />
          </motion.button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <motion.button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full font-medium text-sm sm:text-base transition-colors ${
                currentPage === page
                  ? "bg-primary text-white"
                  : "hover:bg-base-200"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {page}
            </motion.button>
          ))}

          <motion.button
            onClick={() =>
              handlePageChange(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="p-1 sm:p-2 rounded-full hover:bg-base-200 transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight
              className={`w-4 h-4 sm:w-5 sm:h-5 ${isRTL ? "rotate-180" : ""}`}
            />
          </motion.button>
        </div>
      </div>
    </section>
  );
}
export default ReviewCoursesSection;
