"use client"

import { useTranslation } from 'react-i18next';
import { useState, useEffect } from "react"
import { Loader, BookOpen, GraduationCap, Star, Award, Users } from "lucide-react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { getLecturerById } from "../../routes/fetch-users"
import { getContainersByLecturerId } from "../../routes/lectures"
import { buildCoursePath, buildTeacherPath } from "../../seo/site.mjs"
import { useSeo } from "../../seo/useSeo"
import { buildBreadcrumbSchema, buildPersonSchema } from "../../seo/structuredData.mjs"

const TeacherInfoHeader = () => {
  const { t } = useTranslation("teacherDetails");
  return (
    <div className="w-full bg-primary text-primary-content pt-20 pb-32 md:pt-28 md:pb-40 relative overflow-hidden rounded-b-[2.5rem]">
      {/* Organic layered waves/blobs (Design System Theme) */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-secondary rounded-full opacity-40 blur-[80px] mix-blend-multiply pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-info rounded-full opacity-30 blur-[60px] mix-blend-multiply pointer-events-none"></div>
      
      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 text-center">
          {t('teacherInfo')}
        </h1>
        <div className="h-1.5 w-24 bg-accent rounded-full mt-2"></div>
      </div>
    </div>
  )
}

const CourseCard = ({ course }) => {
  const { t, i18n } = useTranslation("teacherDetails");
  const isRTL = i18n.language === 'ar';

  return (
    <div className={`card bg-base-100 shadow-[0_6px_16px_rgba(0,0,0,0.10)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.14)] hover:-translate-y-1 duration-300 transition-all rounded-3xl w-full max-w-[22rem] mx-auto overflow-hidden ${isRTL ? 'text-right' : 'text-left'}`}>
      <figure className="relative h-48 bg-base-200 w-full p-2">
        <img
          src={`/course-4.png`}
          alt={course.title}
          className="w-full h-full object-cover rounded-2xl"
        />
        {/* Floating badge for rating */}
        <div className="absolute top-5 right-5 bg-base-100/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1 shadow-sm">
          <Star className="w-4 h-4 text-accent fill-accent" />
          <span>{course.rating || "5.0"}</span>
        </div>
      </figure>

      <div className="card-body p-6 flex flex-col gap-4">
        <div>
          <h3 className="card-title text-xl font-bold text-base-content mb-2 line-clamp-2 leading-snug">{course.title}</h3>
          
          <div className="flex flex-col gap-2 mt-3">
            <div className="flex items-center gap-2 text-sm text-neutral font-medium">
              <BookOpen className="w-4 h-4 text-info flex-shrink-0" />
              <span className="truncate">{course.subject} - {course.class}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral font-medium">
              <GraduationCap className="w-4 h-4 text-info flex-shrink-0" />
              <span className="truncate">{course.grade}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between mt-auto pt-4 border-t border-base-200/60 gap-3">
          <span className="text-xs font-bold text-primary bg-primary/10 px-4 py-1.5 rounded-full text-center truncate max-w-full">
            {course.type || t('courseType')}
          </span>
          <Link
            to={buildCoursePath({ _id: course.id, name: course.title })}
            className="btn btn-primary bg-accent border-none text-base-content hover:bg-accent/90 hover:scale-105 btn-sm h-10 rounded-full px-6 w-full sm:w-auto transition-transform"
          >
            {t('viewDetails', 'عرض التفاصيل')}
          </Link>
        </div>
      </div>
    </div>
  )
}

const SocialMediaIcons = () => (
  <div className="flex flex-row gap-3 mt-6 justify-center md:justify-start">
    {[76, 77, 78, 79].map((num) => (
      <button key={num} className="btn border-none btn-circle bg-base-200 shadow-sm hover:bg-info/20 hover:scale-110 transition-all duration-200 h-10 w-10 min-h-0 flex items-center justify-center">
        <img src={`/Frame ${num}.png`} alt={`Social media ${num}`} className="w-5 h-5 object-contain" />
      </button>
    ))}
  </div>
)

const TeacherProfileImage = ({ profileImage }) => (
  <div className="relative mx-auto md:mx-0 w-32 h-32 md:w-48 md:h-48 lg:w-56 lg:h-56 shrink-0 group">
    {/* Soft glowing backplates */}
    <div className="absolute inset-0 bg-accent rounded-full opacity-20 group-hover:scale-110 transition-transform duration-500 blur-md"></div>
    <div className="absolute inset-0 bg-info rounded-full opacity-20 scale-105 -translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-500 blur-md"></div>
    
    <div className="w-full h-full rounded-full overflow-hidden border-[6px] border-base-100 shadow-[0_12px_28px_rgba(0,0,0,0.12)] relative z-10 bg-base-200">
      <img 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
        src={profileImage || "/Ellipse 103.png"} 
        alt="Teacher Profile"
        onError={(e) => { e.target.src = "/Ellipse 103.png" }}
      />
    </div>
  </div>
)

export default function TeacherDetails() {
  const { t, i18n } = useTranslation("teacherDetails");
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const location = useLocation();
  const [teacher, setTeacher] = useState(null);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { userId } = useParams();
  const teacherName = String(teacher?.name || "").trim();
  const canonicalPath = teacher ? buildTeacherPath(teacher) : null;
  const seoDescription =
    String(teacher?.bio || "").trim() ||
    (teacher?.expertise
      ? isRTL
        ? `تعرّف على المعلم ${teacherName} المتخصص في ${teacher.expertise} على منصة فكرة التعليمية، واطّلع على تخصصه والدورات المرتبطة به.`
        : `Meet ${teacherName}, a ${teacher.expertise} teacher on Fekra.`
      : isRTL
        ? `تعرّف على المعلم ${teacherName} على منصة فكرة التعليمية، واطّلع على تخصصه والدورات المرتبطة به.`
        : `Meet ${teacher?.name || "this teacher"} on Fekra.`)

  useSeo(
    teacher
      ? {
          title: isRTL
            ? `${teacherName} | معلمو منصة فكرة التعليمية`
            : `${teacherName} | Fekra Teachers`,
          description: seoDescription,
          canonicalPath,
          image: teacher.profilePic || teacher.profilePicture || "/Kalima.png",
          lang: i18n.language?.startsWith("en") ? "en" : "ar",
          dir: isRTL ? "rtl" : "ltr",
          schema: [
            buildBreadcrumbSchema([
              { name: isRTL ? "الرئيسية" : "Home", path: "/" },
              { name: isRTL ? "المعلمون" : "Teachers", path: "/teachers" },
              { name: teacherName, path: canonicalPath },
            ]),
            buildPersonSchema({
              name: teacherName,
              description: seoDescription,
              path: canonicalPath,
              image: teacher.profilePic || teacher.profilePicture || "/Kalima.png",
              expertise: teacher.expertise,
            }),
          ],
        }
      : {
          title: isRTL ? "الملف التعريفي للمعلم | منصة فكرة التعليمية" : "Teacher Profile | Fekra",
          description: isRTL
            ? "اطّلع على الملفات التعريفية للمعلمين في منصة فكرة التعليمية."
            : "Browse teacher profiles on Fekra.",
          canonicalPath: location.pathname,
          lang: i18n.language?.startsWith("en") ? "en" : "ar",
          dir: isRTL ? "rtl" : "ltr",
        },
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setError(t('error.invalid_user_id'));
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const teacherResult = await getLecturerById(userId);
        
        if (teacherResult.success && teacherResult.data) {
          setTeacher(teacherResult.data);
          
          const containersData = await getContainersByLecturerId(userId);
          if (containersData?.data?.containers) {
            setContainers(containersData.data.containers);
          }
        } else {
          setError(teacherResult.error || t('error.failed'));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(t('error.failed'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, t]);

  useEffect(() => {
    if (!teacher || !canonicalPath) return;

    const normalizedCurrentPath = (location.pathname || "").replace(/\/+$/, "");
    const normalizedCanonicalPath = canonicalPath.replace(/\/+$/, "");

    if (normalizedCurrentPath !== normalizedCanonicalPath) {
      navigate(canonicalPath, { replace: true });
    }
  }, [canonicalPath, location.pathname, navigate, teacher]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-base-200/50">
        <Loader className="h-10 w-10 animate-spin text-primary" />
        <span className={`text-lg font-semibold text-primary ${isRTL ? 'mr-3' : 'ml-3'}`}>
          {t('error.loading', 'جاري التحميل...')}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-base-200/50 p-4">
        <div className="alert alert-error max-w-md shadow-lg rounded-2xl">
          <p className="font-semibold text-center w-full">{error}</p>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex justify-center items-center h-screen bg-base-200/50 p-4">
        <div className="alert alert-warning max-w-md shadow-lg rounded-2xl">
          <p className="font-semibold text-center w-full">{t('error.notFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-base-200/30 pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
      <TeacherInfoHeader />
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        
        {/* Profile Details Card - overlapping the header */}
        <div className="relative z-20 -mt-16 md:-mt-24 bg-base-100 rounded-3xl shadow-[0_12px_28px_rgba(0,0,0,0.08)] p-6 md:p-10 mb-16 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
            
            {/* Image & Socials */}
            <div className="flex flex-col items-center shrink-0">
               <TeacherProfileImage profileImage={teacher.profilePic || teacher.profilePicture} />
               <SocialMediaIcons />
            </div>

            {/* Text details */}
            <div className={`flex flex-col flex-1 w-full ${isRTL ? 'text-right' : 'text-left'} pt-2`}>
              <div className="inline-flex items-center gap-2 mb-2 justify-center md:justify-start">
                <Award className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-bold text-accent">{teacher.role || t('lecturer', 'محاضر')}</h2>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-base-content mb-4 text-center md:text-start">
                {teacher.name}
              </h1>

              <div className="flex items-center gap-2 bg-info/10 text-info w-max px-4 py-2 rounded-full font-bold text-sm md:text-base mb-6 mx-auto md:mx-0">
                <Users className="w-5 h-5" />
                <span>{t('subject')} {teacher.expertise || t('defaultSubject')}</span>
              </div>

              <div className="mt-4 bg-base-200/50 rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-6 w-1.5 bg-primary rounded-full"></div>
                  <h3 className="text-xl md:text-2xl font-bold text-primary">
                    {t('bioHeader', 'نبذة تعريفية')}
                  </h3>
                </div>
                <p className="font-medium text-neutral leading-relaxed md:text-lg">
                  {teacher.bio || t('bioTemplate', {
                    name: teacher.name,
                    expertise: teacher.expertise || t('defaultSubject')
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Section */}
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center mb-12 relative">
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-3 relative z-10">
              {t('coursesHeader', 'الدورات المتاحة')}
            </h2>
            <div className="h-1.5 w-16 bg-accent rounded-full mb-2"></div>
          </div>

          {/* Card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 xl:gap-10">
            {containers.length > 0 ? (
              containers.map((container) => (
                <CourseCard 
                  key={container._id}
                  course={{
                    id: container._id,
                    title: container.name,
                    subject: container.subject?.name || 'Unknown Subject',
                    class: container.level?.name || 'Unknown Level',
                    grade: container.level?.name || 'Unknown Level',
                    rating: 5,
                    duration: 12,
                    type: container.type,
                  }} 
                />
              ))
            ) : (
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-16 bg-base-100 rounded-3xl shadow-sm border border-base-200">
                <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-neutral/40" />
                </div>
                <p className="text-lg text-neutral font-medium">{t('noCoursesAvailable', 'لا توجد دورات متاحة حالياً')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
