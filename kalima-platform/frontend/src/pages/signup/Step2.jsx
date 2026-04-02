import { useState } from "react"
import { Eye, EyeOff, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

const PARENT_RELATION_OPTIONS = ["mother", "father", "other"]
const fieldClass = "h-12 min-h-12 w-full rounded-xl text-base"
const inputClass = `input input-bordered ${fieldClass}`
const selectClass = `select select-bordered ${fieldClass} ps-4 pe-10`

function ParentContactField({
  title,
  phoneName,
  relationName,
  phoneValue,
  relationValue,
  phoneError,
  relationError,
  phoneLabel,
  relationLabel,
  phonePlaceholder,
  relationPlaceholder,
  handleInputChange,
  t,
  showRemove,
  onRemove,
}) {
  const hasPhone = Boolean(String(phoneValue || "").trim())
  const relationOptions = PARENT_RELATION_OPTIONS.map((option) => ({
    value: option,
    label: t(`parentRelations.${option}`),
  }))

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100/70 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-base-content">{title}</p>
        </div>

        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="btn btn-ghost h-10 min-h-10 rounded-xl gap-2 px-3 text-error"
          >
            <Trash2 size={14} />
            {t("buttons.removeParentPhone")}
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <div className="form-control">
          <div className="flex flex-col gap-1">
            <label className="label py-1">
              <span className="label-text text-xs">{phoneLabel}</span>
            </label>
            <input
              type="text"
              name={phoneName}
              className={`${inputClass} ${phoneError ? "input-error animate-shake" : ""}`}
              value={phoneValue || ""}
              onChange={handleInputChange}
              placeholder={phonePlaceholder}
              inputMode="tel"
              dir="ltr"
              autoComplete="tel"
            />
            {phoneError && (
              <span className="text-error text-sm mt-1">{t(`validation.${phoneError}`)}</span>
            )}
          </div>
        </div>

        {hasPhone && (
          <div className="form-control">
            <div className="flex flex-col gap-1">
              <label className="label py-1">
                <span className="label-text text-xs">{relationLabel}</span>
              </label>
              <select
                name={relationName}
                className={`${selectClass} ${relationError ? "select-error animate-shake" : ""}`}
                value={relationValue || ""}
                onChange={handleInputChange}
                required
              >
                <option value="">{relationPlaceholder}</option>
                {relationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {relationError && (
                <span className="text-error text-sm mt-1">{t(`validation.${relationError}`)}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Step2({
  formData,
  handleInputChange,
  handleAddAdditionalParentPhone = () => {},
  handleRemoveAdditionalParentPhone = () => {},
  t,
  errors,
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { i18n } = useTranslation()

  const hasAdditionalParentContact = Boolean(
    formData.hasAdditionalParentPhone ||
      String(formData.parentPhoneNumber2 || "").trim() ||
      String(formData.parentPhoneRelation2 || "").trim(),
  )

  return (
    <div className="space-y-4">
      <p className="text-xl sm:text-2xl font-semibold mb-2">{t("form.parentDetails")}</p>

      <div className="space-y-4">
        <ParentContactField
          title={t("form.parentPhone")}
          phoneName="parentPhoneNumber"
          relationName="parentPhoneRelation"
          phoneValue={formData.parentPhoneNumber}
          relationValue={formData.parentPhoneRelation}
          phoneError={errors.parentPhoneNumber}
          relationError={errors.parentPhoneRelation}
          phoneLabel={t("form.parentPhone")}
          relationLabel={t("form.parentPhoneRelation")}
          phonePlaceholder={t("form.parentPhoneNumber")}
          relationPlaceholder={t("form.selectParentRelation")}
          handleInputChange={handleInputChange}
          t={t}
        />

        {!hasAdditionalParentContact ? (
          <button
            type="button"
            onClick={handleAddAdditionalParentPhone}
            className="btn btn-outline h-12 min-h-12 rounded-xl px-5 text-base font-semibold w-full sm:w-auto"
          >
            {t("buttons.addAnotherParentPhone")}
          </button>
        ) : (
          <ParentContactField
            title={t("form.additionalParentPhone")}
            phoneName="parentPhoneNumber2"
            relationName="parentPhoneRelation2"
            phoneValue={formData.parentPhoneNumber2}
            relationValue={formData.parentPhoneRelation2}
            phoneError={errors.parentPhoneNumber2}
            relationError={errors.parentPhoneRelation2}
            phoneLabel={t("form.additionalParentPhone")}
            relationLabel={t("form.additionalParentRelation")}
            phonePlaceholder={t("form.additionalParentPhone")}
            relationPlaceholder={t("form.selectParentRelation")}
            handleInputChange={handleInputChange}
            t={t}
            showRemove
            onRemove={handleRemoveAdditionalParentPhone}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-3">
        {/* Email */}
        <div className="form-control">
          <div className="flex flex-col gap-1">
            <label className="label py-1">
              <span className="label-text text-xs">{t("form.email")}</span>
            </label>
            <input
              type="email"
              name="email"
              className={`${inputClass} ${errors.email ? "input-error animate-shake" : ""}`}
              value={formData.email || ""}
              onChange={handleInputChange}
              required
            />
            {errors.email && (
              <span className="text-error text-sm mt-1">{t(`validation.${errors.email}`)}</span>
            )}
          </div>
        </div>

        {/* Password */}
        <div className="form-control">
          <div className="flex flex-col gap-1">
            <label className="label py-1">
              <span className="label-text text-xs">{t("form.password")}</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className={`${inputClass} ${
                  i18n.language === "ar" ? "pr-12" : "pl-12"
                } ${errors.password ? "input-error animate-shake" : ""}`}
                value={formData.password || ""}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                className={`absolute top-1/2 ${
                  i18n.language === "ar" ? "right-3" : "left-3"
                } -translate-y-1/2 z-10`}
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <span className="text-error text-sm mt-1">{t("validation.passwordRequirements")}</span>
            )}
          </div>
        </div>

        {/* Confirm Password */}
        <div className="form-control relative sm:col-span-2">
          <div className="flex flex-col gap-1">
            <label className="label py-1">
              <span className="label-text text-xs">{t("form.confirmPassword")}</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                className={`${inputClass} ${
                  i18n.language === "ar" ? "pr-12" : "pl-12"
                } ${errors.confirmPassword ? "input-error animate-shake" : ""}`}
                value={formData.confirmPassword || ""}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                className={`absolute top-1/2 ${
                  i18n.language === "ar" ? "right-3" : "left-3"
                } -translate-y-1/2 z-10`}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="text-error text-sm mt-1">
                {t(`validation.${errors.confirmPassword}`)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
