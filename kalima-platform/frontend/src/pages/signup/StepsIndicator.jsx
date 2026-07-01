export default function StepsIndicator({ currentStep, t, role }) {
  const stepLabels = {
    student: [
      "steps.personalInfo",
      "steps.parentInfo",
      "steps.hobbies",
      "steps.review"
    ],
    parent: [
      "steps.personalInfo",
      "steps.childrenInfo",
      "steps.review"
    ],
    teacher: [
      "steps.personalInfo",
      "steps.professionalInfo",
      "steps.review"
    ]
  };

  const totalSteps = stepLabels[role].length;
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="mb-2 flex justify-between text-xs font-semibold text-slate-600">
          <span>{t("stepProgress", { current: currentStep, total: totalSteps })}</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#0E5563] to-[#4DB3C2] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-start">
        {stepLabels[role].map((label, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep === stepNumber;
          const isCompleted = currentStep > stepNumber;
          const isPending = currentStep < stepNumber;

          return (
            <div key={stepNumber} className="flex min-w-0 flex-1 items-start">
              <div className="flex min-w-0 flex-1 flex-col items-center">
                <div
                  className={`
                    flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-8 sm:w-8 sm:text-sm
                    transition-all duration-300
                    ${isCompleted ? "bg-[#0E5563] text-white" : ""}
                    ${isActive ? "bg-[#0E5563] text-white ring-4 ring-[#0E5563]/20" : ""}
                    ${isPending ? "bg-slate-100 text-slate-400" : ""}
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>

                <span
                  className={`
                    mt-1.5 hidden max-w-24 text-center text-xs font-medium leading-4 sm:block
                    ${isActive || isCompleted ? "text-[#0E5563]" : "text-slate-400"}
                  `}
                >
                  {t(label)}
                </span>
              </div>

              {index < totalSteps - 1 && (
                <div
                  className={`
                    mt-3.5 h-0.5 flex-1 sm:mt-4
                    ${isCompleted ? "bg-[#0E5563]" : "bg-slate-200"}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
