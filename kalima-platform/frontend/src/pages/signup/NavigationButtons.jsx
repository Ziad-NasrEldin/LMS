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
      className="btn btn-outline h-10 px-6 text-sm font-semibold"
      type="button"
    >
      {t('buttons.previous')}
    </button>
  )

  const nextOrSubmitButton = (
    <button
      onClick={handleNext}
      className="btn btn-primary h-10 px-6 text-sm font-semibold"
      disabled={isLoading}
      type="button"
    >
      {isLoading ? (
        <span className="loading loading-spinner loading-sm"></span>
      ) : (
        currentStep === totalSteps[role] ? t('buttons.submit') : t('buttons.next')
      )}
    </button>
  )

  return (
    <div className="flex items-center justify-between gap-3 w-full">
      {isRTL ? (
        <>
          {nextOrSubmitButton}
          {previousButton}
        </>
      ) : (
        <>
          {previousButton}
          {nextOrSubmitButton}
        </>
      )}
    </div>
  );
}
