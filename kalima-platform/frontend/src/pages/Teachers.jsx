"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronDown, ChevronUp, Search } from "lucide-react";
import { getAllLecturers } from "../routes/fetch-users";
import { motion, AnimatePresence } from "framer-motion";
import TeacherCard from "../components/TeacherCard";
import { FilterDropdown } from "../../src/components/FilterDropdown";
import { useTranslation } from 'react-i18next';
import { designTokens } from "../constants/designTokens";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorAlert } from "../components/ErrorAlert";

export default function Teachers() {
  const TOKENS = designTokens.colors;
  const SHADOWS = designTokens.shadows;
  const GRADIENTS = designTokens.gradients;

  const { t, i18n } = useTranslation("teachers");
  const isRTL = i18n.language === 'ar';
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const ITEMS_PER_PAGE = 6;
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedStage, setSelectedStage] = useState("");

  useEffect(() => {
    fetchTeachers();
  }, []);

  // useEffect(() => {
  //   // Desktop starts expanded, mobile starts collapsed.
  //   setShowFilters(window.matchMedia("(min-width: 1024px)").matches);
  // }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const result = await getAllLecturers();
      if (result.success) {
        const lecturers = result.data.map((lecturer) => ({
          id: lecturer._id,
          image: "/course-1.png",
          name: lecturer.name,
          subject: lecturer.expertise || t('defaultSubject'),
          experience: lecturer.bio || t('defaultExperience'),
          grade: t('allGrades'),
          rating: 5,
        }));
        setTeachers(lecturers);
        setFilteredTeachers(lecturers);
        setTotalResults(lecturers.length);
        setTotalPages(Math.ceil(lecturers.length / ITEMS_PER_PAGE));
      } else {
        setError(t('errors.loadTeachers'));
      }
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setError(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Apply filters to teachers
  const applyFilters = useCallback(() => {
    let filtered = teachers;

    // Filter by name (search term)
    if (searchTerm) {
      filtered = filtered.filter((teacher) =>
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by subject
    if (selectedSubject) {
      filtered = filtered.filter((teacher) => teacher.subject === selectedSubject);
    }

    // Filter by المرحلة الدراسية
    if (selectedStage) {
      filtered = filtered.filter((teacher) => teacher.grade === selectedStage);
    }

    setFilteredTeachers(filtered);
    setCurrentPage(1);
    setTotalResults(filtered.length);
    setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));

    if (window.matchMedia("(max-width: 1023px)").matches) {
      setShowFilters(false);
    }
  }, [searchTerm, selectedSubject, selectedStage, teachers]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedSubject("");
    setSelectedStage("");
    setFilteredTeachers(teachers);
    setCurrentPage(1);
    setTotalResults(teachers.length);
    setTotalPages(Math.ceil(teachers.length / ITEMS_PER_PAGE));
  }, [teachers]);

  // Memoize filtered teachers to avoid recalculating on every render
  const sortedTeachers = useMemo(() => {
    return [...filteredTeachers].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredTeachers]);

  // Dynamically generate subject filter options from teachers' expertise
  const subjectOptions = useMemo(() => {
    const uniqueExpertise = [...new Set(teachers.map((teacher) => teacher.subject))];
    return uniqueExpertise.map((expertise) => ({
      label: expertise,
      value: expertise,
    }));
  }, [teachers]);

  // Filter options for المرحلة الدراسية and المادة
  const filterOptions = [
    {
      label: t('filters.stage'),
      value: selectedStage,
      options: [
        { label: t('filters.all', { defaultValue: isRTL ? "الكل" : "All" }), value: "" },
        { label: t('stages.primary'), value: "primary" },
        { label: t('stages.preparatory'), value: "preparatory" },
        { label: t('stages.secondary'), value: "secondary" },
      ],
      onSelect: setSelectedStage,
    },
    {
      label: t('filters.subject'),
      value: selectedSubject,
      options: [{ label: t('filters.all', { defaultValue: isRTL ? "الكل" : "All" }), value: "" }, ...subjectOptions],
      onSelect: setSelectedSubject,
    },
  ];

  const activeFiltersCount = useMemo(() => {
    return [searchTerm, selectedStage, selectedSubject].filter(Boolean).length;
  }, [searchTerm, selectedStage, selectedSubject]);

  return (
    <main
      className="relative min-h-screen w-full px-4 py-8 sm:px-6 lg:px-8"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: TOKENS.creamSurface, color: TOKENS.inkText }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-50" style={{ background: GRADIENTS.pageAtmosphere }} />

      <div className="mx-auto max-w-[1160px] space-y-8 md:space-y-10">
        <section
          className="relative overflow-hidden rounded-[2rem] border p-6 md:p-10"
          style={{
            borderColor: 'rgba(255,255,255,0.2)',
            background: GRADIENTS.hero,
            boxShadow: SHADOWS.level2,
            color: '#F8FCFF',
          }}
        >
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full opacity-70" style={{ background: 'rgba(77,179,194,0.4)' }} />
          <div className="pointer-events-none absolute -bottom-12 right-6 h-36 w-36 rounded-full opacity-75" style={{ background: 'rgba(243,154,63,0.33)' }} />

          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.08em]"
            style={{
              borderColor: 'rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.14)',
              color: '#ECFDFF',
            }}
          >
            {t('pageTitle')}
          </span>

          <h1 className="mt-4 text-4xl font-extrabold leading-[1.15] tracking-[-0.02em] md:text-6xl">{t('discoverTeachers')}</h1>
          <p className="mt-3 max-w-[70ch] text-base leading-8 text-[#DDF6FB]">
            {isRTL ? 'اختر المدرس المناسب حسب الاسم أو المادة خلال ثوانٍ.' : 'Find the right teacher quickly by name and subject.'}
          </p>

          <div className="mt-6 inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.15)' }}>
            {filteredTeachers.length} {isRTL ? 'مدرس' : 'teachers'}
          </div>
        </section>

        <section
          className="rounded-[2rem] border p-6 md:p-8"
          style={{
            borderColor: 'rgba(17,24,39,0.08)',
            background: TOKENS.neutralCloud,
            boxShadow: SHADOWS.level1,
          }}
        >
          <div className={`mb-4 flex flex-wrap items-center gap-3 ${isRTL ? 'justify-end' : 'justify-start'}`}>
            <button
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-transform duration-200 hover:-translate-y-[1px] ${isRTL ? 'flex-row-reverse' : ''}`}
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(17,24,39,0.12)',
                color: TOKENS.deepTeal,
                boxShadow: SHADOWS.level1,
              }}
              onClick={() => setShowFilters((prev) => !prev)}
              aria-expanded={showFilters}
              aria-controls="teachers-filters-panel"
            >
              {showFilters
                ? (isRTL ? 'إخفاء الفلاتر' : 'Hide Filters')
                : (isRTL ? 'إظهار الفلاتر' : 'Show Filters')}
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            <button
              className="rounded-full px-5 py-2 text-sm font-semibold transition-transform duration-200 hover:-translate-y-[1px]"
              style={{ background: '#FFFFFF', border: '1px solid rgba(17,24,39,0.1)', color: TOKENS.deepTeal }}
              onClick={resetFilters}
            >
              {t('buttons.resetFilters')}
            </button>

            <div
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}
              style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}
            >
              <Search className="h-4 w-4" />
              {t('buttons.searchOptions')}
            </div>

            {activeFiltersCount > 0 && (
              <div
                className="inline-flex items-center rounded-full px-4 py-2 text-xs font-bold"
                style={{ background: 'rgba(20,106,120,0.12)', color: TOKENS.deepTeal }}
              >
                {isRTL ? `${activeFiltersCount} فلاتر مفعلة` : `${activeFiltersCount} active filters`}
              </div>
            )}
          </div>

          <AnimatePresence initial={false}>
            {showFilters && (
              <motion.div
                id="teachers-filters-panel"
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder={t('placeholders.searchName')}
                    className="input input-bordered w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filterOptions.map((filter) => (
                    <FilterDropdown
                      key={filter.label}
                      label={filter.label}
                      options={filter.options}
                      selectedValue={filter.value}
                      placeholder={t('filters.select', { defaultValue: isRTL ? 'اختر' : 'Select' })}
                      onSelect={filter.onSelect}
                      isRTL={isRTL}
                    />
                  ))}
                </div>

                <div className={`mt-6 flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                  <button
                    className={`inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-bold transition-transform duration-200 hover:-translate-y-[1px] ${isRTL ? 'flex-row-reverse' : ''}`}
                    style={{ background: TOKENS.goldenSand, color: TOKENS.inkText, boxShadow: SHADOWS.level1 }}
                    onClick={applyFilters}
                  >
                    <Search className="h-5 w-5" />
                    {t('buttons.showTeachers')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="space-y-6">
          <h2 className={`text-2xl font-bold md:text-3xl ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: TOKENS.deepTeal }}>
            {t('discoverTeachers')}
          </h2>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorAlert error={error} onRetry={fetchTeachers} retryLabel={t('buttons.tryAgain')} />
          ) : filteredTeachers.length === 0 ? (
            <div
              className={`rounded-[1.4rem] border bg-white py-12 ${isRTL ? 'text-right' : 'text-left'}`}
              style={{ borderColor: 'rgba(17,24,39,0.08)', boxShadow: SHADOWS.level1 }}
            >
              <div className="px-6">
                <p className="text-lg">{t('noTeachers')}</p>
                {(searchTerm || selectedSubject || selectedStage) && (
                  <button
                    className="mt-4 rounded-full px-5 py-2 text-sm font-semibold"
                    style={{ border: '1px solid rgba(17,24,39,0.15)', color: TOKENS.deepTeal }}
                    onClick={resetFilters}
                  >
                    {t('buttons.resetFilters')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {sortedTeachers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((teacher) => (
                    <motion.div
                      key={teacher.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <TeacherCard teacher={teacher} isRTL={isRTL} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-2 py-2" style={{ boxShadow: SHADOWS.level1 }}>
                    <button
                      className="rounded-full px-4 py-2 text-sm font-semibold"
                      style={{ color: TOKENS.deepTeal }}
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      {isRTL ? "السابق" : "Previous"}
                    </button>

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          className="h-9 w-9 rounded-full text-sm font-bold"
                          style={{
                            background: currentPage === pageNum ? TOKENS.deepTeal : "transparent",
                            color: currentPage === pageNum ? "#F8FCFF" : TOKENS.deepTeal,
                          }}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      className="rounded-full px-4 py-2 text-sm font-semibold"
                      style={{ color: TOKENS.deepTeal }}
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      {isRTL ? "التالي" : "Next"}
                    </button>
                  </div>
                </div>
              )}

              <div className="text-center text-sm mt-4" style={{ color: TOKENS.slateText }}>
                {isRTL ? "عرض" : "Showing"} {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalResults)} {isRTL ? "من" : "of"} {totalResults} {isRTL ? "مدرس" : "teachers"}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}