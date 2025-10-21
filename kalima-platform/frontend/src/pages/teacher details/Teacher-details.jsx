"use client"

import { useTranslation } from 'react-i18next';
import { useState, useEffect } from "react"
import { Clock, Loader } from "lucide-react"
import { useParams } from "react-router-dom"
import { getUserById } from "../../routes/fetch-users"
import { getContainersByLecturerId } from "../../routes/lectures"

const TeacherInfoHeader = () => {
  const { t, i18n } = useTranslation("teacherDetails");
  const isRTL = i18n.language === 'ar';
  
  return (
    <div className="w-full flex flex-col items-center py-16 md:py-32 -z-10 absolute top-0">
      <div className="flex items-center gap-x-2">
        <img className="h-1 mt-4" src="/Line 5.png" alt="" />
        <h1 className="text-center text-xl md:text-2xl font-bold text-primary">
          {t('teacherInfo')}
        </h1>
      </div>
      <img className="h-auto mt-8 md:mt-16 mr-0 md:mr-56" src="/vector 21.png" alt="" />
    </div>
  )
}

const SectionHeader = ({ titleKey }) => {
  const { t } = useTranslation("teacherDetails");
  
  return (
    <div className="flex justify-center">
      <img className="h-1 mt-4 mr-2" src="/Line 5.png" alt="" />
      <h1 className="text-center text-xl md:text-2xl font-bold text-primary">
        {t(titleKey)}
      </h1>
    </div>
  )
}

