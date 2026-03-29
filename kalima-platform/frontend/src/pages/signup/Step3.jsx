"use client"

const HOBBY_OPTIONS = ["reading", "sports", "music", "cooking", "gaming", "art", "technology", "bicycling", "photography"]

export default function Step3({ formData, handleInputChange, t, errors }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xl font-semibold sm:text-2xl">{t("steps.hobbies")}</p>
        <p className="text-sm text-base-content/60">
          {t("form.selectHobby", { defaultValue: "Select a hobby from the list below." })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {HOBBY_OPTIONS.map((hobby) => {
          const isSelected = formData.hobby === hobby

          return (
            <label
              key={hobby}
              className={`cursor-pointer rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
                isSelected
                  ? "border-primary bg-primary text-primary-content shadow-sm"
                  : "border-base-300 bg-base-100 text-base-content/75 hover:border-base-content/20"
              }`}
            >
              <input
                type="radio"
                name="hobby"
                value={hobby}
                checked={isSelected}
                onChange={handleInputChange}
                className="sr-only"
              />
              <span>{t(`hobbies.${hobby}`)}</span>
            </label>
          )
        })}
      </div>

      {errors.hobby && (
        <p className="text-sm text-error">
          {t(`validation.${errors.hobby}`)}
        </p>
      )}
    </div>
  )
}
