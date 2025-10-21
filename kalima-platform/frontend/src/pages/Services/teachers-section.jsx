"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Loader } from 'lucide-react';
import { getAllLecturers } from "../../routes/fetch-users";
import { useTranslation } from "react-i18next";
import TeacherCard from "../../components/TeacherCard";

export function TeachersSection() {
  const { t, i18n } = useTranslation("home");
  const isRTL = i18n.language === 'ar';
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleTeachers, setVisibleTeachers] = useState(4);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const result = await getAllLecturers();
      if (result.success) {
        const formattedTeachers = result.data.map((lecturer) => ({
          id: lecturer._id,
          image: "/course-1.png", // Default image or consider adding profile pics to your API
          name: lecturer.name,
          subject: lecturer.expertise || t('teachers.labels.expertise'),
          experience: lecturer.bio || t('teachers.labels.experience'),
          grade: t('teachers.labels.gradeLevels'),
          rating: 5, // Default rating or consider adding to your API
          email: lecturer.email, // Additional fields from API
          gender: lecturer.gender
        }));
        setTeachers(formattedTeachers);
      } else {
        setError(result.error || t('teachers.errors.failed'));
      }
    } catch (err) {
      setError(t('teachers.errors.failed'));
    } finally {
      setLoading(false);
    }
  };

  const loadMoreTeachers = () => {
    setVisibleTeachers(teachers.length);
  };

  return (
    <section className="md:p-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`relative h-24 w-24 ${isRTL ? 'ml-auto' : 'mr-auto'} mt-4 animate-pulse lg:-translate-x-96 translate-y-1/2 sm:-translate-x-24 -translate-x-56`}>
        <img 
          src="curved-arrow-services.png" 
          alt="curved arrow" 
          className={isRTL ? '' : 'scale-x-[-1]'}
        />
      </div>
      <div className="container mx-auto px-4">
        <h2 className="text-center text-2xl font-bold mb-2">
          {t('teachers.title')}
        </h2>
        <h3 className="text-center text-3xl font-bold mb-12">
          {t('teachers.heading')} 
          <span className="text-primary border-b-2 border-primary pb-1">
            {t('teachers.platform')}
          </span>
        </h3>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">{t('teachers.errors.loading')}</span>
          </div>
        ) : error ? (
          <div className="alert alert-error">
            <p>{error}</p>
            <button className="btn btn-sm btn-outline" onClick={fetchTeachers}>
              {t('teachers.errors.retry')}
            </button>
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg">{t('teachers.errors.noneFound')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {teachers.slice(0, visibleTeachers).map((teacher) => (
                <TeacherCard key={teacher.id} teacher={teacher} />
              ))}
            </div>

            {visibleTeachers < teachers.length && (
              <div className="flex justify-center mt-8">
                <button
                  className="btn btn-primary rounded-full"
                  onClick={loadMoreTeachers}
                >
                  {t('teachers.loadMore')}
                  <ChevronLeft className={`h-4 w-4 ${isRTL ? 'mr-2' : 'ml-2 rotate-180'}`} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}