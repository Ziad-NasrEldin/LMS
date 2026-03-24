import React from "react";
import CourseManagementSection from "./CourseManagementSection";
import AssistantsSection from "./AssistantsSection";
function CoursesDashboard() {
  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-base-100 p-4 sm:p-8 md:p-10">
      <div className="mx-auto max-w-[1400px] space-y-8 md:space-y-10">
        <CourseManagementSection />
        <AssistantsSection />
      </div>
    </div>
  );
}

export default CoursesDashboard;