import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaChevronLeft,
  FaChevronRight,
  FaCog,
  FaGraduationCap,
  FaMoneyBillWave,
  FaSignOutAlt,
  FaTicketAlt,
  FaUser,
  FaUserAlt,
  FaUserGraduate,
  FaUserShield,
  FaUserTie,
} from 'react-icons/fa';
import { Edit, Lightbulb } from 'lucide-react';
import { getUserDashboard, logoutUser } from '../routes/auth-services';
import { resolveProfileImageUrl } from '../utils/profileImage';

const NAVBAR_HEIGHT = 92;

const UnifiedSidebar = ({ isOpen, toggleSidebar }) => {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.language === 'ar';
  const location = useLocation();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const result = await getUserDashboard();
        if (result.success) {
          setUserData(result.data.data.userInfo);
          setError(null);
        } else {
          setError(result.error || 'Failed to fetch user data');
        }
      } catch (fetchError) {
        setError('Failed to fetch user data');
        console.error('Error fetching user data:', fetchError);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.getElementById('user-sidebar');
      const toggleButton = document.getElementById('sidebar-toggle');

      if (
        sidebar &&
        !sidebar.contains(event.target) &&
        toggleButton &&
        !toggleButton.contains(event.target) &&
        isOpen &&
        isMobile
      ) {
        toggleSidebar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, isOpen, toggleSidebar]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/');
    } catch (logoutError) {
      console.error('Logout error:', logoutError);
    }
  };

  const menuItems = useMemo(() => {
    const userRole = (userData?.role || 'guest').toLowerCase();

    const adminItems = [
      {
        id: 'admin-dashboard',
        title: t('adminDashboard') || 'Admin Dashboard',
        icon: <FaUserShield className="h-5 w-5" />,
        path: '/dashboard/admin-dashboard',
      },
      {
        id: 'create',
        title: t('Create') || 'Create',
        icon: <Edit className="h-5 w-5" />,
        path: '/dashboard/admin-dashboard/create',
      },
      {
        id: 'signed-lecturers',
        title: t('signedLecturers') || 'Signed Lecturers',
        icon: <Lightbulb className="h-5 w-5" />,
        path: '/dashboard/admin-dashboard/signed-lecturers',
      },
      {
        id: 'financial-dashboard',
        title: isRTL ? 'اللوحة المالية' : 'Financial Dashboard',
        icon: <FaMoneyBillWave className="h-5 w-5" />,
        path: '/dashboard/admin-dashboard/financial-dashboard',
      },
      {
        id: 'promo-codes-management',
        title:
          t('promoCodesManagement') ||
          (isRTL ? 'إدارة أكواد الشحن' : 'Promo Codes Management'),
        icon: <FaTicketAlt className="h-5 w-5" />,
        path: '/dashboard/admin-dashboard/promo-codes-management',
      },
    ];

    const lecturerItems = [
      {
        id: 'lecturer-dashboard',
        title: t('myDashboard') || 'My Dashboard',
        icon: <FaUserTie className="h-5 w-5" />,
        path: '/dashboard/lecturer-dashboard',
      },
      {
        id: 'lectures',
        title: t('lectures') || 'Lectures',
        icon: <FaGraduationCap className="h-5 w-5" />,
        path: '/dashboard/lecturer-dashboard/lecture-page',
      },
      {
        id: 'my-lectures',
        title: t('MyLectures') || 'My Lectures',
        icon: <FaGraduationCap className="h-5 w-5" />,
        path: '/dashboard/lecturer-dashboard/lectures-page',
      },
    ];

    const assistantItems = [
      {
        id: 'assistant-dashboard',
        title: t('myDashboard') || 'My Dashboard',
        icon: <FaUserAlt className="h-5 w-5" />,
        path: '/dashboard/assistant-page',
      },
    ];

    const studentItems = [
      {
        id: 'student-dashboard',
        title: t('myDashboard') || 'My Dashboard',
        icon: <FaUserGraduate className="h-5 w-5" />,
        path: '/dashboard/student-dashboard/promo-codes',
      },
      {
        id: 'courses',
        title: t('courses') || 'Courses',
        icon: <FaGraduationCap className="h-5 w-5" />,
        path: '/dashboard/student-dashboard/lecture-page',
      },
      {
        id: 'lectures',
        title: t('MyLectures') || 'My Lectures',
        icon: <FaGraduationCap className="h-5 w-5" />,
        path: '/dashboard/student-dashboard/lectures-page',
      },
    ];

    const parentItems = [
      {
        id: 'parent-dashboard',
        title: t('myDashboard') || 'My Dashboard',
        icon: <FaUserGraduate className="h-5 w-5" />,
        path: '/dashboard/student-dashboard/promo-codes',
      },
    ];

    const commonItems = [
      {
        id: 'settings',
        title: t('settings') || 'Settings',
        icon: <FaCog className="h-5 w-5" />,
        path: '/dashboard/settings',
        divider: true,
      },
      {
        id: 'logout',
        title: t('logout') || 'Logout',
        icon: <FaSignOutAlt className="h-5 w-5" />,
        path: '/',
        onClick: handleLogout,
      },
    ];

    if (userRole === 'admin' || userRole === 'subadmin') {
      return [...adminItems, ...commonItems];
    }
    if (userRole === 'lecturer') {
      return [...lecturerItems, ...commonItems];
    }
    if (userRole === 'assistant') {
      return [...assistantItems, ...commonItems];
    }
    if (userRole === 'student') {
      return [...studentItems, ...commonItems];
    }
    if (userRole === 'parent') {
      return [...parentItems, ...commonItems];
    }

    return commonItems;
  }, [handleLogout, isRTL, t, userData?.role]);

  return (
    <>
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] md:hidden"
          style={{ top: `${NAVBAR_HEIGHT}px` }}
          onClick={toggleSidebar}
        />
      )}

      <div
        id="user-sidebar"
        className={`fixed z-40 flex w-[17.5rem] flex-col overflow-hidden rounded-[1.75rem] border border-white/50 text-base-content shadow-[0_24px_55px_rgba(14,33,38,0.20)] backdrop-blur-xl transition-all duration-300 ease-out ${
          isOpen
            ? 'scale-100 translate-x-0 opacity-100'
            : isRTL
              ? 'translate-x-[120%] scale-[0.98] opacity-0'
              : '-translate-x-[120%] scale-[0.98] opacity-0'
        }`}
        style={{
          top: `${NAVBAR_HEIGHT + 14}px`,
          bottom: '14px',
          [isRTL ? 'right' : 'left']: '16px',
          background:
            'linear-gradient(168deg, rgba(255,255,255,0.94) 0%, rgba(241,243,246,0.93) 48%, rgba(188,231,236,0.72) 100%)',
        }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 left-8 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />
          <div className="absolute -right-8 bottom-10 h-28 w-28 rounded-full bg-info/25 blur-2xl" />
        </div>

        <div className="relative flex items-center justify-between border-b border-base-300/70 p-4">
          <div
            className={`mx-auto flex items-center gap-3 ${
              isRTL ? 'flex-row-reverse' : ''
            }`}
          >
            <span className="font-extrabold tracking-tight text-primary">
              {t('dashboardTitle') || 'Dashboard'}
            </span>
            <div className="rounded-full bg-primary p-2 text-primary-content shadow-md shadow-primary/25">
              <FaUser className="h-2 w-2" />
            </div>
          </div>
        </div>

        {userData && (
          <div className="relative mx-3 mt-3 rounded-2xl border border-white/70 bg-white/65 px-3 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="avatar">
                <div className="h-11 w-11 rounded-full ring ring-primary/70 ring-offset-2 ring-offset-base-100">
                  <img
                    src={resolveProfileImageUrl(userData?.profilePic)}
                    alt={userData?.name || 'User Avatar'}
                    className="object-cover"
                    onError={(event) => {
                      event.currentTarget.src = '/person.png';
                    }}
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold leading-5">{userData.name}</p>
                <p className="text-xs text-base-content/70">{userData.role}</p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex h-32 items-center justify-center">
            <div className="loading loading-spinner loading-md text-primary" />
          </div>
        )}

        {error && !loading && (
          <div className="p-4 text-sm text-error">
            <p>{error}</p>
            <button
              className="btn btn-sm btn-outline btn-error mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="relative mt-3 flex-1 overflow-y-auto px-2 pb-4">
            {menuItems.map((item) => (
              <React.Fragment key={item.id}>
                <Link
                  to={item.path}
                  className={`group mb-1 flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-primary text-primary-content shadow-[0_10px_25px_rgba(14,85,99,0.22)]'
                      : 'text-base-content hover:bg-white/70 hover:text-primary'
                  }`}
                  onClick={(event) => {
                    if (item.onClick) {
                      event.preventDefault();
                      item.onClick();
                    }
                    if (isMobile) {
                      toggleSidebar();
                    }
                  }}
                >
                  <div
                    className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary-content/15 text-primary-content'
                        : 'bg-primary/10 text-primary group-hover:bg-primary/15'
                    } ${isRTL ? 'ml-1' : 'mr-1'}`}
                  >
                    {item.icon}
                  </div>
                  <span className="mx-auto font-semibold tracking-tight">
                    {item.title}
                  </span>
                  {item.comment && (
                    <div className="tooltip tooltip-left" data-tip={item.comment}>
                      <div className="h-2 w-2 rounded-full bg-warning" />
                    </div>
                  )}
                </Link>
                {item.divider && <div className="my-2 border-t border-base-300/70" />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <button
        id="sidebar-toggle"
        onClick={toggleSidebar}
        className={`fixed z-50 -translate-y-1/2 rounded-2xl border border-white/60 bg-[linear-gradient(140deg,#0E5563_0%,#146A78_100%)] p-2 text-primary-content shadow-[0_12px_28px_rgba(14,85,99,0.35)] transition-all duration-300 hover:scale-105 ${
          isRTL ? 'right-1' : 'left-1'
        } ${
          isOpen && isRTL
            ? '-translate-x-[18.5rem]'
            : isOpen && !isRTL
              ? 'translate-x-[18.5rem]'
              : ''
        }`}
        style={{
          top: `calc(${NAVBAR_HEIGHT}px + 42%)`,
        }}
      >
        {isRTL ? (
          isOpen ? (
            <FaChevronRight />
          ) : (
            <FaChevronLeft />
          )
        ) : isOpen ? (
          <FaChevronLeft />
        ) : (
          <FaChevronRight />
        )}
      </button>
    </>
  );
};

export default UnifiedSidebar;
