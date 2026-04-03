"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { useTranslation } from 'react-i18next';
import { getMyPurchasedCourseContainers, getUserDashboard } from "../../../routes/auth-services"
import { FiArrowLeft, FiArrowRight, FiChevronDown } from "react-icons/fi"
import { designTokens } from "../../../constants/designTokens"
import { translateErrorMessage } from "../../../utils/errorTranslator"
import DSSelect from "../../../components/DSSelect"

const ContainersPage = () => {
  const { t, i18n } = useTranslation('lecturesPage');
  const location = useLocation();
  const isRTL = i18n.language === "ar";
  const TOKENS = designTokens.colors
  const SHADOWS = designTokens.shadows
  const GRADIENTS = designTokens.gradients
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
            setError(translateErrorMessage("Failed to load data"));
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
          setError(translateErrorMessage("Failed to load data"))
          return
        }

        const { userInfo, containers = [] } = result.data.data
        setUserRole(userInfo.role)
        setAllContainers(containers)
      } catch (err) {
        setError(translateErrorMessage("Failed to load data. Please try again later."));
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
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: `${GRADIENTS.pageAtmosphere}, ${TOKENS.creamSurface}` }}
      >
        <div
          className="rounded-2xl border px-6 py-5"
          style={{
            background: TOKENS.neutralCloud,
            borderColor: "rgba(17,24,39,0.08)",
            boxShadow: SHADOWS.level1,
            color: TOKENS.slateText,
          }}
        >
          <div className="loading loading-spinner loading-lg" style={{ color: TOKENS.deepTeal }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-4"
        style={{ background: `${GRADIENTS.pageAtmosphere}, ${TOKENS.creamSurface}` }}
      >
        <div
          className="w-full max-w-2xl rounded-2xl border p-4"
          style={{
            background: "#FFF1F2",
            borderColor: "#FCA5A5",
            boxShadow: SHADOWS.level1,
            color: TOKENS.inkText,
          }}
        >
          <div className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 shrink-0"
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
      </div>
    );
  }

   return (
    <div
      className="min-h-screen"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ background: `${GRADIENTS.pageAtmosphere}, ${TOKENS.creamSurface}` }}
    >
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-8 sm:px-6">
        <div
          className="rounded-[2rem] border p-4 sm:p-6 lg:p-8"
          style={{
            background: TOKENS.neutralCloud,
            borderColor: "rgba(17,24,39,0.08)",
            boxShadow: SHADOWS.level1,
          }}
        >
          <h1 className="mb-2 text-2xl font-bold sm:text-3xl" style={{ color: TOKENS.inkText }}>
            {userRole === 'Lecturer' ? t('containersPage.headers.lecturerCourses') : t('containersPage.headers.studentCourses')}
          </h1>
          <p className="mb-5 text-sm leading-6 sm:mb-6 sm:text-base" style={{ color: TOKENS.slateText }}>
            {userRole === 'Lecturer' ? t('containersPage.descriptions.lecturer') : t('containersPage.descriptions.student')}
          </p>

          {/* Items per page selector */}
          <div className={`mb-4 mt-4 flex flex-col gap-2 sm:mt-0 sm:flex-row ${isRTL ? "sm:justify-start" : "sm:justify-end"}`}>
            <div className="relative w-full sm:w-auto">
              <DSSelect
                className={`h-11 w-full appearance-none rounded-full border px-4 text-base font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-cyan-200/70 sm:min-w-[168px] ${isRTL ? "pl-10 pr-4 text-right" : "pr-10 text-left"}`}
                style={{
                  borderColor: "rgba(17,24,39,0.14)",
                  background: TOKENS.creamSurface,
                  color: TOKENS.inkText,
                  boxShadow: SHADOWS.level1,
                }}
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
              >
                <option value={5}>{t('containersPage.itemsPerPage', { count: 5 })}</option>
                <option value={10}>{t('containersPage.itemsPerPage', { count: 10 })}</option>
                <option value={20}>{t('containersPage.itemsPerPage', { count: 20 })}</option>
              </DSSelect>
              <FiChevronDown
                className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm ${isRTL ? "left-4" : "right-4"}`}
                style={{ color: TOKENS.deepTeal }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {containers.map(container => (
              <div
                key={container._id}
                className="card border transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: "#FFFFFF",
                  borderColor: "rgba(17,24,39,0.08)",
                  boxShadow: SHADOWS.level1,
                }}
              >
                <div className="card-body h-full">
                  <h2 className="card-title line-clamp-2" style={{ color: TOKENS.inkText }}>{container.name}</h2>

                  <div className="my-2 flex flex-wrap gap-2">
                    {container.subject?.name && (
                      <div
                        className="badge border"
                        style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal, borderColor: "rgba(15,118,110,0.22)" }}
                      >
                        {container.subject.name}
                      </div>
                    )}
                    {container.level?.name && (
                      <div
                        className="badge border"
                        style={{ background: "#ECFEFF", color: TOKENS.slateText, borderColor: "rgba(17,24,39,0.16)" }}
                      >
                        {container.level.name}
                      </div>
                    )}
                    <div
                      className="badge border"
                      style={{ background: "#F0FDFA", color: TOKENS.deepTeal, borderColor: "rgba(15,118,110,0.18)" }}
                    >
                      {t('containersPage.labels.course')}
                    </div>
                  </div>

                  {userRole === 'Lecturer' && (
                    <p className="text-sm" style={{ color: TOKENS.slateText }}>
                      {t('containersPage.labels.price', { price: container.price })}
                    </p>
                  )}

                  {userRole === 'Student' && container.lecturer && (
                    <p className="text-sm" style={{ color: TOKENS.slateText }}>
                      {t('containersPage.labels.lecturer')}: {typeof container.lecturer === 'string'
                        ? container.lecturer
                        : container.lecturer.name || t('containersPage.unknown')}
                    </p>
                  )}

                  {userRole === 'Student' && container.purchasedAt && (
                    <p className="text-sm" style={{ color: TOKENS.slateText }}>
                      {t('containersPage.labels.purchaseDate')}: {new Date(container.purchasedAt).toLocaleDateString(i18n.language)}
                    </p>
                  )}

                  <div className={`card-actions mt-4 ${isRTL ? "justify-start" : "justify-end"}`}>
                    {userRole === 'Lecturer' ? (
                      <Link
                        to={`/dashboard/lecturer-dashboard/container-details/${container._id}`}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-[1px] sm:w-auto ${isRTL ? "flex-row-reverse" : ""}`}
                        style={{
                          background: TOKENS.deepTeal,
                          color: "#F8FCFF",
                          borderColor: TOKENS.deepTeal,
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
                          background: TOKENS.deepTeal,
                          color: "#F8FCFF",
                          borderColor: TOKENS.deepTeal,
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
            <div
              className="mt-4 rounded-2xl border px-4 py-3"
              style={{
                background: "#ECFEFF",
                borderColor: "rgba(8,145,178,0.25)",
                color: TOKENS.slateText,
              }}
            >
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
                  className="btn btn-sm rounded-xl"
                  style={{
                    background: "#FFFFFF",
                    borderColor: "rgba(17,24,39,0.16)",
                    color: TOKENS.inkText,
                  }}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  {t('containersPage.pagination.previous')}
                </button>

                {getVisiblePages().map((pageNum) => (
                  <button
                    key={pageNum}
                    className="btn btn-sm min-w-10 rounded-xl"
                    style={
                      currentPage === pageNum
                        ? {
                          background: TOKENS.deepTeal,
                          borderColor: TOKENS.deepTeal,
                          color: "#F8FCFF",
                        }
                        : {
                          background: "#FFFFFF",
                          borderColor: "rgba(17,24,39,0.16)",
                          color: TOKENS.inkText,
                        }
                    }
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}

                <span className="mx-1 text-xs sm:text-sm" style={{ color: TOKENS.slateText }}>
                  {currentPage} / {totalPages}
                </span>

                <button
                  className="btn btn-sm rounded-xl"
                  style={{
                    background: "#FFFFFF",
                    borderColor: "rgba(17,24,39,0.16)",
                    color: TOKENS.inkText,
                  }}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  {t('containersPage.pagination.next')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContainersPage;
