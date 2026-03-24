import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaUser,
  FaGraduationCap,
  FaCog,
  FaSignOutAlt,
  FaTimes,
  FaChevronRight,
  FaChevronLeft,
  FaUserAlt,
  FaUserTie,
  FaUserGraduate,
  FaUserShield,
  FaMoneyBillWave
} from 'react-icons/fa';
import { getUserDashboard, logoutUser } from '../routes/auth-services';
import { Edit, Lightbulb } from 'lucide-react';
import { resolveProfileImageUrl } from '../utils/profileImage';

const UnifiedSidebar = ({ isOpen, toggleSidebar }) => {
  const NAVBAR_HEIGHT = 92;
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.language === 'ar';
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const result = await getUserDashboard();
        if (result.success) {
          setUserData(result.data.data.userInfo);
        } else {
          setError(result.error);
        }
      } catch (error) {
        setError("Failed to fetch user data");
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Check if mobile on mount and resize
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

  // Close sidebar when clicking outside on mobile
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
  }, [isOpen, toggleSidebar, isMobile]);


  // Handle logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Define menu items based on user role
  const getMenuItems = () => {
    const userRole = userData?.role || 'Guest';

    // Admin-specific menu items
    const adminItems = [
      {
        id: 'admin-dashboard',
        title: t('adminDashboard') || 'Admin Dashboard',
        icon: <FaUserShield className="w-5 h-5" />,
        path: '/dashboard/admin-dashboard'
      },
      {
        id: 'create',
        title: t('Create') || 'Create',
        icon: <Edit className="w-5 h-5" />,
        path: '/dashboard/admin-dashboard/create'
      },
      {
        id: 'lectures',
        title: t('MyLectures') || 'My Lectures',
        icon: <FaGraduationCap className="w-5 h-5" />,
        path: '/dashboard/admin-dashboard/lectures-page'
      },
      {
        id: 'signed-lecturers',
        title: t('signedLecturers') || 'Signed Lecturers',
        icon: <Lightbulb className="w-5 h-5" />,
        path: '/dashboard/admin-dashboard/signed-lecturers'
      },
      {
        id: 'financial-dashboard',
        title: isRTL ? 'اللوحة المالية' : 'Financial Dashboard',
        icon: <FaMoneyBillWave className="w-5 h-5" />,
        path: '/dashboard/admin-dashboard/financial-dashboard'
      },
    ];

    // Lecturer-specific menu items
    const lecturerItems = [
      {
        id: 'lecturer-dashboard',
        title: t('myDashboard') || 'My Dashboard',
        icon: <FaUserTie className="w-5 h-5" />,
        path: '/dashboard/lecturer-dashboard'
      },
      {
        id: 'lectures',
        title: t('lectures') || 'Lectures',
        icon: <FaGraduationCap className="w-5 h-5" />,
        path: '/dashboard/lecturer-dashboard/lecture-page'
      },
      {
        id: 'my-lectures',
        title: t('MyLectures') || 'My Lectures',
        icon: <FaGraduationCap className="w-5 h-5" />,
        path: '/dashboard/lecturer-dashboard/lectures-page'
      },
    ];

    // Assistant-specific menu items
    const assistantItems = [
      {
        id: 'assistant-dashboard',
        title: t('myDashboard') || 'My Dashboard',
        icon: <FaUserAlt className="w-5 h-5" />,
        path: '/dashboard/assistant-page'
      },
    ];

    // Student-specific menu items
    const studentItems = [
      {
        id: 'student-dashboard',
        title: t('myDashboard') || 'My Dashboard',
        icon: <FaUserGraduate className="w-5 h-5" />,
        path: '/dashboard/student-dashboard/promo-codes'
      },
      {
        id: 'courses',
        title: t('courses') || 'Courses',
        icon: <FaGraduationCap className="w-5 h-5" />,
        path: '/dashboard/student-dashboard/lecture-page'
      },
      {
        id: 'lectures',
        title: t('MyLectures') || 'My Lectures',
        icon: <FaGraduationCap className="w-5 h-5" />,
        path: '/dashboard/student-dashboard/lectures-page'
      },
    ];

    const parentItems = [
      {
        id: 'student-dashboard',
        title: t('myDashboard') || 'My Dashboard',
        icon: <FaUserGraduate className="w-5 h-5" />,
        path: '/dashboard/student-dashboard/promo-codes'
      },
    ]

    // Common menu items for all users (at the bottom)
    const commonItems = [
      {
        id: 'settings',
        title: t('settings') || 'Settings',
        icon: <FaCog className="w-5 h-5" />,
        path: '/dashboard/settings',
        divider: true
      },
      {
        id: 'logout',
        title: t('logout') || 'Logout',
        icon: <FaSignOutAlt className="w-5 h-5" />,
        path: '/',
        onClick: handleLogout
      },
    ];

    // Return appropriate menu items based on role
    switch (userRole.toLowerCase()) {
      case 'admin':
        return [...adminItems, ...commonItems];
      case 'subadmin':
        return [...adminItems, ...commonItems];
      case 'lecturer':
        return [...lecturerItems, ...commonItems];
      case 'assistant':
        return [...assistantItems, ...commonItems];
      case 'student':
        return [...studentItems, ...commonItems];
      case 'parent':
        return [...parentItems, ...commonItems];
      default:
        return commonItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && isMobile && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px]"
          style={{ top: `${NAVBAR_HEIGHT}px` }}
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        id="user-sidebar"
        className={`fixed z-40 flex w-[17.5rem] flex-col overflow-hidden rounded-[1.75rem] border border-white/50 text-base-content shadow-[0_24px_55px_rgba(14,33,38,0.20)] backdrop-blur-xl transform transition-all duration-300 ease-out ${isOpen ? 'translate-x-0 opacity-100 scale-100' : isRTL ? 'translate-x-[120%] opacity-0 scale-[0.98]' : '-translate-x-[120%] opacity-0 scale-[0.98]'
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
          <div className="absolute bottom-10 -right-8 h-28 w-28 rounded-full bg-info/25 blur-2xl" />
        </div>

        <div className="relative p-4 border-b border-base-300/70 flex items-center justify-between">
          <div className={`flex gap-3 items-center ${isRTL ? 'flex-row-reverse' : ''} mx-auto`}>
            <span className="font-extrabold tracking-tight text-primary">{t('dashboardTitle') || 'Dashboard'}</span>
            <div className="rounded-full p-2 bg-primary text-primary-content shadow-md shadow-primary/25">
              <FaUser className="w-2 h-2" />
            </div>
          </div>
        </div>

        {/* User info section */}
        {userData && (
          <div className="relative mx-3 mt-3 rounded-2xl border border-white/70 bg-white/65 px-3 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex justify-center">
                <div className="avatar">
                  <div className="w-11 h-11 rounded-full ring ring-primary/70 ring-offset-base-100 ring-offset-2">
                    <img
                      src={resolveProfileImageUrl(userData?.profilePic)}
                      alt={userData?.name || "User Avatar"}
                      className="object-cover"
                      style={{ objectFit: "cover" }}
                      onError={(event) => {
                        event.currentTarget.src = '/person.png';
                      }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="font-semibold text-sm leading-5">{userData.name}</p>
                <p className="text-xs text-base-content/70">{userData.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center h-32">
            <div className="loading loading-spinner loading-md text-primary"></div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="p-4 text-error text-sm">
            <p>{error}</p>
            <button
              className="btn btn-sm btn-outline btn-error mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {/* Menu items */}
        {!loading && !error && (
          <div className="relative mt-3 flex-1 overflow-y-auto px-2 pb-4">
            {menuItems.map((item) => (
              <React.Fragment key={item.id}>
                <Link
                  to={item.path}
                  className={`group mb-1 flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${location.pathname === item.path
                      ? 'bg-primary text-primary-content shadow-[0_10px_25px_rgba(14,85,99,0.22)]'
                      : 'text-base-content hover:bg-white/70 hover:text-primary'
                    }`}
                  onClick={(e) => {
                    if (item.onClick) {
                      e.preventDefault();
                      item.onClick();
                    }
                    if (isMobile) toggleSidebar();
                  }}
                >
                  <div className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${location.pathname === item.path ? 'bg-primary-content/15 text-primary-content' : 'bg-primary/10 text-primary group-hover:bg-primary/15'} ${isRTL ? 'ml-1' : 'mr-1'}`}>
                    {item.icon}
                  </div>
                  <span className="mx-auto font-semibold tracking-tight">{item.title}</span>

                  {/* Add a comment indicator for items with comments */}
                  {item.comment && (
                    <div className="tooltip tooltip-left" data-tip={item.comment}>
                      <div className="w-2 h-2 rounded-full bg-warning"></div>
                    </div>
                  )}
                </Link>
                {item.divider && <div className="my-2 border-t border-base-300/70"></div>}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Toggle Button */}
      <button
        id="sidebar-toggle"
        onClick={toggleSidebar}
        className={`fixed ${isRTL ? 'right-1' : 'left-1'} z-50 transform -translate-y-1/2 rounded-2xl border border-white/60 p-2 text-primary-content shadow-[0_12px_28px_rgba(14,85,99,0.35)] transition-all duration-300 hover:scale-105 ${
          isOpen && isRTL
                ? '-translate-x-[18.5rem]'
                : isOpen && !isRTL
                ? 'translate-x-[18.5rem]'
                : ''
            } 
          bg-[linear-gradient(140deg,#0E5563_0%,#146A78_100%)]`}
        style={{
          top: `calc(${NAVBAR_HEIGHT}px + 42%)`,
        }}
      >
        {isRTL ? (
          isOpen ? <FaChevronRight /> : <FaChevronLeft />
        ) : (
          isOpen ? <FaChevronLeft /> : <FaChevronRight />
        )}
      </button>
    </>
  );
};

export default UnifiedSidebar;