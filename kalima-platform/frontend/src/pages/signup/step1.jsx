import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAllGovernments, getGovernmentZones } from "../../routes/governments";
import { translateErrorMessage } from "../../utils/errorTranslator";
import { getGradeOptionsForStage } from "../../utils/levelHierarchy";

export default function Step1({ formData, handleInputChange, t, errors, role, levelHierarchy, levelsLoading }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [governments, setGovernments] = useState([]);
  const [administrationZones, setAdministrationZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const stageOptions = levelHierarchy?.stageOptions || [];

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
    <div className="space-y-2">
      <p className="text-xl sm:text-2xl font-semibold mb-2">{t("form.personalDetails")}</p>
      <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
        <div className="form-control relative">
          <div className="flex flex-col gap-1">
            <label className="label py-1">
              <span className="label-text text-xs">{t("form.fullName")}</span>
            </label>
            <input
              type="text"
              name="fullName"
              className={`input input-bordered w-full ${
                errors.fullName ? "input-error animate-shake" : ""
              }`}
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
            {errors.fullName && (
              <span className="absolute bottom-0 text-error text-sm mt-1">
                {t(`validation.${errors.fullName}`)}
              </span>
            )}
          </div>
        </div>

        <div className="form-control relative">
          <div className="flex flex-col gap-1">
            <label className="label py-1">
              <span className="label-text text-xs">{t("form.gender")}</span>
            </label>
            <select
              name="gender"
              className={`select select-bordered w-full ${
                errors.gender ? "select-error animate-shake" : ""
              }`}
              value={formData.gender}
              onChange={handleInputChange}
              required
            >
              <option value="">{t("form.selectGender")}</option>
              <option value="male">{t("gender.male")}</option>
              <option value="female">{t("gender.female")}</option>
            </select>
          </div>
        </div>

        <div className="form-control relative">
          <div className="flex flex-col gap-1">
            <label className="label py-1">
              <span className="label-text text-xs">{t("form.phoneNumber")}</span>
            </label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className={`input input-bordered w-full ${
                errors.phoneNumber ? "input-error animate-shake" : ""
              }`}
              inputMode="tel"
              dir="ltr"
              autoComplete="tel"
              required
            />
            {errors.phoneNumber && (
              <span className="absolute bottom-0 text-error text-sm mt-1">
                {t(`validation.${errors.phoneNumber}`)}
              </span>
            )}
          </div>
        </div>

        {role === "teacher" && (
          <div className="form-control relative">
            <div className="flex flex-col gap-1">
              <label className="label py-1">
                <span className="label-text text-xs">{t("form.phoneNumber2")}</span>
              </label>
              <input
                type="text"
                name="phoneNumber2"
                value={formData.phoneNumber2}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                inputMode="tel"
                dir="ltr"
                autoComplete="tel"
              />
              <label className="label py-1">
                <span className="label-text text-xs">{t("form.optional")}</span>
              </label>
              {errors.phoneNumber2 && (
                <span className="absolute bottom-0 text-error text-sm mt-1">
                  {t(`validation.${errors.phoneNumber2}`)}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="form-control relative">
          <div className="flex flex-col gap-1">
            <label className="label py-1">
              <span className="label-text text-xs">
                {t("form.government", { defaultValue: isRTL ? "المحافظة" : "Government" })}
              </span>
            </label>
            <select
              name="government"
              className={`select select-bordered w-full ${
                errors.government ? "select-error animate-shake" : ""
              }`}
              value={formData.government || ""}
              onChange={handleGovernmentChange}
            >
              <option
                value=""
              >
                {t("form.selectGovernment", {
                  defaultValue: isRTL ? "اختر المحافظة" : "Select Government",
                })}
              </option>
              {(Array.isArray(governments) ? governments : []).map((government) => (
                <option key={government._id} value={government.name}>
                  {government.name}
                </option>
              ))}
            </select>
            {errors.government && (
              <span className="absolute bottom-0 text-error text-sm mt-1">
                {t(`validation.${errors.government}`, {
                  defaultValue: isRTL ? "المحافظة مطلوبة" : "Government is required",
                })}
              </span>
            )}
          </div>
        </div>

        <div className="form-control relative">
          <div className="flex flex-col gap-1">
            <label className="label py-1">
              <span className="label-text text-xs">
                {t("form.administrationZone", {
                  defaultValue: isRTL ? "الإدارة التعليمية" : "Administration Zone",
                })}
              </span>
            </label>
            <select
              disabled={!formData.government || zonesLoading}
              name="administrationZone"
              className={`select select-bordered w-full ${
                errors.administrationZone ? "select-error animate-shake" : ""
              }`}
              value={formData.administrationZone || ""}
              onChange={handleInputChange}
            >
              <option value="">
                {zonesLoading
                  ? t("common.loading", { defaultValue: "Loading..." })
                  : t("form.selectAdministrationZone", {
                      defaultValue: isRTL ? "اختر الإدارة التعليمية" : "Select Administration Zone",
                    })}
              </option>
              {(Array.isArray(administrationZones) ? administrationZones : []).map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
            {errors.administrationZone && (
              <span className="absolute bottom-0 text-error text-sm mt-1">
                {t(`validation.${errors.administrationZone}`, {
                  defaultValue: isRTL ? "الإدارة التعليمية مطلوبة" : "Administration Zone is required",
                })}
              </span>
            )}
          </div>
        </div>

        {role === "student" && (
          <>
            <div className="form-control relative">
              <div className="flex flex-col gap-1">
                <label className="label py-1">
                  <span className="label-text text-xs">
                    {t("form.stage", { defaultValue: isRTL ? "المرحلة" : "Stage" })}
                  </span>
                </label>
                <select
                  name="stage"
                  className={`select select-bordered w-full ${
                    errors.stage ? "select-error animate-shake" : ""
                  }`}
                  value={formData.stage || ""}
                  onChange={(e) => {
                    handleInputChange(e);
                    if (formData.level) {
                      handleInputChange({
                        target: {
                          name: "level",
                          value: "",
                        },
                      });
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
                </select>
                {errors.stage && (
                  <span className="absolute bottom-0 text-error text-sm mt-1">
                    {t(`validation.${errors.stage}`)}
                  </span>
                )}
              </div>
            </div>

            <div className="form-control relative">
              <div className="flex flex-col gap-1">
                <label className="label py-1">
                  <span className="label-text text-xs">
                    {t("form.level", {
                      defaultValue: isRTL ? "المستوى التعليمي" : "Learning Level",
                    })}
                  </span>
                </label>
                <select
                  name="level"
                  className={`select select-bordered w-full ${
                    errors.level ? "select-error animate-shake" : ""
                  }`}
                  value={formData.level || ""}
                  onChange={handleInputChange}
                  disabled={levelsLoading || !formData.stage || gradeOptions.length === 0}
                  required
                >
                  <option value="">
                    {levelsLoading
                      ? t("form.loadingGrades", { defaultValue: isRTL ? "جاري تحميل الصفوف..." : "Loading grades..." })
                      : !formData.stage
                        ? t("form.selectStageFirst", {
                            defaultValue: isRTL ? "اختر المرحلة أولاً" : "Select a stage first",
                          })
                        : gradeOptions.length === 0
                          ? t("form.noGradesAvailable", {
                              defaultValue: isRTL ? "لا توجد صفوف متاحة" : "No grades available",
                            })
                          : t("form.selectGradeLevel", {
                              defaultValue: t("form.selectGrade", {
                                defaultValue: isRTL ? "اختر المستوى التعليمي" : "Select Learning Level",
                              }),
                            })}
                  </option>
                  {gradeOptions.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                {errors.level && (
                  <span className="absolute bottom-0 text-error text-sm mt-1">
                    {t(`validation.${errors.level}`)}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
