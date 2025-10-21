import { useState, useEffect } from "react";
import { getAllLevels } from '../../routes/levels';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from "react-i18next";

export default function StepParent({ formData, handleChildrenChange, t, errors, handleInputChange , gradeLevels}) {
    const [childrenCount, setChildrenCount] = useState(1);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { i18n } = useTranslation();
    // Ensure we have enough empty slots for all children
    const safeChildren = [...formData.children, ...Array(childrenCount - formData.children.length).fill('')];

   
    const renderErrorMessage = (errorKey) => {
        if (!errors[errorKey]) return null;
        return (
            <span className="text-error text-sm mt-1 animate-fade-in">
                {t(errors[errorKey]) || t('validation.genericError')}
            </span>
        );
    };

    return (
        <div className="space-y-4">
            {/* Global API Error Display */}
            {apiError && (
                <div className="alert alert-error animate-fade-in">
                    <span>{t('errors.apiError')}: {apiError}</span>
                </div>
            )}

            <p className="text-lg font-semibold">{t('form.parentDetails')}</p>

            {/* Email Field */}
            <div className="form-control">
                <div className="flex flex-col gap-2">
                    <label className="label">
                        <span className="label-text">{t('form.email')}</span>
                    </label>
                    <input
                        type="email"
                        name="email"
                        className={`input input-bordered ${errors.email ? 'input-error animate-shake' : ''}`}
                        value={formData.email || ''}
                        onChange={handleInputChange}
                        placeholder="email@example.com"
                        required
                    />
                    {errors.email && (
                    <span className="text-error text-sm mt-1">
                    {t(`validation.${errors.email}`)}
                    </span>
          )}
                </div>
            </div>

            {/* Password Field */}
            <div className="form-control">
                <div className="flex flex-col gap-2">
                    <label className="label">
                        <span className="label-text">{t('form.password')}</span>
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                             className={`input input-bordered ${i18n.language === 'ar' ? 'pr-12' : 'pl-12'} ${errors.password ? 'input-error animate-shake' : ''}`}
                            value={formData.password || ''}
                            onChange={handleInputChange}
                            required
                        />
                        <button
                            type="button"
                             className={`absolute top-1/2 ${i18n.language === 'ar' ? 'right-3' : 'left-3'} -translate-y-1/2 z-10 text-gray-500`}
                            onClick={() => setShowPassword(prev => !prev)}
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
                <div className="flex flex-col gap-2">
                    <label className="label">
                        <span className="label-text">{t('form.confirmPassword')}</span>
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            className={`input input-bordered ${i18n.language === 'ar' ? 'pr-12' : 'pl-12'} ${errors.confirmPassword ? 'input-error animate-shake' : ''}`}
                            value={formData.confirmPassword || ''}
                            onChange={handleInputChange}
                            required
                        />
                        <button
                            type="button"
                             className={`absolute top-1/2 ${i18n.language === 'ar' ? 'right-3' : 'left-3'} -translate-y-1/2 z-10 text-gray-500`}
                            onClick={() => setShowConfirmPassword(prev => !prev)}
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

            {/* Optional Level Field */}
            <div className="form-control">
                <div className="flex flex-col gap-2">
                    <label className="label">
                        <span className="label-text">{t('form.level')} ({t('form.optional')})</span>
                    </label>
                    <select
                        name="level"
                        className={`select select-bordered ${errors.level ? 'select-error animate-shake' : ''}`}
                        value={formData.level || ''}
                        onChange={handleInputChange}
                      
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

            <p className="text-lg font-semibold mt-6">{t('form.childrenSequenceIds')}</p>
            <p className="text-sm text-gray-500">{t('form.childrenSequenceIdsHelp')}</p>

            {safeChildren.slice(0, childrenCount).map((child, i) => (
                <div key={i} className="form-control">
                    <div className="flex flex-col gap-2">
                        <label className="label">
                            <span className="label-text">{t('form.childSequenceId')} #{i + 1}</span>
                        </label>
                                <input
                                type="text"
                                className={`input input-bordered ${errors.children?.[i] ? 'input-error animate-shake' : ''}`}
                                value={child || ''}
                                onChange={(e) => handleChildrenChange(i, e.target.value)}
                                placeholder="5f7d8e3a1c9d440000d4a7b2"
                                pattern="[a-f0-9]{24}"
                                title="24-character MongoDB ID"
                                required={i === 0}
                            />
                            <p className="label"> {t('form.optional')}</p>
                        {errors.children?.[i] && (
                            <span className="text-error text-sm mt-1 animate-fade-in">
                                {t(`validation.${errors.children[i]}`) || t('validation.invalidSequenceId')}
                            </span>
                        )}
                    </div>
                </div>
            ))}

            <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setChildrenCount(prev => prev + 1)}
                disabled={childrenCount >= 10} // Reasonable limit
            >
                {t('buttons.addAnotherChild')}
            </button>
        </div>
    );
}