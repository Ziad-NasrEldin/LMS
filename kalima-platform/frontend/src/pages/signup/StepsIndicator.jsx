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

  return (
    <div className="w-full">
      <div className="steps steps-horizontal w-full text-[11px] sm:text-[13px]">
        {stepLabels[role].map((label, index) => {
          const stepNumber = index + 1;
          return (
            <div 
              key={stepNumber} 
              className={`text-[11px] sm:text-[13px] step ${currentStep >= stepNumber ? 'step-primary' : ''}`}
            >
              {t(label)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
