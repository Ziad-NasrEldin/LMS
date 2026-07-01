import { useState } from "react"
import { Eye, EyeOff, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import DSSelect from "../../components/DSSelect"
import Button from "../../components/ui/Button"
import Input from "../../components/ui/Input"

const PARENT_RELATION_OPTIONS = ["mother", "father", "other"]

function ParentContactField({
  title,
  subtitle,
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
    <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-5">
      <div className="mb-2 flex flex-col gap-1.5 sm:mb-3 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 sm:text-base">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs leading-4 text-slate-600 sm:text-sm sm:leading-5">{subtitle}</p>}
        </div>

        {showRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-10 rounded-xl gap-2 text-error sm:min-h-11"
            onClick={onRemove}
          >
            <Trash2 size={16} />
            {t("buttons.remove")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 sm:gap-4">
        <div className={`form-control min-w-0 ${hasPhone ? "" : "col-span-2"}`}>
          <label className="label min-h-0 py-1">
            <span className="label-text text-xs sm:text-sm">{phoneLabel}</span>
          </label>
          <Input
            type="text"
            name={phoneName}
            className={`${phoneError ? "border-error" : ""}`}
            value={phoneValue || ""}
            onChange={handleInputChange}
            placeholder={phonePlaceholder}
            inputMode="tel"
            dir="ltr"
            autoComplete="tel"
          />
          {phoneError && (
            <span className="text-error mt-1 text-xs sm:text-sm">{t(`validation.${phoneError}`)}</span>
          )}
        </div>

        {hasPhone && (
          <div className="form-control min-w-0">
            <label className="label min-h-0 py-1">
              <span className="label-text text-xs sm:text-sm">{relationLabel}</span>
            </label>
            <DSSelect
              name={relationName}
              className={`select h-11 rounded-xl text-sm sm:h-12 sm:text-base ${relationError ? "select-error" : ""}`}
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
            </DSSelect>
            {relationError && (
              <span className="text-error mt-1 text-xs sm:text-sm">{t(`validation.${relationError}`)}</span>
            )}
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
  const passwordPaddingClass = i18n.language === "ar" ? "pr-12" : "pl-12"
  const passwordButtonPositionClass = i18n.language === "ar" ? "right-3" : "left-3"

  const hasAdditionalParentContact = Boolean(
    formData.hasAdditionalParentPhone ||
      String(formData.parentPhoneNumber2 || "").trim() ||
      String(formData.parentPhoneRelation2 || "").trim(),
  )

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Section: Parent Contact Information */}
      <div>
        <div className="mb-2 sm:mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0E5563] sm:text-sm">{t("form.parentDetails")}</h4>
          <p className="mt-0.5 text-xs leading-4 text-slate-600 sm:text-sm sm:leading-5">{t("form.parentDetailsSubtitle", "Provide parent/guardian contact information")}</p>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          <ParentContactField
            title={t("form.parentPhone")}
            subtitle={t("form.primaryParentSubtitle", "Main contact for the student")}
            phoneName="parentPhoneNumber"
            relationName="parentPhoneRelation"
            phoneValue={formData.parentPhoneNumber}
            relationValue={formData.parentPhoneRelation}
            phoneError={errors.parentPhoneNumber}
            relationError={errors.parentPhoneRelation}
            phoneLabel={t("form.phoneNumber")}
            relationLabel={t("form.relationship")}
            phonePlaceholder={t("form.phonePlaceholder", "01xxxxxxxxx")}
            relationPlaceholder={t("form.selectParentRelation")}
            handleInputChange={handleInputChange}
            t={t}
          />
          {!hasAdditionalParentContact ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full rounded-xl px-4 text-sm font-semibold sm:w-auto sm:px-5"
              onClick={handleAddAdditionalParentPhone}
            >
              {t("buttons.addAnotherParentPhone")}
            </Button>
          ) : (
            <ParentContactField
              title={t("form.additionalParentPhone")}
              subtitle={t("form.secondaryParentSubtitle", "Secondary contact (optional)")}
              phoneName="parentPhoneNumber2"
              relationName="parentPhoneRelation2"
              phoneValue={formData.parentPhoneNumber2}
              relationValue={formData.parentPhoneRelation2}
              phoneError={errors.parentPhoneNumber2}
              relationError={errors.parentPhoneRelation2}
              phoneLabel={t("form.phoneNumber")}
              relationLabel={t("form.relationship")}
              phonePlaceholder={t("form.phonePlaceholder", "01xxxxxxxxx")}
              relationPlaceholder={t("form.selectParentRelation")}
              handleInputChange={handleInputChange}
              t={t}
              showRemove
              onRemove={handleRemoveAdditionalParentPhone}
            />
          )}
        </div>
      </div>

      {/* Section: Account Credentials */}
      <div>
        <div className="mb-2 sm:mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0E5563] sm:text-sm">{t("form.accountCredentials")}</h4>
          <p className="mt-0.5 text-xs leading-4 text-slate-600 sm:text-sm sm:leading-5">{t("form.accountSubtitle", "Create your login credentials")}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 sm:gap-4">
          {/* Email */}
          <div className="form-control col-span-2 min-w-0">
            <label className="label min-h-0 py-1">
              <span className="label-text text-xs sm:text-sm">{t("form.email")}</span>
            </label>
            <Input
              type="email"
              name="email"
              className={`h-11 rounded-xl text-sm sm:h-12 sm:text-base ${errors.email ? "border-error" : ""}`}
              value={formData.email || ""}
              onChange={handleInputChange}
              placeholder={t("form.emailPlaceholder", "your@email.com")}
              required
            />
            {errors.email && (
              <span className="text-error mt-1 text-xs sm:text-sm">{t(`validation.${errors.email}`)}</span>
            )}
          </div>

          {/* Password */}
          <div className="form-control min-w-0">
            <label className="label min-h-0 py-1">
              <span className="label-text text-xs sm:text-sm">{t("form.password")}</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                className={`h-11 rounded-xl w-full text-sm sm:h-12 sm:text-base ${passwordPaddingClass} ${errors.password ? "border-error" : ""}`}
                value={formData.password || ""}
                onChange={handleInputChange}
                placeholder={t("form.passwordPlaceholder", "••••••••")}
                required
              />
              <button
                type="button"
                className={`absolute top-1/2 ${passwordButtonPositionClass} z-10 min-h-10 min-w-10 -translate-y-1/2 text-slate-500 hover:text-slate-700`}
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <span className="text-error mt-1 text-xs sm:text-sm">{t("validation.passwordRequirements")}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-control min-w-0">
            <label className="label min-h-0 py-1">
              <span className="label-text text-xs sm:text-sm">{t("form.confirmPassword")}</span>
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                className={`h-11 rounded-xl w-full text-sm sm:h-12 sm:text-base ${passwordPaddingClass} ${errors.confirmPassword ? "border-error" : ""}`}
                value={formData.confirmPassword || ""}
                onChange={handleInputChange}
                placeholder={t("form.confirmPasswordPlaceholder", "••••••••")}
                required
              />
              <button
                type="button"
                className={`absolute top-1/2 ${passwordButtonPositionClass} z-10 min-h-10 min-w-10 -translate-y-1/2 text-slate-500 hover:text-slate-700`}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="text-error mt-1 text-xs sm:text-sm">{t(`validation.${errors.confirmPassword}`)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
