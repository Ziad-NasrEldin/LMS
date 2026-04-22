import Hero from "./hero";
import UserManagementTable from "./userManageTable";
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import { designTokens } from "../../../../constants/designTokens";
import Button from "../../../../components/ui/Button";

const AdminDashboard = () => {
  const { i18n } = useTranslation('admin');

  const TOKENS = designTokens.colors;
  const GRADIENTS = designTokens.gradients;

  const isRTL = i18n.language === 'ar'; 
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div 
      className="relative mx-auto w-full max-w-full p-6 md:p-10 min-h-screen font-[Cairo]" 
      dir={dir}
      style={{ background: TOKENS.creamSurface, color: TOKENS.inkText }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-50" style={{ background: GRADIENTS.pageAtmosphere }} />

      <div className="transition-all duration-300 space-y-8 relative z-10">
        <section
          className={`rounded-3xl p-4 sm:p-5 ${isRTL ? "text-right" : "text-left"}`}
          style={{
            background: "rgba(255,255,255,0.8)",
            borderColor: "transparent",
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold" style={{ color: TOKENS.deepTeal }}>
                {isRTL ? "إدارة أكواد الشحن" : "Promo Codes Management"}
              </h2>
        <p className="mt-1 text-sm text-slate-700">
                {isRTL
                  ? "انتقل مباشرةً إلى صفحة إنشاء وإدارة أكواد الشحن."
                  : "Jump directly to the page for creating and managing promo codes."}
              </p>
            </div>

            <Link
              to="/dashboard/admin-dashboard/promo-codes-management"
              className="inline-block w-full sm:w-auto"
            >
              <Button variant="primary" className="w-full">
                {isRTL ? "فتح الصفحة" : "Open Page"}
              </Button>
            </Link>
          </div>
        </section>

        <Hero />
        <UserManagementTable />
      </div>
    </div>
  );
};

export default AdminDashboard;
