import { useState } from "react";
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from "react-i18next";
import DSSelect from "../../components/DSSelect"
import Button from "../../components/ui/Button"
import Input from "../../components/ui/Input"

export default function StepParent({ formData, handleChildrenChange, t, errors, handleInputChange, levelHierarchy, levelsLoading }) {
    const [childrenCount, setChildrenCount] = useState(1);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const stageOptions = levelHierarchy?.stageOptions || [];
    // Ensure we have enough empty slots for all children
    const safeChildren = [...formData.children, ...Array(childrenCount - formData.children.length).fill('')];

    // Handle stage checkbox toggle
    const handleStageToggle = (stageValue) => {
        const currentStages = formData.stages || [];
        const isSelected = currentStages.includes(stageValue);
        const newStages = isSelected
            ? currentStages.filter(s => s !== stageValue)
            : [...currentStages, stageValue];
        
        handleInputChange({
            target: {
                name: 'stages',
                value: newStages
            }
        });
    };

    const renderErrorMessage = (errorKey) => {
        if (!errors[errorKey]) return null;
        return (
            <span className="text-error text-sm mt-1 animate-fade-in">
                {t(errors[errorKey]) || t('validation.genericError')}
            </span>
        );
    };

    return (
        <div className="space-y-2">
            {/* Global API Error Display */}
            {apiError && (
      <div className="mb-4 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-[#991B1B] shadow-sm flex items-center gap-3 animate-fade-in">
                    <span>{t('errors.apiError')}: {apiError}</span>
                </div>
            )}
            <p className="text-lg font-semibold">{t('form.parentDetails')}</p>
            <div className="mb-4">
                <div className="flex flex-col gap-1">
                    <label className="block mb-1">
                        <span className="text-xs">{t('form.email')}</span>
                    </label>
                    <Input
                        type="email"
                        name="email"
                        className={`${errors.email ? 'border-error' : ''} animate-shake`}
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

            <p className="text-lg font-semibold">{t('form.parentDetails')}</p>

            {/* Email Field */}
            <div className="form-control">
                <div className="flex flex-col gap-1">
                    <label className="label py-1">
                        <span className="label-text text-xs">{t('form.email')}</span>
                    </label>
                     <Input
                         type="email"
                         name="email"
                         className={`${errors.email ? 'border-error animate-shake' : ''}`}
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
            <div className="mb-4">
                <div className="flex flex-col gap-1">
                    <label className="block mb-1">
                        <span className="text-xs">{t('form.password')}</span>
                    </label>
                    <div className="relative">
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            className={`${i18n.language === 'ar' ? 'pr-12' : 'pl-12'} ${errors.password ? 'border-error animate-shake' : ''}`}
                            value={formData.password || ''}
                            onChange={handleInputChange}
                            required
                        />
                        <button
                            type="button"
                  className={`absolute top-1/2 ${i18n.language === 'ar' ? 'right-3' : 'left-3'} z-10 -translate-y-1/2 text-slate-600`}
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
            <div className="mb-4 relative">
                <div className="flex flex-col gap-1">
                    <label className="block mb-1">
                        <span className="text-xs">{t('form.confirmPassword')}</span>
                    </label>
                    <div className="relative">
                        <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            className={`${i18n.language === 'ar' ? 'pr-12' : 'pl-12'} ${errors.confirmPassword ? 'border-error animate-shake' : ''}`}
                            value={formData.confirmPassword || ''}
                            onChange={handleInputChange}
                            required
                        />
                        <button
                            type="button"
                  className={`absolute top-1/2 ${i18n.language === 'ar' ? 'right-3' : 'left-3'} z-10 -translate-y-1/2 text-slate-600`}
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
                {errors.password && (
                <span className="text-error text-sm mt-1">
                  {t('validation.passwordRequirements')}
                </span>
                )}
            </div>

            {/* Confirm Password */}
            <div className="form-control relative">
                <div className="flex flex-col gap-1">
                    <label className="label py-1">
                        <span className="label-text text-xs">{t('form.confirmPassword')}</span>
                    </label>
                    <div className="relative">
                         <Input
                             type={showConfirmPassword ? 'text' : 'password'}
                             name="confirmPassword"
                             className={`${i18n.language === 'ar' ? 'pr-12' : 'pl-12'} ${errors.confirmPassword ? 'border-error animate-shake' : ''}`}
                             value={formData.confirmPassword || ''}
                             onChange={handleInputChange}
                             required
                         />
                        <button
                            type="button"
                  className={`absolute top-1/2 ${i18n.language === 'ar' ? 'right-3' : 'left-3'} z-10 -translate-y-1/2 text-slate-600`}
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

            <div className="mb-4">
                <div className="flex flex-col gap-1">
                    <label className="block mb-1">
                        <span className="text-xs">
                            {t('form.stages', { defaultValue: isRTL ? 'المراحل' : 'Stages' })}
                        </span>
                    </label>
                    <div className={`space-y-2 p-3 rounded-xl border ${errors.stages ? 'border-error bg-error/5' : 'border-slate-200 bg-white'}`}>
                        {levelsLoading ? (
                                <span className="text-sm text-slate-900/60">
                                {t('form.loadingStages', { defaultValue: isRTL ? 'جاري تحميل المراحل...' : 'Loading stages...' })}
                            </span>
                        ) : stageOptions.length === 0 ? (
                                <span className="text-sm text-slate-900/60">
                                {t('form.noStagesAvailable', { defaultValue: isRTL ? 'لا توجد مراحل متاحة' : 'No stages available' })}
                            </span>
                        ) : (
                            stageOptions.map((stage) => (
                                <label key={stage.value} className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 p-2 rounded-lg transition-colors">
                                    <input
                                        type="checkbox"
                                        className="accent-primary"
                                        checked={(formData.stages || []).includes(stage.value)}
                                        onChange={() => handleStageToggle(stage.value)}
                                    />
                                    <span className="text-sm">{stage.label}</span>
                                </label>
                            ))
                        )}
                    </div>
                    {errors.stages && (
                        <span className="text-error text-sm mt-1">
                            {t(`validation.${errors.stages}`)}
                        </span>
                    )}
                </div>
            </div>

            <div className="mb-4">
                <div className="flex flex-col gap-1">
                    <label className="block mb-1">
                        <span className="text-xs">{t('form.profession')}</span>
                    </label>
                    <Input
                        type="text"
                        name="profession"
                        className={`${errors.profession ? 'border-error animate-shake' : ''}`}
                        value={formData.profession || ''}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.profession && (
                        <span className="text-error text-sm mt-1">
                            {t(`validation.${errors.profession}`)}
                        </span>
                    )}
                </div>
            </div>

            <p className="text-lg font-semibold mt-6">{t('form.childrenSequenceIds')}</p>
          <p className="text-sm text-slate-600">{t('form.childrenSequenceIdsHelp')}</p>

            {safeChildren.slice(0, childrenCount).map((child, i) => (
                <div key={i} className="mb-4">
                    <div className="flex flex-col gap-1">
                        <label className="block mb-1">
                            <span className="text-xs">{t('form.childSequenceId')} #{i + 1}</span>
                        </label>
                        <Input
                            type="text"
                            className={`${errors.children?.[i] ? 'border-error animate-shake' : ''}`}
                            value={child || ''}
                            onChange={(e) => handleChildrenChange(i, e.target.value)}
                            placeholder="5f7d8e3a1c9d440000d4a7b2"
                            pattern="[a-f0-9]{24}"
                            title="24-character MongoDB ID"
                            required={i === 0}
                        />
                        <p className="text-xs opacity-60"> {t('form.optional')}</p>
                        {errors.children?.[i] && (
                            <span className="text-error text-sm mt-1 animate-fade-in">
                                {t(`validation.${errors.children[i]}`) || t('validation.invalidSequenceId')}
                            </span>
                        )}
                    </div>
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                className="h-12 min-h-12 rounded-xl px-5 text-base font-semibold"
                onClick={() => setChildrenCount(prev => prev + 1)}
                disabled={childrenCount >= 10} // Reasonable limit
            >
                {t('buttons.addAnotherChild')}
            </Button>
        </div>
    );
}
