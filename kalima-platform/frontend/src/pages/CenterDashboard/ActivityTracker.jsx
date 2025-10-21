import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getAllAttendance } from "../../routes/center";

const ActivityTracker = ({ lessonId, students }) => {
  const { t, i18n } = useTranslation("centerDashboard");
  const isRTL = i18n.language === "ar";
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAllAttendance();
        if (response.status === "success") {
          // Filter attendance records for the specific lesson
          const filteredAttendance = response.data.data.filter(
            (attendance) => attendance.lesson._id === lessonId
          );
          setAttendanceData(filteredAttendance);
        } else {
          throw new Error(response.message || "Failed to fetch attendance data");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) {
      fetchAttendance();
    }
  }, [lessonId]);

  // Format date based on locale
  const formatDate = (date) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat(i18n.language, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-lg p-4 md:p-6" dir={isRTL ? "rtl" : "ltr"}>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-x-2 mt-1">
              <span className="text-xl font-bold text-base-content">
                {t("activityTracker.statusCounts.present", {
                  count: attendanceData.filter(
                    (a) => a.examStatus === "passed"
                  ).length,
                })}
              </span>
              <span className="text-sm text-base-content">
                {t("activityTracker.statusCounts.absent", {
                  count: attendanceData.filter(
                    (a) => !a.examStatus || a.examStatus !== "passed"
                  ).length,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="loading loading-spinner loading-md"></div>
          </div>
        ) : error ? (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        ) : attendanceData.length > 0 ? (
          <table className="table w-full">
            <thead>
              <tr className="border-b border-base-200">
                <th className={isRTL ? "text-right" : "text-left"}>Student ID</th>
                <th className={isRTL ? "text-right" : "text-left"}>Lesson Start Time</th>
                <th className={isRTL ? "text-right" : "text-left"}>Center Name</th>
                <th className={isRTL ? "text-right" : "text-left"}>Lecturer Name</th>
                <th className={isRTL ? "text-right" : "text-left"}>Subject</th>
                <th className={isRTL ? "text-right" : "text-left"}>Level</th>
                <th className={isRTL ? "text-right" : "text-left"}>Attendance Date</th>
                <th className={isRTL ? "text-right" : "text-left"}>Booklet Purchased</th>
                <th className={isRTL ? "text-right" : "text-left"}>Payment Type</th>
                <th className={isRTL ? "text-right" : "text-left"}>Amount Paid</th>
                <th className={isRTL ? "text-right" : "text-left"}>Sessions Paid For</th>
                <th className={isRTL ? "text-right" : "text-left"}>Remaining Sessions</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((attendance) => (
                <tr
                  key={attendance._id}
                  className="hover:bg-base-200 border-b border-base-200"
                >
                  <td>{attendance.studentSequencedId}</td>
                  <td>{formatDate(attendance.lesson.startTime)}</td>
                  <td>{attendance.center.name}</td>
                  <td>{attendance.lecturer.name}</td>
                  <td>{attendance.subject.name}</td>
                  <td>{attendance.level.name}</td>
                  <td>{formatDate(attendance.attendanceDate)}</td>
                  <td>
                    <span className={`badge ${attendance.isBookletPurchased ? "badge-success" : "badge-error"}`}>
                      {attendance.isBookletPurchased ? t("activityTracker.status.yes") : t("activityTracker.status.no")}
                    </span>
                  </td>
                  <td>{attendance.paymentType}</td>
                  <td>{attendance.amountPaid}</td>
                  <td>{attendance.sessionsPaidFor}</td>
                  <td>{attendance.sessionsRemaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-base-content/70">
            {t("activityTracker.noResults")}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTracker;