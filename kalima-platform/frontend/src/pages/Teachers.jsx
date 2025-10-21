"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, Loader, Search } from "lucide-react";
import { getAllLecturers } from "../routes/fetch-users";
import { motion, AnimatePresence } from "framer-motion";
import TeacherCard from "../components/TeacherCard";
import { FilterDropdown } from "../../src/components/FilterDropdown";
import { useTranslation } from 'react-i18next';

export default function Teachers() {
  const { t, i18n } = useTranslation("teachers");
  const isRTL = i18n.language === 'ar';
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleTeachers, setVisibleTeachers] = useState(3);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedStage, setSelectedStage] = useState("");

  useEffect(() => {
    fetchTeachers();
  }, []);

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

  const loadMoreTeachers = () => {
    setVisibleTeachers(filteredTeachers.length);
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
  }, [searchTerm, selectedSubject, selectedStage, teachers]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedSubject("");
    setSelectedStage("");
    setFilteredTeachers(teachers);
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
        { label: t('stages.primary'), value: "primary" },
        { label: t('stages.preparatory'), value: "preparatory" },
        { label: t('stages.secondary'), value: "secondary" },
      ],
      onSelect: setSelectedStage,
    },
    {
      label: t('filters.subject'),
      value: selectedSubject,
      options: subjectOptions,
      onSelect: setSelectedSubject,
    },
  ];

  return (
    <div className="relative min-h-screen w-full">
      {/* Background Pattern */}
      <div className="absolute top-0 left-0 w-2/3 h-screen pointer-events-none z-0">
        <div className="relative w-full h-full">
          <img
            src="/background-courses.png"
            alt={t('alts.background')}
            className="absolute top-0 left-0 w-full h-full object-top opacity-50"
            style={{ maxWidth: "600px" }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Title Section */}
        <div className={`container mx-auto px-4 pt-8 pb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className="relative inline-block">
            <p className="text-3xl font-bold text-primary md:mx-40">
              {t('pageTitle')}
            </p>
            <img src="/underline.png" alt={t('alts.underline')} className="object-contain" />
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="container mx-auto px-4 py-4" dir={isRTL ? 'ltr' : 'rtl'}>
          <div className="flex justify-end mb-4">
            <button
              className="btn btn-outline btn-sm rounded-md mx-2"
              onClick={resetFilters}
            >
              {t('buttons.resetFilters')}
            </button>
            <div className="flex items-center gap-2">
              <button className="btn btn-primary btn-sm rounded-md">
                {t('buttons.searchOptions')}
              </button>
              <Search className="h-6 w-6" />
            </div>
          </div>

          {/* Search Input */}
          <div className="flex justify-end mb-4">
            <input
              type="text"
              placeholder={t('placeholders.searchName')}
              className="input input-bordered w-full max-w-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Dropdowns */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl ${isRTL ? 'ml-auto' : 'mr-auto'}`}>
            {filterOptions.map((filter) => (
              <FilterDropdown
                key={filter.label}
                label={filter.label}
                options={filter.options}
                selectedValue={filter.value}
                onSelect={filter.onSelect}
              />
            ))}
          </div>

          {/* Apply Filters Button */}
          <div className="flex justify-center mt-6">
            <button
              className="btn btn-accent btn-md rounded-full px-8"
              onClick={applyFilters}
            >
              <Search className="h-5 w-5 ml-2" />
              {t('buttons.showTeachers')}
            </button>
          </div>
        </div>

        {/* Teachers Section */}
        <div className="container mx-auto px-4 py-8">
          <h2 className={`text-2xl font-bold text-center mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('discoverTeachers')}
          </h2>

          {/* Loading, error, and content sections */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="alert alert-error">
              <p>{error}</p>
              <button className="btn btn-sm btn-outline" onClick={fetchTeachers}>
                {t('buttons.tryAgain')}
              </button>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg">{t('noTeachers')}</p>
              {(searchTerm || selectedSubject || selectedStage) && (
                <button
                  className="btn btn-outline btn-sm mt-4"
                  onClick={resetFilters}
                >
                  {t('buttons.resetFilters')}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AnimatePresence>
                  {sortedTeachers.slice(0, visibleTeachers).map((teacher) => (
                    <motion.div
                      key={teacher.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                    >
                      <TeacherCard teacher={teacher} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {visibleTeachers < filteredTeachers.length && (
                <div className="flex justify-center mt-8">
                  <button
                    className="btn btn-primary rounded-full"
                    onClick={loadMoreTeachers}
                  >
                    {t('buttons.loadMore')}
                    <ChevronLeft className={`h-4 w-4 ${isRTL ? 'mr-2' : 'ml-2 rotate-180'}`} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}