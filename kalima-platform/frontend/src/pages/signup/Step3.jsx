"use client"

export default function Step3({ formData, toggleHobby, handleOtherHobbyChange, t, hobbiesList, errors }) {
  const isOtherSelected = formData.hobbies.includes("other")

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("form.selectHobbies")}</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {hobbiesList.map((hobby) => (
          <button
            type="button"
            key={hobby.id}
            onClick={() => toggleHobby(hobby.id)}
            className={`border-2 rounded-lg p-2 cursor-pointer transition-all 
              ${errors?.hobbies ? "ring-2 ring-error rounded-box p-1" : ""}
              ${
                formData.hobbies.includes(hobby.id)
                  ? "border-primary bg-primary/10"
                  : "border-base-300 hover:border-primary/50"
              }`}
          >
            <p className="text-center text-sm font-medium">{t(`hobbies.${hobby.key}`) || hobby.value}</p>
          </button>
        ))}
      </div>

      {errors?.hobbies && <p className="text-error text-sm">{t(`validation.${errors.hobbies}`)}</p>}

      {isOtherSelected && (
        <div className="space-y-2">
          <label htmlFor="otherHobbyText" className="block text-sm font-medium">
            {t("form.otherHobbyLabel")}
          </label>
          <input
            id="otherHobbyText"
            type="text"
            value={formData.otherHobbyText}
            onChange={(e) => handleOtherHobbyChange(e.target.value)}
            placeholder={t("form.otherHobbyPlaceholder")}
            className={`input input-bordered w-full ${errors?.otherHobbyText ? "input-error" : ""}`}
          />
          {errors?.otherHobbyText && <p className="text-error text-sm">{t(`validation.${errors.otherHobbyText}`)}</p>}
        </div>
      )}
    </div>
  )
}