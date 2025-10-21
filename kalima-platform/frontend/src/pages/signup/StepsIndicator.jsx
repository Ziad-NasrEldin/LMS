export default function StepsIndicator({ currentStep, t, role }) {
  const stepLabels = {
    student: [
      t('steps.personalInfo'),
      t('steps.parentInfo'),
      t('steps.hobbies'),
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
    <div className="mt-8 pt-8">
      <div className="steps steps-horizontal w-full">
        {stepLabels[role].map((label, index) => {
          const stepNumber = index + 1;
          return (
            <div 
              key={stepNumber} 
              className={`text-xs sm:text-lg step ${currentStep >= stepNumber ? 'step-primary' : ''}`}
            >
              {t(`${label}`)}
            </div>
          );
        })}
      </div>
    </div>
  );
}