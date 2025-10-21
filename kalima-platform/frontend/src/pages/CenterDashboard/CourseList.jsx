import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import CourseCard from "./CourseCard";
import { getAllLevels } from "../../routes/levels";
import { getAllSubjects } from "../../routes/courses";

const CourseList = ({ lessons, isLoading, error, onAddCourse, lecturers }) => {
  const { t, i18n } = useTranslation(['centerDashboard', 'common']);
  const isRTL = i18n.language === "ar";
  
  const [filters, setFilters] = useState({
    subject: "",
    lecturer: "",
    level: ""
  });
  
  const [subjects, setSubjects] = useState([]);
  const [levels, setLevels] = useState([]);
  const [mappedLessons, setMappedLessons] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const subjectsResponse = await getAllSubjects();
        if (subjectsResponse.success) {
          setSubjects(subjectsResponse.data);
        }
        
        const levelsResponse = await getAllLevels();
        if (levelsResponse.success) {
          setLevels(levelsResponse.data);
        }
      } catch (err) {
        console.error("Error fetching data for mapping:", err);
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (!lessons || dataLoading || isLoading) return;
    
    const subjectMap = new Map(subjects.map(subject => [subject._id, subject.name]));
    const levelMap = new Map(levels.map(level => [level._id, level.name]));
    const lecturerMap = new Map(lecturers.map(lecturer => [lecturer._id, lecturer.name]));
    
    const mapped = lessons.map((lesson, index) => {
      const startTime = new Date(lesson.startTime);
      let endTime = lesson.duration ? 
        new Date(startTime.getTime() + lesson.duration * 60000) :
        new Date(startTime.getTime() + 60 * 60000);
      
      return {
        id: lesson._id,
        subject: subjectMap.get(lesson.subject) || lesson.subject,
        subjectId: lesson.subject,
        session: (index + 1).toString(),
        type: t('courseCard.types.lecture'),
        room: t('common.na'),
        time: `${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        date: startTime.toLocaleDateString(),
        teacher: {
          name: lecturerMap.get(lesson.lecturer) || lesson.lecturer,
          id: lesson.lecturer,
          group: levelMap.get(lesson.level) || lesson.level,
          levelId: lesson.level
        },
      };
    });
    
    setMappedLessons(mapped);
    setCurrentPage(1);
  }, [lessons, subjects, levels, lecturers, dataLoading, isLoading, t]);

  const uniqueSubjects = [...new Set(mappedLessons.map(lesson => lesson.subject))];
  const uniqueLecturers = [...new Set(mappedLessons.map(lesson => lesson.teacher.name))];
  const uniqueLevels = [...new Set(mappedLessons.map(lesson => lesson.teacher.group))];

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  };

  const filteredLessons = mappedLessons.filter(lesson => {
    return (!filters.subject || lesson.subject === filters.subject) &&
           (!filters.lecturer || lesson.teacher.name === filters.lecturer) &&
           (!filters.level || lesson.teacher.group === filters.level);
  });

  const totalItems = filteredLessons.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLessons = filteredLessons.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-lg p-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">
          {t('courseList.title')}
        </h2>
        
        <div className="flex flex-wrap gap-2">
         <select 
          className="select select-bordered"
          value={filters.level}
          onChange={(e) => handleFilterChange("level", e.target.value)}
        >
          <option value="">{t('filters.allLevels')}</option>
          {levels.map(level => (
            <option key={level._id} value={level._id}>
              {t(`gradeLevels.${level.name}`, { ns: 'common' })}
            </option>
          ))}
        </select>
          
          <select 
            className="select select-bordered"
            value={filters.lecturer}
            onChange={(e) => handleFilterChange("lecturer", e.target.value)}
          >
            <option value="">{t('courseList.filters.allLecturers')}</option>
            {uniqueLecturers.map(lecturer => (
              <option key={lecturer} value={lecturer}>{lecturer}</option>
            ))}
          </select>
          
          <button 
            className="btn btn-primary"
            onClick={onAddCourse}
          >
            <PlusCircle className="w-5 h-5 mr-1" />
            {t('courseList.addLecture')}
          </button>
        </div>
      </div>
      
      {isLoading || dataLoading ? (
        <div className="flex justify-center py-8">
          <div className="loading loading-spinner loading-md"></div>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      ) : paginatedLessons.length > 0 ? (
        <div className="space-y-4">
          {paginatedLessons.map(lesson => (
            <CourseCard key={lesson.id} course={lesson} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-base-content/70">
          {t('courseList.noLessons')}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 gap-2">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            {t('courseList.pagination.previous')}
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
              <button
                key={page}
                className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            className="btn btn-outline btn-sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            {t('courseList.pagination.next')}
            {isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseList;