"use client"

const AssistantForm = ({ userData, handleChange, lecturers, t, isRTL }) => {
  return (
    <div className="form-control">
      <div className="flex flex-col gap-4">
        <label className="label">
          <span className="label-text">{t("fields.assignedLecturer")}</span>
        </label>
        <select
          name="assignedLecturer"
          className="select select-bordered"
          value={userData.assignedLecturer || ""}
          onChange={handleChange}
          required
        >
          <option value="">{t("placeholders.selectLecturer")}</option>
          {lecturers.map((lecturer) => (
            <option key={lecturer._id} value={lecturer._id}>
              {lecturer.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default AssistantForm
