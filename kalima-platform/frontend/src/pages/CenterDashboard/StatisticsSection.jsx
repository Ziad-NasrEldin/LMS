import { useTranslation } from 'react-i18next';

const StatisticsSection = () => {
  const { t, i18n } = useTranslation("centerDashboard");
  const isRTL = i18n.language === 'ar';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <h2 className="text-xl font-bold text-right mb-4">{t("statistics.examResults")}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-sm p-4 text-center">
          <div className="text-primary text-4xl font-bold mb-2">85%</div>
          <div className="text-base-content/70">{t("statistics.avgGrades")}</div>
        </div>

        <div className="card bg-base-100 shadow-sm p-4 text-center">
          <div className="text-secondary text-4xl font-bold mb-2">12/15</div>
          <div className="text-base-content/70">{t("statistics.testsCompleted")}</div>
        </div>

        <div className="card bg-base-100 shadow-sm p-4 text-center">
          <div className="text-accent text-4xl font-bold mb-2">92%</div>
          <div className="text-base-content/70">{t("statistics.attendanceRate")}</div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm mt-6 p-4">
        <h3 className="font-bold text-right mb-4">{t("statistics.gradeSummary")}</h3>
        <div className="text-right">
          <div className="flex justify-end items-center gap-2 mb-2">
            <span>85/100</span>
            <span className="font-medium">{t("statistics.finalExam")}</span>
          </div>
          <div className="flex justify-end items-center gap-2 mb-2">
            <span>42/50</span>
            <span className="font-medium">{t("statistics.midtermExam")}</span>
          </div>
          <div className="flex justify-end items-center gap-2 mb-2">
            <span>28/30</span>
            <span className="font-medium">{t("statistics.homework")}</span>
          </div>
          <div className="flex justify-end items-center gap-2">
            <span>155/180</span>
            <span className="font-medium">{t("statistics.total")}</span>
          </div>
        </div>
        <button className="btn btn-primary mt-4 w-full md:w-auto md:self-end">{t("statistics.viewReport")}</button>
      </div>
    </div>
  );
};

export default StatisticsSection;
