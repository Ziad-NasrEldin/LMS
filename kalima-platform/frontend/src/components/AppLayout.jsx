import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import NotificationCenter from "./NotificationCenter";
import { getUserDashboard } from "../routes/auth-services";

const AppLayout = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const dashboardResult = await getUserDashboard();
        if (dashboardResult.success) {
          const { userInfo } = dashboardResult.data.data;
          setUserId(userInfo.id);
          setUserRole(userInfo.role);
        }
      } catch (err) {
        console.error("Error fetching user data for notifications:", err);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className={`app-layout ${isRTL ? "rtl" : "ltr"}`}>
      <header className="flex justify-between items-center p-4 bg-base-100 shadow-md">
        <div className="flex-1">{/* Your logo or header content */}</div>

        {userId && (
          <div className="flex items-center gap-4">
            <NotificationCenter userId={userId} />
            {/* Other header elements like profile dropdown, etc. */}
          </div>
        )}
      </header>

      <main className="container mx-auto p-4">{children}</main>
    </div>
  );
};

export default AppLayout;
