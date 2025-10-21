import { useState, useEffect } from 'react';
import { getAllGovernments, getGovernmentZones } from '../../routes/governments';

export default function Step1({ formData, handleInputChange, t, errors, role, gradeLevels }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [governments, setGovernments] = useState([]);
  const [administrationZones, setAdministrationZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(false);

  const toEnglishDigits = (str) =>
    str.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[^\d]/g, "");

  const handleNumberOnlyChange = (e) => {
    const { name, value } = e.target;
    const cleaned = toEnglishDigits(value);
    handleInputChange({ target: { name, value: cleaned } });
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
        <p className="text-2xl font-semibold">{t('form.personalDetails')}</p>
        <div className="flex items-center justify-center py-8">
          <div className="loading loading-spinner loading-lg"></div>
          <span className="ml-2">{t('common.loading') || 'Loading...'}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-2xl font-semibold">{t('form.personalDetails')}</p>
        <div className="alert alert-error">
          <span>{t('errors.loadingFailed') || 'Failed to load data:'} {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-2xl font-semibold">{t('form.personalDetails')}</p>

      {/* Common fields */}
      <div className="form-control relative pb-5">
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text">{t('form.fullName')}</span>
          </label>
          <input
            type="text"
            name="fullName"
            className={`input input-bordered w-2/3 lg:w-1/2 ${errors.fullName ? 'input-error animate-shake' : ''}`}
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

      <div className="form-control relative pb-5">
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text">{t("form.profilePic") || "Profile Picture"}</span>
          </label>
          <input
            type="file"
            name="profilePic"
            accept=".jpg,.jpeg,.png"
            className="file-input file-input-bordered w-2/3 lg:w-1/2"
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


      <div className="form-control relative pb-5">
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text">{t('form.gender')}</span>
          </label>
          <select
            name="gender"
            className={`select select-bordered w-2/3 lg:w-1/2 ${errors.gender ? 'select-error animate-shake' : ''}`}
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

      <div className="form-control relative pb-5">
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text">{t('form.phoneNumber')}</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleNumberOnlyChange}
            className={`input input-bordered w-2/3 lg:w-1/2 ${errors.phoneNumber ? 'input-error animate-shake' : ''}`}
            required
          />
          {errors.phoneNumber && (
            <span className="absolute bottom-0  text-error text-sm mt-1">
              {t(`validation.${errors.phoneNumber}`)}
            </span>
          )}
        </div>
      </div>

      <div className="form-control relative pb-5">
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text">{t('form.referralSerial')}</span>
          </label>
          <input
            type="text"
            name="referralSerial"
            className={`input input-bordered w-2/3 lg:w-1/2 ${errors.referralSerial ? 'input-error animate-shake' : ''}`}
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
          <div className="form-control relative pb-5">
            <div className="flex flex-col gap-2">
              <label className="label">
                <span className="label-text">{t('form.phoneNumber2')}</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                name="phoneNumber2"
                value={formData.phoneNumber2}
                onChange={handleNumberOnlyChange}
                className="input input-bordered w-2/3 lg:w-1/2"
                required
              />
              <label className="label">
                <span className="label-text">{t('form.optional')}</span>
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
      <div className="form-control relative pb-5">
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text">{t("form.government") || "Government"}</span>
          </label>
          <select
            name="government"
            className={`select select-bordered w-2/3 lg:w-1/2 ${errors.government ? "select-error animate-shake" : ""}`}
            value={formData.government || ""}
            onChange={handleGovernmentChange}
          >
            <option value="">{t("form.selectGovernment") || "Select Government"}</option>
            {governments.map((government) => (
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

      <div className="form-control relative pb-5">
        <div className="flex flex-col gap-2">
          <label className="label">
            <span className="label-text">{t("form.administrationZone") || "Administration Zone"}</span>
          </label>
          <select
            disabled={!formData.government || zonesLoading}
            name="administrationZone"
            className={`select select-bordered  w-2/3 lg:w-1/2 ${errors.administrationZone ? "select-error animate-shake" : ""}`}
            value={formData.administrationZone || ""}
            onChange={handleInputChange}
          >
            <option value="">
              {zonesLoading
                ? (t("common.loading") || "Loading...")
                : (t("form.selectAdministrationZone") || "Select Administration Zone")
              }
            </option>
            {administrationZones.map((zone) => (
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
          <div className="form-control relative pb-5">
            <div className="flex flex-col gap-2">
              <label className="label">
                <span className="label-text">{t('form.grade')}</span>
              </label>
              <select
                name="level"
                className={`select select-bordered w-2/3 lg:w-1/2 ${errors.level ? 'select-error animate-shake' : ''}`}
                value={formData.level}
                onChange={handleInputChange}
                required
              >
                <option value="">{t('form.selectGrade')}</option>
                {gradeLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {t(`gradeLevels.${level.label}`)}
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
  );
}