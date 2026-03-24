"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { useTranslation } from 'react-i18next';
import { getMyPurchasedCourseContainers, getUserDashboard } from "../../../routes/auth-services"
import { FiArrowLeft, FiArrowRight } from "react-icons/fi"

const ContainersPage = () => {
  const { t, i18n } = useTranslation('lecturesPage');
  const location = useLocation();
  const isRTL = i18n.language === "ar";
  const [containers, setContainers] = useState([])
  const [allContainers, setAllContainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userRole, setUserRole] = useState(null)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Fetch data once, then paginate client-side
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const isLecturerRoute = location.pathname.includes('/lecturer-dashboard/');

        if (isLecturerRoute) {
          const result = await getUserDashboard({
            params: {
              fields: 'userInfo,containers',
              limit: 200,
              page: 1,
            }
          });

          if (!result.success) {
            setError("Failed to load data");
            return;
          }

          const { userInfo, containers = [] } = result.data.data;
          setUserRole(userInfo.role);
          setAllContainers(containers.filter((container) => container.type === 'course'));
          return;
        }

        const result = await getMyPurchasedCourseContainers({
          params: {
            page: 1,
            limit: 200,
          },
        })

        if (!result.success) {
          setError("Failed to load data")
          return
        }

        const { userInfo, containers = [] } = result.data.data
        setUserRole(userInfo.role)
        setAllContainers(containers)
      } catch (err) {
        setError("Failed to load data. Please try again later.");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.pathname]);

  // Recompute visible page when pagination controls change.
  useEffect(() => {
    const paginatedContainers = applyPagination(allContainers, currentPage, itemsPerPage);
    setContainers(paginatedContainers);
    setTotalPages(Math.ceil(allContainers.length / itemsPerPage) || 1);
  }, [allContainers, currentPage, itemsPerPage]);

  // Apply pagination to an array
  const applyPagination = (items, page, limit) => {
    const startIndex = (page - 1) * limit;
    return items.slice(startIndex, startIndex + limit);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  const getVisiblePages = () => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + maxButtons - 1);
    const normalizedStart = Math.max(1, end - maxButtons + 1);

    return Array.from({ length: end - normalizedStart + 1 }, (_, index) => normalizedStart + index);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

   return (
    <div className="container mx-auto p-4 sm:p-6" dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="mb-4 text-2xl font-bold sm:mb-6 sm:text-3xl">
        {userRole === 'Lecturer' ? t('containersPage.headers.lecturerCourses') : t('containersPage.headers.studentCourses')}
      </h1>
      <p className="text-sm leading-6 opacity-80 sm:text-base">
        {userRole === 'Lecturer' ? t('containersPage.descriptions.lecturer') : t('containersPage.descriptions.student')}
      </p>

      {/* Items per page selector */}
      <div className={`mb-4 mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row ${isRTL ? "sm:justify-start" : "sm:justify-end"}`}>
        <select 
          className="select select-bordered select-sm w-full sm:w-auto" 
          value={itemsPerPage} 
          onChange={handleItemsPerPageChange}
        >
          <option value={5}>{t('containersPage.itemsPerPage', { count: 5 })}</option>
          <option value={10}>{t('containersPage.itemsPerPage', { count: 10 })}</option>
          <option value={20}>{t('containersPage.itemsPerPage', { count: 20 })}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {containers.map(container => (
          <div key={container._id} className="card bg-base-100 shadow-xl">
            <div className="card-body h-full">
              <h2 className="card-title">{container.name}</h2>
              
              <div className="flex flex-wrap gap-2 my-2">
                {container.subject?.name && (
                  <div className="badge badge-primary">{container.subject.name}</div>
                )}
                {container.level?.name && (
                  <div className="badge badge-secondary">{container.level.name}</div>
                )}
                <div className="badge badge-accent">{t('containersPage.labels.course')}</div>
              </div>
              
              {userRole === 'Lecturer' && (
                <p className="text-sm">
                  {t('containersPage.labels.price', { price: container.price })}
                </p>
              )}
              
              {userRole === 'Student' && container.lecturer && (
                <p className="text-sm">
                  {t('containersPage.labels.lecturer')}: {typeof container.lecturer === 'string' 
                    ? container.lecturer 
                    : container.lecturer.name || t('containersPage.unknown')}
                </p>
              )}
              
              {userRole === 'Student' && container.purchasedAt && (
                <p className="text-sm opacity-75">
                  {t('containersPage.labels.purchaseDate')}: {new Date(container.purchasedAt).toLocaleDateString(i18n.language)}
                </p>
              )}

              <div className={`card-actions mt-4 ${isRTL ? "justify-start" : "justify-end"}`}>
                  {userRole === 'Lecturer' ? (
                  <Link 
                    to={`/dashboard/lecturer-dashboard/container-details/${container._id}`} 
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-[1px] sm:w-auto ${isRTL ? "flex-row-reverse" : ""}`}
                    style={{
                      background: "var(--color-primary)",
                      color: "var(--color-primary-content)",
                      borderColor: "transparent",
                    }}
                    state={{ userRole: 'Lecturer' }}
                  >
                    {t('containersPage.buttons.viewDetails')}
                    {isRTL ? <FiArrowLeft className="h-4 w-4" /> : <FiArrowRight className="h-4 w-4" />}
                  </Link>
                ) : (
                  <Link 
                    to={`/dashboard/student-dashboard/container-details/${container._id}`} 
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-[1px] sm:w-auto ${isRTL ? "flex-row-reverse" : ""}`}
                    style={{
                      background: "var(--color-primary)",
                      color: "var(--color-primary-content)",
                      borderColor: "transparent",
                    }}
                    state={{ userRole: 'Student' }}
                  >
                    {t('containersPage.buttons.viewDetails')}
                    {isRTL ? <FiArrowLeft className="h-4 w-4" /> : <FiArrowRight className="h-4 w-4" />}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {containers.length === 0 && (
        <div className="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>
            {userRole === 'Lecturer' 
              ? t('containersPage.emptyStates.lecturer')
              : t('containersPage.emptyStates.student')}
          </span>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex w-full max-w-xl flex-wrap items-center justify-center gap-2">
            <button 
              className="btn btn-sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              {t('containersPage.pagination.previous')}
            </button>
            
            {getVisiblePages().map((pageNum) => (
              <button
                key={pageNum}
                className={`btn btn-sm min-w-10 ${currentPage === pageNum ? 'btn-active' : ''}`}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </button>
            ))}

            <span className="mx-1 text-xs opacity-70 sm:text-sm">
              {currentPage} / {totalPages}
            </span>
            
            <button 
              className="btn btn-sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {t('containersPage.pagination.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContainersPage;