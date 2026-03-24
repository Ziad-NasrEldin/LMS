import React, { useState, useEffect } from 'react';
import { getAllLecturers, getAllAssistants, getAllParents, getAllStudents } from '../../../../routes/fetch-users';
import { useTranslation } from 'react-i18next';
import { designTokens } from "../../../../constants/designTokens";

const Hero = () => {
  const { t, i18n } = useTranslation('admin');
  // ... rest of state
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

  const TOKENS = designTokens.colors;
  const SHADOWS = designTokens.shadows;
  const GRADIENTS = designTokens.gradients;

  return (
    <div className="mx-auto w-full font-[Cairo]">
    <h1 className={`text-3xl font-extrabold mb-8 ${isRTL ? 'text-right' : 'text-left'} `} style={{ color: TOKENS.deepTeal }}>{t('admin.pageTitle')}</h1>

      {error && (
        <div className="p-4 mb-6 rounded-2xl bg-red-50 text-red-600 border border-red-100 font-semibold shadow-sm">
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" dir={dir}>
        {/* Students Card */}
        <div 
          className="relative overflow-hidden rounded-[2rem] border transition-transform duration-300 hover:-translate-y-1"
          style={{
            background: TOKENS.neutralCloud,
            borderColor: "rgba(17,24,39,0.08)",
            boxShadow: SHADOWS.level1,
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#4DB3C2] opacity-10 rounded-bl-[100px] pointer-events-none" />
          <div className="p-6 md:p-8 flex items-center justify-between relative z-10">
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h2 className="text-xl font-bold opacity-80" style={{ color: TOKENS.deepTeal }}>{t('admin.students')}</h2>
              <p className="text-4xl font-extrabold mt-2" style={{ color: TOKENS.inkText }}>
                {loading ? (
                  <span className="loading loading-dots loading-sm"></span>
                ) : (
                  students.length
                )}
              </p>
            </div>
            <div 
              className="flex items-center justify-center w-14 h-14 rounded-[1.2rem] shadow-sm shrink-0"
              style={{ background: TOKENS.lightAquaMist }}
            >
              <img src="/admin2.png" alt="Students Icon" className="w-8 h-8 object-contain" />
            </div>
          </div>
        </div>

        {/* Teachers Card */}
        <div 
          className="relative overflow-hidden rounded-[2rem] border transition-transform duration-300 hover:-translate-y-1"
          style={{
            background: TOKENS.neutralCloud,
            borderColor: "rgba(17,24,39,0.08)",
            boxShadow: SHADOWS.level1,
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F39A3F] opacity-10 rounded-bl-[100px] pointer-events-none" />
          <div className="p-6 md:p-8 flex items-center justify-between relative z-10">
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h2 className="text-xl font-bold opacity-80" style={{ color: TOKENS.deepTeal }}>{t('admin.teachers')}</h2>
              <p className="text-4xl font-extrabold mt-2" style={{ color: TOKENS.inkText }}>
                {loading ? (
                  <span className="loading loading-dots loading-sm"></span>
                ) : (
                  lecturers.length
                )}
              </p>
            </div>
            <div 
              className="flex items-center justify-center w-14 h-14 rounded-[1.2rem] shadow-sm shrink-0"
              style={{ background: "rgba(243, 154, 63, 0.15)" }}
            >
              <img src="/admin1.png" alt="Teachers Icon" className="w-8 h-8 object-contain" />
            </div>
          </div>
        </div>

        {/* Assistants Card */}
        <div 
          className="relative overflow-hidden rounded-[2rem] border transition-transform duration-300 hover:-translate-y-1"
          style={{
            background: TOKENS.neutralCloud,
            borderColor: "rgba(17,24,39,0.08)",
            boxShadow: SHADOWS.level1,
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#EBC468] opacity-15 rounded-bl-[100px] pointer-events-none" />
          <div className="p-6 md:p-8 flex items-center justify-between relative z-10">
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h2 className="text-xl font-bold opacity-80" style={{ color: TOKENS.deepTeal }}>{t('admin.assistants')}</h2>
              <p className="text-4xl font-extrabold mt-2" style={{ color: TOKENS.inkText }}>
                {loading ? (
                  <span className="loading loading-dots loading-sm"></span>
                ) : (
                  assistants.length
                )}
              </p>
            </div>
            <div 
              className="flex items-center justify-center w-14 h-14 rounded-[1.2rem] shadow-sm shrink-0"
              style={{ background: "rgba(235, 196, 104, 0.25)" }}
            >
              <img src="/admin3.png" alt="Assistants Icon" className="w-8 h-8 object-contain" />
            </div>
          </div>
        </div>

        {/* Parents Card */}
        <div 
          className="relative overflow-hidden rounded-[2rem] border transition-transform duration-300 hover:-translate-y-1"
          style={{
            background: TOKENS.neutralCloud,
            borderColor: "rgba(17,24,39,0.08)",
            boxShadow: SHADOWS.level1,
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#146A78] opacity-10 rounded-bl-[100px] pointer-events-none" />
          <div className="p-6 md:p-8 flex items-center justify-between relative z-10">
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h2 className="text-xl font-bold opacity-80" style={{ color: TOKENS.deepTeal }}>{t('admin.parents')}</h2>
              <p className="text-4xl font-extrabold mt-2" style={{ color: TOKENS.inkText }}>
                {loading ? (
                  <span className="loading loading-dots loading-sm"></span>
                ) : (
                  parents.length
                )}
              </p>
            </div>
            <div 
              className="flex items-center justify-center w-14 h-14 rounded-[1.2rem] shadow-sm shrink-0"
              style={{ background: "rgba(20, 106, 120, 0.1)" }}
            >
              <img src="/admin4.png" alt="Parents Icon" className="w-8 h-8 object-contain" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;