const CourseCard = ({ course, index }) => {
  const { t, i18n } = useTranslation("teacherDetails");
  const isRTL = i18n.language === 'ar';

  return (
    <div className={`rounded-lg overflow-hidden border-2 border-warning z-10 hover:scale-105 hover:shadow-xl shadow-lg duration-500 w-full max-w-md mx-auto relative ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className="relative">
        <img
          src={`/course-4.png`}
          alt={course.title}
          className="w-full h-32 sm:h-36 object-cover"
        />
        <div className="absolute left-2 bottom-[-70px]">
          <img src="/Frame 81.png" alt="" className="h-12 w-12" />
        </div>
        <div className="flex flex-row gap-x-2 absolute right-2 bottom-[-100px]">
          <img src="/teacher.png" alt="" className="h-6 w-6" />
        </div>
      </div>
      <div className="p-3 text-right">
        <h4 className="font-bold text-md mb-1">{course.title}</h4>
        <h5 className="text-sm">
          {course.subject}-{course.class}
        </h5>
        <div className="flex justify-end">
          <div className="flex items-start justify-evenly gap-1 mb-2 rounded-xl w-36 mt-2">
            <h4 className="text-xs">{course.grade}</h4>
            <div className="w-5 h-5 rounded-full bg-transparent flex items-start justify-evenly">
              <img src="/school.png" alt="" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const SocialMediaIcons = () => (
  <div className="flex flex-row gap-x-2 mt-4 md:mt-9 justify-center md:justify-start ml-0 md:ml-8 size-auto md:size-80">
    {[76, 77, 78, 79].map((num) => (
      <div key={num}>
        <img src={`/Frame ${num}.png`} alt={`Social media ${num}`} className="w-8 h-8" />
      </div>
    ))}
  </div>
)

const TeacherProfileImage = () => (
  <div className="indicator">
    <img
      className="indicator-item indicator-top indicator-start animate-float-up-dottedball badge bg-transparent border-transparent h-[120px] w-[85px] md:h-[240px] md:w-[170px] mt-[-80px] md:mt-[-160px] floating ml-[-20px] md:ml-[-40px]"
      src="/rDots.png"
      alt=""
    />
    <img
      className="indicator-item indicator-top indicator-center animate-float-zigzag badge bg-transparent border-transparent h-[30px] w-[65px] md:h-[60px] md:w-[130px] mt-[-70px] md:mt-[-140px]"
      src="/waves.png"
      alt=""
    />
    <img
      className="indicator-item indicator-top indicator-end badge animate-float-up-dottedball bg-transparent border-transparent h-[70px] w-[60px] md:h-[140px] md:w-[120px] mt-[-65px] md:mt-[-130px] mr-[-27px] md:mr-[-55px]"
      src="/ring.png"
      alt=""
    />
    <img
      className="h-[40px] w-[40px] md:h-[80px] md:w-[80px] indicator-item indicator-bottom indicator-start animate-float-down-dottedball badge bg-transparent border-transparent ml-[-15px] md:ml-[-30px] mb-[-55px] md:mb-[-110px]"
      src="/ball.png"
      alt=""
    />
    <img
      className="indicator-item indicator-bottom indicator-end mr-[-25px] md:mr-[-50px] bg-transparent animate-float-down-dottedball border-transparent h-[120px] w-[85px] md:h-[240px] md:w-[170px] mb-[-10px] md:mb-[-20px] z-0"
      src="/bDots.png"
      alt=""
    />

    <div className="relative z-10 grid h-[150px] w-[150px] md:h-[300px] md:w-[300px] place-items-center mx-auto">
      <img className="h-full w-full" src="/Ellipse 103.png" alt="" />
    </div>
  </div>
)

export default function TeacherDetails() {
  const { t, i18n } = useTranslation("teacherDetails");
  const isRTL = i18n.language === 'ar';
  const [teacher, setTeacher] = useState(null);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { userId } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setError(t('error.invalid_user_id'));
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const teacherResult = await getUserById(userId);
        
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className={isRTL ? 'mr-2' : 'ml-2'}>
          {t('error.loading')}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="alert alert-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="alert alert-warning">
          <p>{t('error.notFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden py-20 md:py-40" dir={isRTL ? 'rtl' : 'ltr'}>
      <TeacherInfoHeader />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-32">
        <div className="flex flex-col md:flex-row items-center">
          {/* Left side with image */}
          <div className="w-full md:w-1/2 relative mb-8 md:mb-0">
            <div className="relative z-10 w-full h-full">
              <TeacherProfileImage />
              <SocialMediaIcons />
            </div>
          </div>

          {/* Right side with text */}
          <div className={`w-full md:w-1/2 ${isRTL ? 'text-right' : 'text-left'} md:mb-0 mb-12`}>
            <h2 className="text-lg md:text-xl font-bold text-primary mb-2">/{teacher.role}</h2>
            <h1 className="text-2xl md:text-4xl font-bold mb-2">{teacher.name}</h1>

            <div className="flex flex-row justify-end gap-x-3 mt-4 mb-4">
              <div>
                <h3 className="font-bold text-sm md:text-base">
                  {t('subject')} {teacher.expertise}
                </h3>
              </div>
            </div>

            <div className="flex justify-end">
              <img className="h-1 mt-4 mr-2" src="/Line 5.png" alt="" />
              <h1 className="text-center text-xl md:text-2xl font-bold text-primary mb-5">
                {t('bioHeader')}
              </h1>
            </div>
            <div className="flex justify-end">
              <p className="font-semibold text-base md:text-xl w-full md:w-auto">
                {teacher.bio || t('bioTemplate', {
                  name: teacher.name,
                  expertise: teacher.expertise || t('defaultSubject')
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 md:mt-16">
        <SectionHeader titleKey="coursesHeader" />
        <div className="flex justify-center md:justify-start md:ml-28">
          <img src="/vector22.png" alt="" className="h-auto w-16 md:w-auto" />
        </div>
      </div>
      <div className="relative py-8 md:py-16">
        {/* Background dots */}
        <img className="absolute top-0 animate-float-up-dottedball right-4 md:right-16 z-0 opacity-100 h-[120px] w-[85px] md:h-[240px] md:w-[170px]" src="/bDots.png" alt="" />
        <img className="absolute top-1/3 animate-float-up-dottedball left-4 md:left-16 z-0 opacity-100 h-[120px] w-[85px] md:h-[240px] md:w-[170px]" src="/bDots.png" alt="" />

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mx-auto px-4 max-w-7xl">
          {containers.length > 0 ? (
            containers.map((container) => (
              <div key={container._id} className="flex justify-center">
                <CourseCard 
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
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-10">
              <p>{t('noCoursesAvailable')}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}