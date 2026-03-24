export default function StepsIndicator({ currentStep, t, role }) {
  const stepLabels = {
    student: [
      t('steps.personalInfo'),
      t('steps.parentInfo'),
      t('steps.review')
    ],
    parent: [
      t('steps.personalInfo'),
      t('steps.childrenInfo'),
      t('steps.review')
    ],
    teacher: [
      t('steps.personalInfo'),
      t('steps.professionalInfo'),
      t('steps.review')
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
              {t(`${label}`)}
            </div>
          );
        })}
      </div>
    </div>
  );
}