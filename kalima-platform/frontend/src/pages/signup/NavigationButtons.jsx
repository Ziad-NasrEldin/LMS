export default function NavigationButtons({ 
  currentStep, 
  handlePrev, 
  handleNext, 
  t, 
  isLoading,
  totalSteps,
  role,
  isRTL,
}) {
  const previousButton = (
    <button
      onClick={handlePrev}
      disabled={currentStep === 1 || isLoading}
      className="btn btn-outline btn-sm sm:btn-md"
      type="button"
    >
      {t('buttons.previous')}
    </button>
  )

  const nextOrSubmitButton = (
    <button
      onClick={handleNext}
      className="btn btn-primary btn-sm sm:btn-md"
      disabled={isLoading}
      type="button"
    >
      {isLoading ? (
        <span className="loading loading-spinner"></span>
      ) : (
        currentStep === totalSteps[role] ? t('buttons.submit') : t('buttons.next')
      )}
    </button>
  )

  return (
    <div className="mt-6 flex items-center justify-between gap-3 px-0 sm:mt-8 sm:px-[10%]">
      {isRTL ? nextOrSubmitButton : previousButton}
      {isRTL ? previousButton : nextOrSubmitButton}
    </div>
  );
}