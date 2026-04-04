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
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>{t("stepProgress", { current: currentStep, total: totalSteps })}</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#0E5563] to-[#4DB3C2] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {stepLabels[role].map((label, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep === stepNumber;
          const isCompleted = currentStep > stepNumber;
          const isPending = currentStep < stepNumber;

          return (
            <div key={stepNumber} className="flex flex-col items-center flex-1">
              {/* Step Circle */}
              <div 
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
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

              {/* Step Label */}
              <span 
                className={`
                  mt-2 text-xs font-medium text-center hidden sm:block
                  ${isActive || isCompleted ? "text-[#0E5563]" : "text-slate-400"}
                `}
              >
                {t(label)}
              </span>

              {/* Connector Line */}
              {index < totalSteps - 1 && (
                <div 
                  className={`
                    absolute h-0.5 w-full top-4 left-1/2 -z-10
                    ${isCompleted ? "bg-[#0E5563]" : "bg-slate-200"}
                  `}
                  style={{ width: "calc(100% - 2rem)", transform: "translateX(50%)" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
