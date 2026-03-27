import { useState, useEffect } from 'react';
import { getAllGovernments, getGovernmentZones } from '../../routes/governments';

export default function Step1({ formData, handleInputChange, t, errors, role, gradeLevels }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [governments, setGovernments] = useState([]);
  const [administrationZones, setAdministrationZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(false);

  const translateGradeLevel = (rawLabel) => {
    if (!rawLabel) return "-";

    const normalized = String(rawLabel).trim();
    const lower = normalized.toLowerCase();
    const levelMap = {
      "first primary": "1st Primary",
      "second primary": "2nd Primary",
      "third primary": "3rd Primary",
      "fourth primary": "4th Primary",
      "fifth primary": "5th Primary",
      "sixth primary": "6th Primary",
      "first preparatory": "1st Preparatory",
      "second preparatory": "2nd Preparatory",
      "third preparatory": "3rd Preparatory",
      "first secondary": "1st Secondary",
      "second secondary": "2nd Secondary",
      "third secondary": "3rd Secondary",
    };

    const candidateKeys = [normalized, levelMap[lower]].filter(Boolean);
    for (const key of candidateKeys) {
      const translated = t(`gradeLevels.${key}`);
      if (translated !== `gradeLevels.${key}`) {
        return translated;
      }
    }

    return normalized;
  };

  // Fetch governments on component mount
  useEffect(() => {
    const loadGovernments = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getAllGovernments();

        if (result.success) {
          setGovernments(result.data);
        } else {
          setError(result.error);
          console.error('Failed to load governments:', result.error);
        }
      } catch (err) {
        setError(err.message);
        console.error('Failed to load governments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGovernments();
  }, []);

  // Fetch administration zones when government changes
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
          console.error('Failed to load administration zones:', result.error);
          setAdministrationZones([]);
        }
      } catch (err) {
        console.error('Failed to load administration zones:', err);
        setAdministrationZones([]);
      } finally {
        setZonesLoading(false);
      }
    };

    loadZones();
  }, [formData.government]);

  // Clear administration zone when government changes
  const handleGovernmentChange = (e) => {
    handleInputChange(e);
    // Reset administration zone when government changes
    if (formData.administrationZone) {
      handleInputChange({
        target: {
          name: 'administrationZone',
          value: ''
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-xl sm:text-2xl font-semibold mb-2">{t('form.personalDetails')}</p>
        <div className="flex items-center justify-center py-8">
          <div className="loading loading-spinner loading-lg"></div>
          <span className="ml-2">{t('loading', { ns: 'common', defaultValue: 'Loading...' })}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-xl sm:text-2xl font-semibold mb-2">{t('form.personalDetails')}</p>
        <div className="alert alert-error">
          <span>{t('errors.loadingFailed') || 'Failed to load data:'} {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xl sm:text-2xl font-semibold mb-2">{t('form.personalDetails')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">

      {/* Common fields */}
      <div className="form-control relative">
        <div className="flex flex-col gap-1">
          <label className="label py-1">
            <span className="label-text text-xs">{t('form.fullName')}</span>
          </label>
          <input
            type="text"
            name="fullName"
            className={`input input-bordered input-sm w-full ${errors.fullName ? 'input-error animate-shake' : ''}`}
            value={formData.fullName}
            onChange={handleInputChange}
            required
          />
          {errors.fullName && (
            <span className="absolute bottom-0  text-error text-sm mt-1">
              {t(`validation.${errors.fullName}`)}
            </span>
          )}
        </div>
      </div>

      <div className="form-control relative">
        <div className="flex flex-col gap-1">
          <label className="label py-1">
            <span className="label-text text-xs">{t("form.profilePic") || "Profile Picture"}</span>
          </label>
          <input
            type="file"
            name="profilePic"
            accept=".jpg,.jpeg,.png"
            className="file-input file-input-bordered file-input-sm w-full"
            onChange={handleInputChange}
          />
          {formData.profilePic && (
            <p className="text-xs mt-1 text-base-content/70">
              Selected file: {formData.profilePic.name}
            </p>
          )}
          {errors.profilePic && (
            <span className="absolute bottom-0 text-error text-sm mt-1">
              {t(`validation.${errors.profilePic}`)}
            </span>
          )}
        </div>
      </div>


      <div className="form-control relative">
        <div className="flex flex-col gap-1">
          <label className="label py-1">
            <span className="label-text text-xs">{t('form.gender')}</span>
          </label>
          <select
            name="gender"
            className={`select select-bordered select-sm w-full ${errors.gender ? 'select-error animate-shake' : ''}`}
            value={formData.gender}
            onChange={handleInputChange}
            required
          >
            <option value="">{t('form.selectGender')}</option>
            <option value="male">{t('gender.male')}</option>
            <option value="female">{t('gender.female')}</option>
          </select>
        </div>
      </div>

      <div className="form-control relative">
        <div className="flex flex-col gap-1">
          <label className="label py-1">
            <span className="label-text text-xs">{t('form.phoneNumber')}</span>
          </label>
          <input
            type="text"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            className={`input input-bordered input-sm w-full ${errors.phoneNumber ? 'input-error animate-shake' : ''}`}
            inputMode="tel"
            dir="ltr"
            autoComplete="tel"
            required
          />
          {errors.phoneNumber && (
            <span className="absolute bottom-0  text-error text-sm mt-1">
              {t(`validation.${errors.phoneNumber}`)}
            </span>
          )}
        </div>
      </div>

      <div className="form-control relative">
        <div className="flex flex-col gap-1">
          <label className="label py-1">
            <span className="label-text text-xs">{t('form.referralSerial')}</span>
          </label>
          <input
            type="text"
            name="referralSerial"
            className={`input input-bordered input-sm w-full ${errors.referralSerial ? 'input-error animate-shake' : ''}`}
            value={formData.referralSerial}
            onChange={handleInputChange}
            required
          />
          {errors.referralSerial && (
            <span className="absolute bottom-0  text-error text-sm mt-1">
              {t(`validation.${errors.referralSerial}`)}
            </span>
          )}
        </div>
      </div>

      {role === 'teacher' && (
        <>
          <div className="form-control relative">
            <div className="flex flex-col gap-1">
              <label className="label py-1">
                <span className="label-text text-xs">{t('form.phoneNumber2')}</span>
              </label>
              <input
                type="text"
                name="phoneNumber2"
                value={formData.phoneNumber2}
                onChange={handleInputChange}
                className="input input-bordered input-sm w-full"
                inputMode="tel"
                dir="ltr"
                autoComplete="tel"
              />
              <label className="label py-1">
                <span className="label-text text-xs">{t('form.optional')}</span>
              </label>
              {errors.phoneNumber2 && (
                <span className="absolute bottom-0  text-error text-sm mt-1">
                  {t(`validation.${errors.phoneNumber2}`)}
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {/* Government Selection */}
      <div className="form-control relative">
        <div className="flex flex-col gap-1">
          <label className="label py-1">
            <span className="label-text text-xs">{t("form.government") || "Government"}</span>
          </label>
          <select
            name="government"
            className={`select select-bordered select-sm w-full ${errors.government ? "select-error animate-shake" : ""}`}
            value={formData.government || ""}
            onChange={handleGovernmentChange}
          >
            <option value="">{t("form.selectGovernment") || "Select Government"}</option>
            {(Array.isArray(governments) ? governments : []).map((government) => (
              <option key={government._id} value={government.name}>
                {government.name}
              </option>
            ))}
          </select>
          {errors.government && (
            <span className="absolute bottom-0  text-error text-sm mt-1">
              {t(`validation.${errors.government}`) || "Government is required"}
            </span>
          )}
        </div>
      </div>

      {/* Administration Zone Selection - Only show if government is selected */}

      <div className="form-control relative">
        <div className="flex flex-col gap-1">
          <label className="label py-1">
            <span className="label-text text-xs">{t("form.administrationZone") || "Administration Zone"}</span>
          </label>
          <select
            disabled={!formData.government || zonesLoading}
            name="administrationZone"
            className={`select select-bordered select-sm  w-full ${errors.administrationZone ? "select-error animate-shake" : ""}`}
            value={formData.administrationZone || ""}
            onChange={handleInputChange}
          >
            <option value="">
              {zonesLoading
                ? (t("common.loading") || "Loading...")
                : (t("form.selectAdministrationZone") || "Select Administration Zone")
              }
            </option>
            {(Array.isArray(administrationZones) ? administrationZones : []).map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
          {errors.administrationZone && (
            <span className="absolute bottom-0  text-error text-sm mt-1">
              {t(`validation.${errors.administrationZone}`) || "Administration Zone is required"}
            </span>
          )}
        </div>
      </div>

      {/* Student-specific fields */}
      {role === 'student' && (
        <>
          <div className="form-control relative">
            <div className="flex flex-col gap-1">
              <label className="label py-1">
                <span className="label-text text-xs">{t('form.grade')}</span>
              </label>
              <select
                name="level"
                className={`select select-bordered select-sm w-full ${errors.level ? 'select-error animate-shake' : ''}`}
                value={formData.level}
                onChange={handleInputChange}
                required
              >
                <option value="">{t('form.selectGrade')}</option>
                {gradeLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {translateGradeLevel(level.label)}
                  </option>
                ))}
              </select>
              {errors.level && (
                <span className="absolute bottom-0  text-error text-sm mt-1">
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