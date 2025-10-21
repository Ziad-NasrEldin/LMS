"use client"
import { useState } from "react";
import { Users } from "lucide-react";
import { useTranslation } from 'react-i18next';

const CourseFilters = ({ teachers = [], groups = [], onFilterChange, isRTL }) => {
  const [activeTab, setActiveTab] = useState("department");
  const [filters, setFilters] = useState({
    department: "",
    group: "",
    semester: "",
    teacher: "",
  });
  const { t } = useTranslation("centerDashboard");

  const semesters = t('filters.semesters', { returnObjects: true });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const resetFilters = {
      department: "",
      group: "",
      semester: "",
      teacher: "",
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const handleFilterChange = (key, value) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  return (
    <div className="rounded-lg p-4 shadow-sm bg-base-100">
      <h2 className={`${isRTL ? "text-end" : "text-start"} text-xl font-bold text-base-content mb-4`}>
        {t('schedule.title')}
      </h2>

      {/* Filter Tabs */}
      <div className={`w-full flex flex-col sm:flex-row ${isRTL ? 'sm:justify-end' : 'sm:justify-start'} mb-6`}>
        <div className={`flex flex-wrap gap-1 sm:gap-3 ${isRTL ? 'sm:flex-row-reverse justify-end' : 'sm:flex-row justify-start'}`}>
          {["department", "group", "semester", "teacher"].map((tab) => (
            <button
              key={tab}
              className={`min-w-[120px] px-3 py-2.5 text-sm transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-primary/10 text-primary font-bold rounded-lg border-2 border-primary'
                  : 'text-base-content/70 hover:text-primary hover:bg-base-200/50 border-2 border-transparent'
              }`}
              onClick={() => handleTabChange(tab)}
            >
              {t(`filters.${tab}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Department Filter */}
      {activeTab === 'department' && (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isRTL ? 'text-right' : 'text-left'}`}>
          <div>
            <label className="block mb-2 font-medium text-base-content">
              {t('filters.section')}
            </label>
            <select
              className="select select-bordered w-full bg-base-200"
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
            >
              <option value="">{t('filters.select_section')}</option>
              {Object.entries(t('subjects', { returnObjects: true })).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium text-base-content">
              {t('filters.group')}
            </label>
            <select
              className="select select-bordered w-full bg-base-200"
              value={filters.group}
              onChange={(e) => handleFilterChange('group', e.target.value)}
            >
              <option value="">{t('filters.select_group')}</option>
              {groups.map(group => (
                <option key={group} value={group}>
                  {t('filters.group_label', { group })}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Group Filter */}
      {activeTab === 'group' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div
              key={group}
              className={`card bg-base-200 hover:bg-base-300 cursor-pointer p-4 text-center ${
                filters.group === group ? 'bg-primary/10 border-2 border-primary' : ''
              }`}
              onClick={() => handleFilterChange('group', group)}
            >
              <h3 className="font-medium">
                {t('filters.group_label', { group })}
              </h3>
            </div>
          ))}
        </div>
      )}

      {/* Teacher Filter */}
      {activeTab === 'teacher' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teachers.map((teacher) => (
            <div
              key={teacher.name}
              className={`bg-base-200 p-4 rounded-md cursor-pointer hover:bg-base-300 ${
                filters.teacher === teacher.name ? 'bg-primary/10 border-2 border-primary' : ''
              }`}
              onClick={() => handleFilterChange('teacher', teacher.name)}
            >
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <h3 className="font-medium text-lg">
                  {t('teacher.name_format', { name: teacher.name })}
                </h3>
                <div className={`flex items-center mt-2 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-sm">
                    {t('filters.group_label', { group: teacher.group })}
                  </span>
                  <Users className={`w-4 h-4 ${isRTL ? 'mr-1' : 'ml-1'}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Semester Filter */}
      {activeTab === 'semester' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {semesters.map((semester, index) => (
            <div
              key={index}
              className={`card bg-base-200 hover:bg-base-300 cursor-pointer p-4 text-center ${
                filters.semester === semester ? 'bg-primary/10 border-2 border-primary' : ''
              }`}
              onClick={() => handleFilterChange('semester', semester)}
            >
              <h3 className="font-medium">{semester}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseFilters;