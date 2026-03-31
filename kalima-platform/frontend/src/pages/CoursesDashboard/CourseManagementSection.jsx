import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader } from "lucide-react";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
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
  const [searchText, setSearchText] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
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
    setError("");
    try {
      const result = await getAllSubjects();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const subjectsData = result.data;
        setCourses(
          subjectsData.map((subject, index) => {
            const courseData = t(`courseManagement.courses.${(index % 3) + 1}`, {
              returnObjects: true,
            });
            const levels = Array.isArray(subject.level) ? subject.level : [];

            return {
              id: subject._id,
              image: `/course-${(index % 3) + 1}.png`,
              title: subject.name || courseData.title,
              subject: subject.name || courseData.subject,
              teacher: courseData.teacher,
              instructor: courseData.instructor,
              grade: levels.length > 0 ? levels.length : undefined,
              level: levels.length > 0 ? levels.length : undefined,
              stage: courseData.stage,
              duration: 12 + index,
              durationText: courseData.durationText,
              rating: 4 + (index % 2) * 0.5,
              childrenCount: levels.length,
              status: levels.length > 0 ? "paid" : "free",
              createdAt: subject.createdAt,
              updatedAt: subject.updatedAt,
            };
          })
        );
      } else {
        setCourses([]);
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

  const filteredCourses = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    let list = [...courses];

    if (normalizedSearch) {
      list = list.filter((course) => {
        const title = (course.title || "").toLowerCase();
        const subject = (course.subject || "").toLowerCase();
        return title.includes(normalizedSearch) || subject.includes(normalizedSearch);
      });
    }

    if (levelFilter === "with-level") {
      list = list.filter((course) => Number(course.childrenCount || 0) > 0);
    }

    if (levelFilter === "no-level") {
      list = list.filter((course) => Number(course.childrenCount || 0) === 0);
    }

    if (sortBy === "name-asc") {
      list.sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), i18n.language));
    }

    if (sortBy === "name-desc") {
      list.sort((a, b) => String(b.title || "").localeCompare(String(a.title || ""), i18n.language));
    }

    if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    }

    if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return list;
  }, [courses, i18n.language, levelFilter, searchText, sortBy]);

  const summaryText = useMemo(() => {
    if (isRTL) {
      return `عرض ${filteredCourses.length} من ${courses.length}`;
    }
    return `Showing ${filteredCourses.length} of ${courses.length}`;
  }, [courses.length, filteredCourses.length, isRTL]);

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
              onClick={() => navigate('/dashboard/lecturer-dashboard/CoursesForm')}
              className={`flex items-center gap-1 md:gap-2 text-primary px-3 py-1 md:px-4 md:py-2 rounded-full text-sm md:text-base shadow-sm hover:shadow-md transition-all border border-primary ${isRTL ? 'mr-auto' : 'ml-auto'
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

          <div className="w-full rounded-2xl border border-base-300 bg-base-100 p-3 md:p-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <label className="form-control md:col-span-6">
                <span className="label-text mb-1 flex items-center gap-2 font-semibold">
                  <Search className="w-4 h-4" />
                  {isRTL ? "بحث" : "Search"}
                </span>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder={isRTL ? "ابحث باسم المقرر أو المادة" : "Search by course or subject"}
                />
              </label>

              <label className="form-control md:col-span-3">
                <span className="label-text mb-1 flex items-center gap-2 font-semibold">
                  <SlidersHorizontal className="w-4 h-4" />
                  {isRTL ? "تصفية" : "Filter"}
                </span>
                <select className="select select-bordered w-full" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
                  <option value="all">{isRTL ? "الكل" : "All"}</option>
                  <option value="with-level">{isRTL ? "بمراحل" : "With Levels"}</option>
                  <option value="no-level">{isRTL ? "بدون مراحل" : "No Levels"}</option>
                </select>
              </label>

              <label className="form-control md:col-span-3">
                <span className="label-text mb-1 font-semibold">{isRTL ? "ترتيب" : "Sort"}</span>
                <select className="select select-bordered w-full" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">{isRTL ? "الأحدث" : "Newest"}</option>
                  <option value="oldest">{isRTL ? "الأقدم" : "Oldest"}</option>
                  <option value="name-asc">{isRTL ? "الاسم (أ-ي)" : "Name (A-Z)"}</option>
                  <option value="name-desc">{isRTL ? "الاسم (ي-أ)" : "Name (Z-A)"}</option>
                </select>
              </label>
            </div>

            <p className="text-sm opacity-70 mt-3">{summaryText}</p>
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
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-base-300 bg-base-100">
            <p className="text-base font-semibold">{isRTL ? "لا توجد نتائج مطابقة" : "No matching courses found"}</p>
            <p className="text-sm opacity-70 mt-2">{isRTL ? "جرّب تغيير البحث أو التصفية" : "Try adjusting your search or filters"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <AnimatePresence>
              {filteredCourses.slice(0, 12).map((course) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md overflow-hidden border border-base-200/50 transition-all duration-300"
                >
                  <Link to={`/courses/${course.id}`}>
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