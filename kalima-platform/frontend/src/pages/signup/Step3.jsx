"use client"

import Input from "../../components/ui/Input"

export default function Step3({ formData, toggleHobby, handleOtherHobbyChange, t, hobbiesList, errors }) {
  const isOtherSelected = formData.hobbies.includes("other")
  const inputClass = "h-12 min-h-12 w-full rounded-xl text-base"

  return (
    <div className="space-y-2.5 sm:space-y-3">
      <h3 className="text-lg font-bold text-slate-900">{t("form.selectHobbies")}</h3>

      <div className="grid grid-cols-2 gap-1.5 sm:gap-3 lg:grid-cols-3">
        {hobbiesList.map((hobby) => {
          const isSelected = formData.hobbies.includes(hobby.id)

          return (
            <button
              type="button"
              key={hobby.id}
              onClick={() => toggleHobby(hobby.id)}
              aria-pressed={isSelected}
              className={`flex min-h-11 w-full items-center justify-center overflow-hidden rounded-xl border-2 px-2 py-2 text-center transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 sm:min-h-24 sm:rounded-2xl sm:px-4 sm:py-4 sm:focus-visible:ring-offset-2
                ${errors?.hobbies ? "ring-2 ring-error/25 ring-offset-1 ring-offset-white sm:ring-offset-2" : ""}
                ${isSelected ? "border-primary bg-primary/10 shadow-sm" : "border-slate-200 bg-white sm:hover:-translate-y-0.5 sm:hover:border-primary/40 sm:hover:shadow-md"}`}
            >
              <p className="min-w-0 whitespace-normal break-words text-[0.8125rem] font-semibold leading-tight text-slate-900 sm:text-sm sm:leading-snug">
                {t(`hobbies.${hobby.key}`, { defaultValue: hobby.value })}
              </p>
            </button>
          )
        })}
      </div>

      {errors?.hobbies && <p className="text-error text-sm">{t(`validation.${errors.hobbies}`)}</p>}

      {isOtherSelected && (
        <div className="space-y-1.5">
          <label htmlFor="otherHobbyText" className="block text-sm font-semibold text-slate-900">
            {t("form.otherHobbyLabel")}
          </label>
           <Input
            id="otherHobbyText"
            type="text"
            value={formData.otherHobbyText}
            onChange={(e) => handleOtherHobbyChange(e.target.value)}
            placeholder={t("form.otherHobbyPlaceholder")}
            className={`${inputClass} ${errors?.otherHobbyText ? "border-red-500" : ""}`}
          />

          {errors?.otherHobbyText && <p className="text-error text-sm">{t(`validation.${errors.otherHobbyText}`)}</p>}
        </div>
      )}
    </div>
  )
}
