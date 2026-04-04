import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAllGovernments, getGovernmentZones } from "../../routes/governments";
import { translateErrorMessage } from "../../utils/errorTranslator";
import { getGradeOptionsForStage } from "../../utils/levelHierarchy";
import DSSelect from "../../components/DSSelect"

export default function Step1({ formData, handleInputChange, t, errors, role, levelHierarchy, levelsLoading }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [governments, setGovernments] = useState([]);
  const [administrationZones, setAdministrationZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const stageOptions = levelHierarchy?.stageOptions || [];
  const fieldClass = "h-12 min-h-12 w-full rounded-xl text-base";
  const inputClass = `input ${fieldClass}`;
  const selectClass = `select ${fieldClass}`;
  
  // Section header component
  const SectionHeader = ({ title, subtitle }) => (
    <div className="mb-4 mt-6 first:mt-0">
      <h4 className="text-sm font-bold text-[#0E5563] uppercase tracking-wider">{title}</h4>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );

  const gradeOptions = formData.stage
    ? getGradeOptionsForStage(levelHierarchy, formData.stage)
    : [];

  useEffect(() => {
    const loadGovernments = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getAllGovernments();

        if (result.success) {
          setGovernments(result.data);
        } else {
          setError(translateErrorMessage(result.error));
        }
      } catch (err) {
        setError(translateErrorMessage(err.message));
      } finally {
        setLoading(false);
      }
    };

    loadGovernments();
  }, []);

  useEffect(() => {
    const loadZones = async () => {
      if (!formData.government) {
        setAdministrationZones([]);
        return;
      }

      try {
        setZonesLoading(true);
        const result = await getGovernmentZones(formData.government);

        if (result.success) {
          setAdministrationZones(result.data);
        } else {
          setAdministrationZones([]);
        }
      } catch (err) {
        setAdministrationZones([]);
      } finally {
        setZonesLoading(false);
      }
    };

    loadZones();
  }, [formData.government]);

  const handleGovernmentChange = (e) => {
    handleInputChange(e);

    if (formData.administrationZone) {
      handleInputChange({
        target: {
          name: "administrationZone",
          value: "",
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-xl sm:text-2xl font-semibold mb-2">{t("form.personalDetails")}</p>
        <div className="flex items-center justify-center py-8">
          <div className="loading loading-spinner loading-lg"></div>
          <span className="ml-2">{t("loading", { ns: "common", defaultValue: "Loading..." })}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-xl sm:text-2xl font-semibold mb-2">{t("form.personalDetails")}</p>
        <div className="alert alert-error">
          <span>
            {t("errors.loadingFailed", { defaultValue: "Failed to load data:" })} {error}
          </span>
        </div>
      </div>
    );
  }

  return (
      <div className="space-y-1">
        {/* Section: Basic Info */}
        <SectionHeader 
          title={t("form.personalDetails")} 
          subtitle={t("form.personalDetailsSubtitle", "Enter your basic information")}
        />
        
        {/* Row 1: Name (2/3) + Gender (1/3) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="form-control sm:col-span-2">
            <label className="label">
              <span className="label-text">{t("form.fullName")}</span>
            </label>
            <input
              type="text"
              name="fullName"
              className={`${inputClass} ${errors.fullName ? "input-error" : ""}`}
              value={formData.fullName}
              onChange={handleInputChange}
              required
              placeholder={t("form.fullNamePlaceholder", "Enter your full name")}
            />
            {errors.fullName && (
              <span className="text-error text-sm mt-1">{t(`validation.${errors.fullName}`)}</span>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("form.gender")}</span>
            </label>
            <DSSelect
              name="gender"
              className={`${selectClass} ${errors.gender ? "select-error" : ""}`}
              value={formData.gender}
              onChange={handleInputChange}
              required
            >
              <option value="">{t("form.selectGender")}</option>
              <option value="male">{t("gender.male")}</option>
              <option value="female">{t("gender.female")}</option>
            </DSSelect>
          </div>
        </div>

        {/* Row 2: Phone Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("form.phoneNumber")}</span>
            </label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className={`${inputClass} ${errors.phoneNumber ? "input-error" : ""}`}
              inputMode="tel"
              dir="ltr"
              autoComplete="tel"
              required
              placeholder={t("form.phonePlaceholder", "01xxxxxxxxx")}
            />
            {errors.phoneNumber && (
              <span className="text-error text-sm mt-1">{t(`validation.${errors.phoneNumber}`)}</span>
            )}
          </div>

          {role === "teacher" && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("form.phoneNumber2")}</span>
                <span className="label-text-alt text-xs text-slate-400">{t("form.optional")}</span>
              </label>
              <input
                type="text"
                name="phoneNumber2"
                value={formData.phoneNumber2}
                onChange={handleInputChange}
                className={inputClass}
                inputMode="tel"
                dir="ltr"
                autoComplete="tel"
                placeholder={t("form.phonePlaceholder", "01xxxxxxxxx")}
              />
            </div>
          )}
        </div>

        {/* Section: Location */}
        <SectionHeader 
          title={t("form.location")} 
          subtitle={t("form.locationSubtitle", "Select your governorate and educational zone")}
        />
        
        {/* Row 3: Government + Administration Zone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("form.government", { defaultValue: isRTL ? "المحافظة" : "Government" })}</span>
            </label>
            <DSSelect
              name="government"
              className={`${selectClass} ${errors.government ? "select-error" : ""}`}
              value={formData.government || ""}
              onChange={handleGovernmentChange}
            >
              <option value="">
                {t("form.selectGovernment", { defaultValue: isRTL ? "اختر المحافظة" : "Select Government" })}
              </option>
              {(Array.isArray(governments) ? governments : []).map((government) => (
                <option key={government._id} value={government.name}>
                  {government.name}
                </option>
              ))}
            </DSSelect>
            {errors.government && (
              <span className="text-error text-sm mt-1">{t(`validation.${errors.government}`, { defaultValue: isRTL ? "المحافظة مطلوبة" : "Government is required" })}</span>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("form.administrationZone", { defaultValue: isRTL ? "الإدارة التعليمية" : "Administration Zone" })}</span>
            </label>
            <DSSelect
              disabled={!formData.government || zonesLoading}
              name="administrationZone"
              className={`${selectClass} ${errors.administrationZone ? "select-error" : ""}`}
              value={formData.administrationZone || ""}
              onChange={handleInputChange}
            >
              <option value="">
                {zonesLoading
                  ? t("common.loading", { defaultValue: "Loading..." })
                  : t("form.selectAdministrationZone", { defaultValue: isRTL ? "اختر الإدارة التعليمية" : "Select Administration Zone" })}
              </option>
              {(Array.isArray(administrationZones) ? administrationZones : []).map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </DSSelect>
            {errors.administrationZone && (
              <span className="text-error text-sm mt-1">{t(`validation.${errors.administrationZone}`, { defaultValue: isRTL ? "الإدارة التعليمية مطلوبة" : "Administration Zone is required" })}</span>
            )}
          </div>
        </div>

        {/* Section: Education Level (Students only) */}
        {role === "student" && (
          <>
            <SectionHeader 
              title={t("form.educationLevel")} 
              subtitle={t("form.educationSubtitle", "Select your academic stage and grade")}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("form.stage", { defaultValue: isRTL ? "المرحلة" : "Stage" })}</span>
                </label>
                <DSSelect
                  name="stage"
                  className={`${selectClass} ${errors.stage ? "select-error" : ""}`}
                  value={formData.stage || ""}
                  onChange={(e) => {
                    handleInputChange(e);
                    if (formData.level) {
                      handleInputChange({ target: { name: "level", value: "" } });
                    }
                  }}
                  disabled={levelsLoading || stageOptions.length === 0}
                  required
                >
                  <option value="">
                    {levelsLoading
                      ? t("form.loadingStages", { defaultValue: isRTL ? "جاري تحميل المراحل..." : "Loading stages..." })
                      : t("form.selectStage", { defaultValue: isRTL ? "اختر المرحلة" : "Select Stage" })}
                  </option>
                  {stageOptions.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </DSSelect>
                {errors.stage && (
                  <span className="text-error text-sm mt-1">{t(`validation.${errors.stage}`)}</span>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("form.level", { defaultValue: isRTL ? "المستوى التعليمي" : "Learning Level" })}</span>
                </label>
                <DSSelect
                  name="level"
                  className={`${selectClass} ${errors.level ? "select-error" : ""}`}
                  value={formData.level || ""}
                  onChange={handleInputChange}
                  disabled={levelsLoading || !formData.stage || gradeOptions.length === 0}
                  required
                >
                  <option value="">
                    {levelsLoading
                      ? t("form.loadingGrades", { defaultValue: isRTL ? "جاري تحميل الصفوف..." : "Loading grades..." })
                      : !formData.stage
                        ? t("form.selectStageFirst", { defaultValue: isRTL ? "اختر المرحلة أولاً" : "Select a stage first" })
                        : gradeOptions.length === 0
                          ? t("form.noGradesAvailable", { defaultValue: isRTL ? "لا توجد صفوف متاحة" : "No grades available" })
                          : t("form.selectGradeLevel", { defaultValue: t("form.selectGrade", { defaultValue: isRTL ? "اختر المستوى التعليمي" : "Select Learning Level" }) })}
                  </option>
                  {gradeOptions.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </DSSelect>
                {errors.level && (
                  <span className="text-error text-sm mt-1">{t(`validation.${errors.level}`)}</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
  );
}
