import Button from "../../components/ui/Button"
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
      className="h-10 px-6 text-sm font-semibold rounded-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {t('buttons.previous')}
    </button>
  )

  const nextOrSubmitButton = (
    <button
      onClick={handleNext}
      type="button"
      className="h-10 px-6 text-sm font-semibold rounded-lg bg-[#0E5563] text-white hover:bg-[#0a4250] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={isLoading}
    >
      {isLoading ? '...' : currentStep === totalSteps[role] ? t('buttons.submit') : t('buttons.next')}
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
