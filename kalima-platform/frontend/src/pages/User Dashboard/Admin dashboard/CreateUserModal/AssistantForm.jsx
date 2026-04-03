"use client"

import DSSelect from "../../../../components/DSSelect"

const AssistantForm = ({ userData, handleChange, lecturers, t, isRTL }) => {
  return (
    <div className="form-control">
      <div className="flex flex-col gap-2">
        <label className="label py-0">
          <span className="label-text font-bold" style={{ color: "#1F2937" }}>{t("fields.assignedLecturer")}</span>
        </label>
        <DSSelect
          name="assignedLecturer"
          className="select w-full rounded-xl"
              style={{ backgroundColor: "rgba(17,24,39,0.03)", borderColor: "rgba(17,24,39,0.1)", color: "#1F2937" }}
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
        </DSSelect>
      </div>
    </div>
  )
}

export default AssistantForm
