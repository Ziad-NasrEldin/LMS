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
  FaCalendar,
  FaStore
} from 'react-icons/fa';
import { MdAnalytics, MdDashboard, MdNumbers } from 'react-icons/md';
import { getUserDashboard, logoutUser } from '../routes/auth-services';
import { Edit, Lightbulb } from 'lucide-react';

const UnifiedSidebar = ({ isOpen, toggleSidebar }) => {
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
        id: 'center-dashboard',
        title: t('centerDashboard') || 'Center Dashboard',
        icon: <FaCalendar className="w-5 h-5" />,
        path: '/dashboard/center-dashboard'
      },
      {
        id: 'audit-log',
        title: t('auditLog') || 'Audit Log',
        icon: <MdDashboard className="w-5 h-5" />,
        path: '/dashboard/admin-dashboard/audit-log'
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
        id: 'store-dashboard',
        title: t('storeDashboard') || 'Store Dashboard',
        icon: <FaStore className="w-5 h-5" />,
        path: '/dashboard/admin-dashboard/store-dashboard'
      },
      {
        id: 'signed-lecturers',
        title: t('signedLecturers') || 'Signed Lecturers',
        icon: <Lightbulb className="w-5 h-5" />,
        path: '/dashboard/admin-dashboard/signed-lecturers'
      },
      {
        id: 'store-analytics',
        title: t('Analytics') || 'Analytics',
        icon: <MdAnalytics className="w-5 h-5" />,
        path: '/dashboard/admin-dashboard/store-analytics'
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
        id: 'lectures',
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
          className="md:hidden fixed text-white bg-opacity-50 z-51"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        id="user-sidebar"
        className={`fixed top-14 bottom-0 ${isRTL ? 'right-0 border-l' : 'left-0 border-r'
          } w-52 bg-base-100 border-base-300 shadow-md z-30 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'
          }`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="p-4 border-b border-base-300 flex items-center justify-between">
          <div className={`flex gap-3 items-center ${isRTL ? 'flex-row-reverse' : ''} mx-auto`}>
            <span className="font-bold text-primary">{t('dashboardTitle') || 'Dashboard'}</span>
            <div className="bg-primary text-primary-content rounded-full p-2">
              <FaUser className="w-2 h-2" />
            </div>
          </div>
        </div>

        {/* User info section */}
        {userData && (
          <div className="p-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="mb-4 flex justify-center">
                <div className="avatar">
                  <div className="w-10 h-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <img
                      src={
                        userData?.profilePic
                          ? `${import.meta.env.VITE_API_URL}/${userData.profilePic.replace(/\\/g, "/")}`
                          : "/default-avatar.png"
                      }
                      alt={userData?.name || "User Avatar"}
                      className="object-cover"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="font-medium text-sm">{userData.name}</p>
                <p className="text-xs text-base-content text-opacity-70">{userData.role}</p>
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
          <div className="flex flex-col h-full overflow-y-auto">
            {menuItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <Link
                  to={item.path}
                  className={`flex items-center justify-between py-3 px-4 hover:bg-base-200 transition-colors ${location.pathname === item.path
                      ? `text-primary ${isRTL ? 'border-r-4' : 'border-l-4'} border-primary bg-primary/20 bg-opacity-10`
                      : 'text-base-content'
                    }`}
                  onClick={(e) => {
                    if (item.onClick) {
                      e.preventDefault();
                      item.onClick();
                    }
                    if (isMobile) toggleSidebar();
                  }}
                >
                  <div className={`${isRTL ? 'ml-3' : 'mr-3'} text-primary`}>
                    {item.icon}
                  </div>
                  <span className="text-sm mx-auto">{item.title}</span>

                  {/* Add a comment indicator for items with comments */}
                  {item.comment && (
                    <div className="tooltip tooltip-left" data-tip={item.comment}>
                      <div className="w-2 h-2 rounded-full bg-warning"></div>
                    </div>
                  )}
                </Link>
                {item.divider && <div className="divider my-1"></div>}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Toggle Button */}
      <button
        id="sidebar-toggle"
        className={`hidden md:flex fixed top-20 ${isRTL ? 'right-0' : 'left-0'
          } z-40 bg-primary text-primary-content p-2 ${isRTL ? 'rounded-r-md' : 'rounded-l-md'
          } shadow-md transition-transform duration-300 ease-in-out`}
        style={{
          transform: isOpen
            ? `translateX(${isRTL ? '-13rem' : '13rem'})`  // Adjusted to match sidebar width
            : 'translateX(0)',
        }}
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
      >
        {isOpen ? (
          <FaChevronRight className={`w-4 h-4 ${!isRTL && 'rotate-180'}`} />
        ) : (
          <FaChevronLeft className={`w-4 h-4 ${!isRTL && 'rotate-180'}`} />
        )}
      </button>
    </>
  );
};

export default UnifiedSidebar;