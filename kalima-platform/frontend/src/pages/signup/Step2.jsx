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
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-base font-bold text-slate-900">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
        </div>

        {showRemove && (
             <Button
               type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl gap-2 text-error"
                onClick={onRemove}
              >
              <Trash2 size={16} />
              {t("buttons.remove")}
              </Button>
            )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">{phoneLabel}</span>
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
            <span className="text-error text-sm mt-1">{t(`validation.${phoneError}`)}</span>
          )}
        </div>

        {hasPhone && (
          <div className="form-control">
            <label className="label">
              <span className="label-text">{relationLabel}</span>
            </label>
            <DSSelect
              name={relationName}
              className={`select h-12 rounded-xl ${relationError ? "select-error" : ""}`}
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
              <span className="text-error text-sm mt-1">{t(`validation.${relationError}`)}</span>
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

  const hasAdditionalParentContact = Boolean(
    formData.hasAdditionalParentPhone ||
      String(formData.parentPhoneNumber2 || "").trim() ||
      String(formData.parentPhoneRelation2 || "").trim(),
  )

  return (
    <div className="space-y-6">
      {/* Section: Parent Contact Information */}
      <div>
        <div className="mb-4">
          <h4 className="text-sm font-bold text-[#0E5563] uppercase tracking-wider">{t("form.parentDetails")}</h4>
            <p className="mt-1 text-xs text-slate-600">{t("form.parentDetailsSubtitle", "Provide parent/guardian contact information")}</p>
        </div>

        <div className="space-y-4">
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
               className="h-11 rounded-xl px-5 text-sm font-semibold w-full sm:w-auto"
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
        <div className="mb-4">
          <h4 className="text-sm font-bold text-[#0E5563] uppercase tracking-wider">{t("form.accountCredentials")}</h4>
            <p className="mt-1 text-xs text-slate-600">{t("form.accountSubtitle", "Create your login credentials")}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Email */}
          <div className="form-control sm:col-span-2">
            <label className="label">
              <span className="label-text">{t("form.email")}</span>
            </label>
               <Input
                 type="email"
                 name="email"
                 className={`h-12 rounded-xl ${errors.email ? "border-error" : ""}`}
                 value={formData.email || ""}
                 onChange={handleInputChange}
                 placeholder={t("form.emailPlaceholder", "your@email.com")}
                 required
               />
            {errors.email && (
              <span className="text-error text-sm mt-1">{t(`validation.${errors.email}`)}</span>
            )}
          </div>

          {/* Password */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("form.password")}</span>
            </label>
            <div className="relative">
                   <Input
                     type={showPassword ? "text" : "password"}
                     name="password"
                     className={`h-12 rounded-xl w-full pl-12 ${errors.password ? "border-error" : ""}`}
                     value={formData.password || ""}
                     onChange={handleInputChange}
                     placeholder={t("form.passwordPlaceholder", "••••••••")}
                     required
                   />
              <button
                type="button"
                className="absolute top-1/2 left-3 -translate-y-1/2 z-10 text-slate-400 hover:text-slate-600"
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

          {/* Confirm Password */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("form.confirmPassword")}</span>
            </label>
            <div className="relative">
                   <Input
                     type={showConfirmPassword ? "text" : "password"}
                     name="confirmPassword"
                     className={`h-12 rounded-xl w-full pl-12 ${errors.confirmPassword ? "border-error" : ""}`}
                     value={formData.confirmPassword || ""}
                     onChange={handleInputChange}
                     placeholder={t("form.confirmPasswordPlaceholder", "••••••••")}
                     required
                   />
              <button
                type="button"
                className="absolute top-1/2 left-3 -translate-y-1/2 z-10 text-slate-400 hover:text-slate-600"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="text-error text-sm mt-1">{t(`validation.${errors.confirmPassword}`)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
