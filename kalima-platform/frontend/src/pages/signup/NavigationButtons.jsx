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
      type="button"
      className="min-h-11 rounded-xl border-2 border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {t('buttons.previous')}
    </button>
  )

  const nextOrSubmitButton = (
    <button
      onClick={handleNext}
      type="button"
      className="min-h-11 rounded-xl bg-[#0E5563] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0a4250] disabled:cursor-not-allowed disabled:opacity-50"
      disabled={isLoading}
    >
      {isLoading ? '...' : currentStep === totalSteps[role] ? t('buttons.submit') : t('buttons.next')}
    </button>
  )

  return (
    <div className="grid w-full grid-cols-2 gap-3">
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
