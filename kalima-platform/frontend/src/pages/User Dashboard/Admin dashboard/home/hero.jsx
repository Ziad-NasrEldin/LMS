import React, { useState, useEffect } from 'react';
import { getAllLecturers, getAllAssistants, getAllParents, getAllStudents } from '../../../../routes/fetch-users';
import { useTranslation } from 'react-i18next';

const Hero = () => {
  const { t, i18n } = useTranslation('admin');
  const [lecturers, setLecturers] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isRTL = i18n.language === 'ar'; 
  const dir = isRTL ? 'rtl' : 'ltr';

  useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data one at a time (sequentially)
      const lecturerResponse = await getAllLecturers();
      if (!lecturerResponse.success) {
        throw new Error("Failed to fetch lecturers");
      }
      setLecturers(lecturerResponse.data);

      const assistantResponse = await getAllAssistants();
      if (!assistantResponse.success) {
        throw new Error("Failed to fetch assistants");
      }
      setAssistants(assistantResponse.data);

      const parentResponse = await getAllParents();
      if (!parentResponse.success) {
        throw new Error("Failed to fetch parents");
      }
      setParents(parentResponse.data);

      const studentResponse = await getAllStudents();
      if (!studentResponse.success) {
        throw new Error("Failed to fetch students");
      }
      setStudents(studentResponse.data);
      
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError(error.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
 // Empty dependency array means this runs once on mount

  return (
    <div className="mx-auto p-6 w-full font-[Cairo]">
    <h1 className={`text-3xl font-bold mb-8 ${isRTL ? 'text-right' : 'text-left'} `}>{t('admin.pageTitle')}</h1>

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" dir={dir}>
        {/* Students Card */}
        <div className="card bg-[#f3e8ff] shadow-lg hover:shadow-xl hover:scale-105 duration-500 transition-all rounded-2xl max-w-md">
          <div className="card-body p-6 flex-row justify-between items-center">
            <div className="text-right">
              <h2 className="text-2xl font-bold text-purple-900">{t('admin.students')}</h2>
              <p className="text-3xl font-bold text-purple-900">
                {loading ? (
                  <span className="loading loading-dots loading-sm"></span>
                ) : (
                  students.length
                )}
              </p>
            </div>
            <div className="avatar p-3 rounded-full">
              <img src="/admin2.png" alt="Students Icon" className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Teachers Card */}
        <div className="card bg-[#e8f4ff] rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 duration-500 transition-all max-w-md">
          <div className="card-body p-6 flex-row justify-between items-center">
            <div className="text-right">
              <h2 className="text-2xl font-bold text-blue-700">{t('admin.teachers')}</h2>
              <p className="text-3xl font-bold text-blue-700">
                {loading ? (
                  <span className="loading loading-dots loading-sm"></span>
                ) : (
                  lecturers.length
                )}
              </p>
            </div>
            <div className="avatar p-3 rounded-full">
              <img src="/admin1.png" alt="Teachers Icon" className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Assistants Card */}
        <div className="card bg-[#ffece5] shadow-lg hover:shadow-xl hover:scale-105 duration-500 transition-all rounded-2xl max-w-md">
          <div className="card-body p-6 flex-row justify-between items-center">
            <div className="text-right">
              <h2 className="text-2xl font-bold text-orange-700">{t('admin.assistants')}</h2>
              <p className="text-3xl font-bold text-orange-700">
                {loading ? (
                  <span className="loading loading-dots loading-sm"></span>
                ) : (
                  assistants.length
                )}
              </p>
            </div>
            <div className="avatar p-3 rounded-full">
              <img src="/admin3.png" alt="Assistants Icon" className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Parents Card */}
        <div className="card bg-[#e8fce5] shadow-lg hover:shadow-xl hover:scale-105 duration-500 transition-all rounded-2xl max-w-md">
          <div className="card-body p-6 flex-row justify-between items-center">
            <div className="text-right">
              <h2 className="text-2xl font-bold text-green-700">{t('admin.parents')}</h2>
              <p className="text-3xl font-bold text-green-700">
                {loading ? (
                  <span className="loading loading-dots loading-sm"></span>
                ) : (
                  parents.length
                )}
              </p>
            </div>
            <div className="avatar p-3 rounded-full">
              <img src="/admin4.png" alt="Parents Icon" className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;