import React, { useState, useEffect } from 'react';
import { getAllLecturers, getAllAssistants, getAllParents, getAllStudents } from '../../../../routes/fetch-users';
import { useTranslation } from 'react-i18next';
import { designTokens } from "../../../../constants/designTokens";

const toList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

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
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [lecturerResult, assistantResult, parentResult, studentResult] = await Promise.allSettled([
          getAllLecturers(),
          getAllAssistants(),
          getAllParents(),
          getAllStudents(),
        ]);

        if (!isMounted) return;

        const resolveResult = (result) => {
          if (result.status !== "fulfilled") return { list: [], failed: true };
          if (!result.value?.success) return { list: [], failed: true };
          return { list: toList(result.value.data), failed: false };
        };

        const lecturersState = resolveResult(lecturerResult);
        const assistantsState = resolveResult(assistantResult);
        const parentsState = resolveResult(parentResult);
        const studentsState = resolveResult(studentResult);

        setLecturers(lecturersState.list);
        setAssistants(assistantsState.list);
        setParents(parentsState.list);
        setStudents(studentsState.list);

        const failedCount = [
          lecturersState.failed,
          assistantsState.failed,
          parentsState.failed,
          studentsState.failed,
        ].filter(Boolean).length;

        if (failedCount > 0) {
          setError(
            t('admin.errors.fetchUsers', {
              defaultValue: isRTL ? 'تعذر تحميل بعض بيانات المستخدمين' : 'Some user data could not be loaded',
            }),
          );
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (isMounted) {
          setError(
            t('admin.errors.fetchUsers', {
              defaultValue: isRTL ? 'فشل في تحميل بيانات المستخدمين' : 'Failed to load user data',
            }),
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [isRTL, t]);

  const TOKENS = designTokens.colors;
  const SHADOWS = designTokens.shadows;

  return (
    <div className="mx-auto w-full font-[Cairo]">
    <h1 className={`text-3xl font-extrabold mb-2 ${isRTL ? 'text-right' : 'text-left'} `} style={{ color: TOKENS.deepTeal }}>{t('admin.pageTitle')}</h1>
    <p className={`mb-8 text-base font-medium ${isRTL ? 'text-right' : 'text-left'}`} style={{ color: TOKENS.slateText }}>
      {t('admin.quickAnalyticsSubtitle')}
    </p>

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
          <div className="relative z-10 flex items-center justify-between gap-4 p-6 md:p-8">
            <div className={`${isRTL ? 'text-right' : 'text-left'} min-w-0 flex-1`}>
              <h2 className="text-lg font-bold leading-snug md:text-xl" style={{ color: TOKENS.deepTeal }}>{t('admin.students')}</h2>
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

        {/* Assigned Lecturers Card */}
        <div 
          className="relative overflow-hidden rounded-[2rem] border transition-transform duration-300 hover:-translate-y-1"
          style={{
            background: TOKENS.neutralCloud,
            borderColor: "rgba(17,24,39,0.08)",
            boxShadow: SHADOWS.level1,
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F39A3F] opacity-10 rounded-bl-[100px] pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between gap-4 p-6 md:p-8">
            <div className={`${isRTL ? 'text-right' : 'text-left'} min-w-0 flex-1`}>
              <h2 className="text-lg font-bold leading-snug md:text-xl" style={{ color: TOKENS.deepTeal }}>{t('admin.assignedLecturers')}</h2>
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
          <div className="relative z-10 flex items-center justify-between gap-4 p-6 md:p-8">
            <div className={`${isRTL ? 'text-right' : 'text-left'} min-w-0 flex-1`}>
              <h2 className="text-lg font-bold leading-snug md:text-xl" style={{ color: TOKENS.deepTeal }}>{t('admin.assistants')}</h2>
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
          <div className="relative z-10 flex items-center justify-between gap-4 p-6 md:p-8">
            <div className={`${isRTL ? 'text-right' : 'text-left'} min-w-0 flex-1`}>
              <h2 className="text-lg font-bold leading-snug md:text-xl" style={{ color: TOKENS.deepTeal }}>{t('admin.parents')}</h2>
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
