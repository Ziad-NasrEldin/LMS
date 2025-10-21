import React, { useMemo } from "react";

const CoursesOverviews = React.memo(
  ({ isRTL = false, imageUrl = "/education-banner.png" }) => {
    const content = useMemo(
      () => ({
        en: {
          title: "Browse All Courses",
          subtitle: "For All Academic Levels",
        },
        ar: {
          title: "تصفح جميع الكورسات",
          subtitle: "لجميع المراحل الدراسية",
        },
      }),
      []
    );

    const langContent = isRTL ? content.ar : content.en;

    return (
      <div
        className={`py-6 px-4 sm:py-8 sm:px-6 ${isRTL ? "font-arabic" : ""}`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="max-w-6xl mx-auto">
          <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
            <div
              className={`flex flex-col md:flex-row ${
                isRTL ? "md:flex-row-reverse" : ""
              } items-center`}
            >
              <div className="w-full md:w-2/5 p-4 sm:p-5 flex">
                <div className="relative w-[200px] sm:w-[240px] md:w-[280px]">
                  <img
                    src={imageUrl}
                    alt={langContent.title}
                    className="w-full h-auto object-contain rounded-md"
                    loading="lazy"
                  />
                </div>
              </div>
              <div
                className={`w-full md:w-3/5 p-4 sm:p-6 ${
                  isRTL ? "md:text-right" : "md:text-left"
                }`}
              >
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-2">
                  {langContent.title}
                </h2>
                <p
                  className={`text-sm sm:text-base text-primary ${
                    isRTL ? "leading-loose" : ""
                  }`}
                >
                  {langContent.subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
export default CoursesOverviews;
