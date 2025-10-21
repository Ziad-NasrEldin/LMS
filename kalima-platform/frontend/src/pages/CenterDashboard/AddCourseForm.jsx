import { useState, useEffect } from "react";
import { PlusCircle, ChevronDown, X } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { addNewLesson } from "../../routes/center";
import { getAllSubjects } from "../../routes/courses";
import { getAllLevels } from "../../routes/levels";

const AddCourseForm = ({ isOpen, onClose, selectedCenter, lecturers, onCourseAdded }) => {
  const { t, i18n } = useTranslation("centerDashboard");
  const isRTL = i18n.language === "ar";
  const dir = isRTL ? "rtl" : "ltr";
  
  const [formData, setFormData] = useState({
    subject: "",
    lecturer: "",
    level: "",
    startTime: "",
    duration: "60",
    centerId: selectedCenter?._id || ""
  });

  const [levels, setLevels] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dataLoading, setDataLoading] = useState({
    levels: true,
    subjects: true
  });
  // Fetch levels and subjects
  useEffect(() => {
    const fetchData = async () => {
      // Fetch levels
      try {
        setDataLoading(prev => ({ ...prev, levels: true }));
        const levelsResponse = await getAllLevels();
        if (levelsResponse.success) {
          setLevels(levelsResponse.data.levels || []);
        } else {
          console.error("Error fetching levels:", levelsResponse.error);
        }
      } catch (err) {
        console.error("Error fetching levels:", err);
      } finally {
        setDataLoading(prev => ({ ...prev, levels: false }));
      }
      
      // Fetch subjects
      try {
        setDataLoading(prev => ({ ...prev, subjects: true }));
        const subjectsResponse = await getAllSubjects();
        if (subjectsResponse.success) {
          setSubjects(subjectsResponse.data);
        } else {
          console.error("Error fetching subjects:", subjectsResponse.error);
        }
      } catch (err) {
        console.error("Error fetching subjects:", err);
      } finally {
        setDataLoading(prev => ({ ...prev, subjects: false }));
      }
    };

    if (isOpen) {
      fetchData();
      // Update centerId when selectedCenter changes
      setFormData(prev => ({
        ...prev,
        centerId: selectedCenter?._id || ""
      }));
    }
  }, [isOpen, selectedCenter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formattedDate = new Date(formData.startTime).toISOString().split('T')[0];
      const payload = {
        subject: formData.subject,
        lecturer: formData.lecturer,
        level: formData.level,
        startTime: formattedDate,
        duration: parseInt(formData.duration),
        centerId: formData.centerId
      };

      const response = await addNewLesson(payload);

      if (response.status === "success") {
        alert(t('addCourseForm.successMessage'));
        setFormData({
          subject: "",
          lecturer: "",
          level: "",
          startTime: "",
          duration: "60",
          centerId: selectedCenter?._id || ""
        });
        if (onCourseAdded) onCourseAdded();
        if (onClose) onClose();
      } else {
        throw new Error(response.message || t('addCourseForm.errors.general'));
      }
    } catch (err) {
      setError(err.message || t('addCourseForm.errors.general'));
      console.error("Error adding lesson:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir={dir}>
      <div className="bg-base-100 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-base-100 p-4 border-b border-base-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {t('addCourseForm.title')}
          </h2>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm btn-circle" 
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {/* Subject Selection */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium">
                {t('addCourseForm.labels.subject')}
              </span>
            </label>
            <div className="relative">
              {dataLoading.subjects ? (
                <div className="skeleton h-12 w-full rounded-lg"></div>
              ) : (
                <select
                  name="subject"
                  className="select select-bordered w-full"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                >
                  <option value="">{t('addCourseForm.selectPlaceholder.subject')}</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              )}
              <ChevronDown className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-base-content/70 ${isRTL ? "left-3" : "right-3"}`} />
            </div>
          </div>

          {/* Lecturer Selection */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium">
                {t('addCourseForm.labels.lecturer')}
              </span>
            </label>
            <div className="relative">
              <select
                name="lecturer"
                className="select select-bordered w-full"
                value={formData.lecturer}
                onChange={handleChange}
                required
              >
                <option value="">{t('addCourseForm.selectPlaceholder.lecturer')}</option>
                {lecturers.map((lecturer) => (
                  <option key={lecturer._id} value={lecturer._id}>
                    {lecturer.name}
                  </option>
                ))}
              </select>
              <ChevronDown className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-base-content/70 ${isRTL ? "left-3" : "right-3"}`} />
            </div>
          </div>

          {/* Level Selection */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium">
                {t('addCourseForm.labels.level')}
              </span>
            </label>
            <div className="relative">
              {dataLoading.levels ? (
                <div className="skeleton h-12 w-full rounded-lg"></div>
              ) : (
                <select
                  name="level"
                  className="select select-bordered w-full"
                  value={formData.level}
                  onChange={handleChange}
                  required
                >
                  <option value="">{t('addCourseForm.selectPlaceholder.level')}</option>
                  {levels.map((level) => (
                    <option key={level._id} value={level._id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              )}
              <ChevronDown className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-base-content/70 ${isRTL ? "left-3" : "right-3"}`} />
            </div>
          </div>

          {/* Start Date */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium">
                {t('addCourseForm.labels.startDate')}
              </span>
            </label>
            <input
              name="startTime"
              type="date"
              className="input input-bordered w-full"
              value={formData.startTime}
              onChange={handleChange}
              required
            />
          </div>

          {/* Duration */}
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-medium">
                {t('addCourseForm.labels.duration')}
              </span>
            </label>
            <input
              name="duration"
              type="number"
              min="30"
              className="input input-bordered w-full"
              value={formData.duration}
              onChange={handleChange}
              required
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {t('addCourseForm.saving')}
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5" />
                {t('addCourseForm.submitButton')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCourseForm;