import React from "react";

const LanguageCourseCard = React.memo(
  ({
    isRTL,
    title,
    subtitle,
    rating = 0,
    imageUrl = "/languagedetails.png"
    // buttonText = "View Details",
  }) => {
    const stars = Array(5)
      .fill(0)
      .map((_, i) => i < rating);

    return (
      <div
        className={`card card-side bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-300 w-full max-w-3xl ${
          isRTL ? "flex-row-reverse" : ""
        }`}
      >
        <figure className="w-1/3 sm:w-2/5 relative">
          <img
            src={imageUrl}
            alt="Language Course"
            className="w-full h-full object-cover"
          />
        </figure>

        <div className="card-body w-2/3 sm:w-3/5 p-4 sm:p-6">
          <div className={isRTL ? "text-right" : "text-left"}>
            <h2 className="card-title text-lg sm:text-xl font-bold text-primary">
              {title}
            </h2>
            <p className="text-sm sm:text-base text-base-content/80 mt-1">
              {subtitle}
            </p>
            <div className="rating rating-xs sm:rating-sm mt-2">
              {stars.map((filled, index) => (
                <input
                  key={index}
                  type="radio"
                  name="rating"
                  className={`mask mask-star-2 ${
                    filled ? "bg-yellow-400" : "bg-gray-300"
                  }`}
                  checked={filled}
                  readOnly
                />
              ))}
            </div>
            <div className="card-actions justify-end mt-4">
              {/* <button
                className={`btn btn-primary btn-xs sm:btn-sm ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                {buttonText}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-3 w-3 sm:h-4 sm:w-4 ${
                    isRTL ? "mr-1 sm:mr-2" : "ml-1 sm:ml-2"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={
                      isRTL
                        ? "M10 19l-7-7m0 0l7-7m-7 7h18"
                        : "M14 5l7 7m0 0l-7 7m7-7H3"
                    }
                  />
                </svg>
              </button> */}
            </div>
          </div>
        </div>
      </div>
    );
  }
)
export default LanguageCourseCard;
