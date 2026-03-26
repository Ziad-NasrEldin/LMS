import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Step2({ formData, handleInputChange, t, errors }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {i18n} = useTranslation();
  return (
    <div className="space-y-2">
      <p className="text-xl sm:text-2xl font-semibold mb-2">{t('form.parentDetails')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
        {/* Parent Phone */}
      <div className="form-control">
        <div className="flex flex-col gap-1">
          <label className="label py-1">
            <span className="label-text text-xs">{t('form.parentPhone')}</span>
          </label>
          <input
            type="text"
            name="parentPhoneNumber"
            className={`input input-bordered input-sm ${errors.parentPhoneNumber ? 'input-error animate-shake' : ''}`}
            value={formData.parentPhoneNumber || ''}
            onChange={handleInputChange}
            inputMode="tel"
            dir="ltr"
            required
          />
          {errors.parentPhoneNumber && (
            <span className="text-error text-sm mt-1">
              {t(`validation.${errors.parentPhoneNumber}`)}
            </span>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="form-control">
        <div className="flex flex-col gap-1">
          <label className="label py-1">
            <span className="label-text text-xs">{t('form.email')}</span>
          </label>
          <input
            type="email"
            name="email"
            className={`input input-bordered input-sm ${errors.email ? 'input-error animate-shake' : ''}`}
            value={formData.email || ''}
            onChange={handleInputChange}
            required
          />
          {errors.email && (
            <span className="text-error text-sm mt-1">
              {t(`validation.${errors.email}`)}
            </span>
          )}
        </div>
      </div>

      {/* Password */}
          <div className="form-control">
          <div className="flex flex-col gap-1">
            <label className="label py-1">
              <span className="label-text text-xs">{t('form.password')}</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className={`input input-bordered input-sm ${i18n.language === 'ar' ? 'pr-12' : 'pl-12'} ${errors.password ? 'input-error animate-shake' : ''}`}
                value={formData.password || ''}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                 className={`absolute top-1/2 ${i18n.language === 'ar' ? 'right-3' : 'left-3'} -translate-y-1/2 z-10`}
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <span className="text-error text-sm mt-1">
                {t('validation.passwordRequirements')}
              </span>
            )}
          </div>
        </div>
      {/* Confirm Password */}
      <div className="form-control relative">
        <div className="flex flex-col gap-1">
          <label className="label py-1">
            <span className="label-text text-xs">{t('form.confirmPassword')}</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
             className={`input input-bordered input-sm ${i18n.language === 'ar' ? 'pr-12' : 'pl-12'} ${errors.confirmPassword ? 'input-error animate-shake' : ''}`}
              value={formData.confirmPassword || ''}
              onChange={handleInputChange}
              required
            />
            <button
              type="button"
              className={`absolute top-1/2 ${i18n.language === 'ar' ? 'right-3' : 'left-3'} -translate-y-1/2 z-10`}
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
  );
}
