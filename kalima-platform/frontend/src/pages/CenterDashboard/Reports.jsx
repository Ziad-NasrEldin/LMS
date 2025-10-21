import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { getAllParents, sendLessonReport, sendMonthReport, sendCourseReport, getCenterDataByType, getAllAttendance } from '../../routes/center';

const Reports = ({ selectedCenter, lessonId }) => {
  const [students, setStudents] = useState([]);
  const [attendedStudents, setAttendedStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reportType, setReportType] = useState('');
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportStatus, setReportStatus] = useState('');

  // Fetch students, parents, and filter by attendance
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch students by center ID
        const studentsResponse = await getCenterDataByType(selectedCenter._id, 'students');
        if (studentsResponse.status !== 'success') {
          throw new Error(studentsResponse.message || 'Failed to fetch students');
        }

        // Fetch all parents
        const parentsResponse = await getAllParents();
        if (parentsResponse.status !== 'success') {
          throw new Error(parentsResponse.message || 'Failed to fetch parents');
        }

        // Fetch attendance data
        const attendanceResponse = await getAllAttendance();
        if (attendanceResponse.status !== 'success') {
          throw new Error(attendanceResponse.message || 'Failed to fetch attendance');
        }

        // Filter students who attended the specific lesson
        const attendanceForLesson = attendanceResponse.data.filter(
          (attendance) => attendance.lesson._id === lessonId
        );
        const attendedStudentIds = new Set(
          attendanceForLesson.map((attendance) => attendance.student.center_students_seq)
        );

        // Filter students who attended the lesson
        const filteredStudents = studentsResponse.data.filter((student) =>
          attendedStudentIds.has(student.center_students_seq)
        );

        setStudents(filteredStudents);
        setAttendedStudents(filteredStudents);
        setParents(parentsResponse.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (selectedCenter && lessonId) {
      fetchData();
    }
  }, [selectedCenter, lessonId]);

  // Handle report generation and PDF creation
  const handleGenerateReport = async () => {
    if (!selectedStudent || !reportType) {
      setReportStatus('Please select a student and report type.');
      return;
    }

    const reportData = {
      studentId: selectedStudent._id,
      notes: `Test ${reportType} report`,
      ...(reportType === 'lesson' && { lessonId }), // Use dynamic lessonId
      ...(reportType === 'month' && { courseOrmonthId: '68135d5448bafe12f30ed409' }),
      ...(reportType === 'course' && { courseOrmonthId: '6813569380afe23e19f6bd00' }),
    };

    try {
      let response;
      switch (reportType) {
        case 'lesson':
          response = await sendLessonReport(reportData);
          break;
        case 'month':
          response = await sendMonthReport(reportData);
          break;
        case 'course':
          response = await sendCourseReport(reportData);
          break;
        default:
          return;
      }

      if (response.status === 'success') {
        setReportStatus('Report generated successfully! Generating PDF...');
        generatePDF(selectedStudent, reportType, response.data);
      } else {
        throw new Error(response.message || 'Failed to generate report');
      }
    } catch (err) {
      setReportStatus(`Error: ${err.message}`);
    }
  };

  // Function to generate and download the PDF report
  const generatePDF = (student, reportType, reportData) => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(`Report for ${student.name}`, 10, 10);
    
    // Add report type
    doc.setFontSize(14);
    doc.text(`Type: ${reportType}`, 10, 20);
    
    // Add report details
    doc.setFontSize(12);
    doc.text(`Student ID: ${student._id}`, 10, 30);
    doc.text(`Notes: ${reportData.notes || 'No notes available'}`, 10, 40);
    
    // Add more details based on report type
    if (reportType === 'lesson') {
      doc.text(`Lesson ID: ${reportData.lessonId || 'N/A'}`, 10, 50);
    } else if (reportType === 'month' || reportType === 'course') {
      doc.text(`Course/Month ID: ${reportData.courseOrmonthId || 'N/A'}`, 10, 50);
    }
    
    // Save the PDF
    doc.save(`${student.name}_${reportType}_report.pdf`);
  };

  // Send WhatsApp message to the parent's phone number
  const handleSendWhatsApp = () => {
    if (!selectedStudent) return;

    const parent = parents.find(p => p.children.some(child => child._id === selectedStudent._id));
    if (parent && parent.phoneNumber) {
      const phoneNumber = parent.phoneNumber.replace('+', '');
      const message = encodeURIComponent(`Here is the ${reportType} report for ${selectedStudent.name}.`);
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    } else {
      setReportStatus('No parent phone number found for this student.');
    }
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Generate Student Report</h2>

      {/* Student Selection Dropdown */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
        <select
          className="select select-bordered w-full max-w-xs"
          value={selectedStudent?._id || ''}
          onChange={(e) => setSelectedStudent(attendedStudents.find(s => s._id === e.target.value))}
        >
          <option value="">Choose a student</option>
          {attendedStudents.map(student => (
            <option key={student._id} value={student._id}>
              {student.name}
            </option>
          ))}
        </select>
      </div>

      {/* Report Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
        <select
          className="select select-bordered w-full max-w-xs"
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
        >
          <option value="">Choose report type</option>
          <option value="lesson">Lecture Report</option>
          <option value="month">Monthly Report</option>
          <option value="course">Course Report</option>
        </select>
      </div>

      {/* Generate Report Button */}
      <button
        className="btn btn-primary mr-2"
        onClick={handleGenerateReport}
        disabled={!selectedStudent || !reportType}
      >
        Generate Report
      </button>

      {/* Send WhatsApp Button */}
      {selectedStudent && (
        <button
          className="btn btn-secondary"
          onClick={handleSendWhatsApp}
          disabled={!reportType}
        >
          Send WhatsApp
        </button>
      )}

      {/* Status Message */}
      {reportStatus && (
        <p className={`mt-4 ${reportStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
          {reportStatus}
        </p>
      )}
    </div>
  );
};

export default Reports;