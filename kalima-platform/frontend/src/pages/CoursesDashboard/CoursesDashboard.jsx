import React from "react";
import CourseManagementSection from "./CourseManagementSection";
import AssistantsSection from "./AssistantsSection";
import CourseSection from "./CourseSection";
import ReviewCoursesSection from "./ReviewCoursesSection";





function CoursesDashboard() {
  return (
    <div className="w-full overflow-x-hidden p-4 sm:p-8 md:p-14">
      <CourseManagementSection />
      <AssistantsSection />
      {/* <CourseSection /> */}
      {/* <ReviewCoursesSection /> */}
    </div>
  );
}

export default CoursesDashboard;