"use client"

export default function Step3({ formData, toggleHobby, handleOtherHobbyChange, t, hobbiesList, errors }) {
  const isOtherSelected = formData.hobbies.includes("other")
  const inputClass = "input input-bordered h-12 min-h-12 w-full rounded-xl text-base"

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("form.selectHobbies")}</h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {hobbiesList.map((hobby) => {
          const isSelected = formData.hobbies.includes(hobby.id)

          return (
            <button
              type="button"
              key={hobby.id}
              onClick={() => toggleHobby(hobby.id)}
              aria-pressed={isSelected}
              className={`flex min-h-24 w-full items-center justify-center rounded-2xl border px-4 py-4 text-center transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2
                ${errors?.hobbies ? "ring-2 ring-error/25 ring-offset-2 ring-offset-base-100" : ""}
                ${isSelected ? "border-primary bg-primary/10 shadow-sm" : "border-base-300 bg-base-100 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"}`}
            >
              <p className="text-sm font-semibold leading-snug text-base-content">
                {t(`hobbies.${hobby.key}`, { defaultValue: hobby.value })}
              </p>
            </button>
          )
        })}
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
            className={`${inputClass} ${errors?.otherHobbyText ? "input-error" : ""}`}
          />
          {errors?.otherHobbyText && <p className="text-error text-sm">{t(`validation.${errors.otherHobbyText}`)}</p>}
        </div>
      )}
    </div>
  )
}
