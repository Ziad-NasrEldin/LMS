"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from 'react-i18next';
import { getUserDashboard } from "../../../routes/auth-services"

const ContainersPage = () => {
  const { t, i18n } = useTranslation('lecturesPage');
  const isRTL = i18n.language === "ar";
  const [containers, setContainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userRole, setUserRole] = useState(null)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Fetch data with pagination
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        const result = await getUserDashboard({
          params: {
            fields: 'userInfo,containers,purchaseHistory',
            limit: 200,
            page: 1
          }
        });

        if (result.success) {
          const { userInfo } = result.data.data;
          setUserRole(userInfo.role);

          let courseContainers = [];

          if (userInfo.role === 'Lecturer') {
            // For lecturers: containers are directly in response.data.containers
            const { containers = [] } = result.data.data;
            courseContainers = containers.filter(container => container.type === 'course');
          } else if (userInfo.role === 'Student') {
            // For students: containers are in response.data.purchaseHistory.container
            const { purchaseHistory = [] } = result.data.data;
            const containerPurchases = purchaseHistory
              .filter(p => 
                p.type === 'containerPurchase' && 
                p.container && 
                p.container.type === 'course'
              );
            // Remove duplicates by container._id
            const uniqueCourseContainers = Array.from(
              new Map(containerPurchases.map(p => [p.container._id, p])).values()
            ).map(p => ({
              ...p.container,
              lecturer: p.lecturer,
              purchasedAt: p.purchasedAt,
              purchaseId: p._id,
              price: p.points || 0
            }));
            courseContainers = uniqueCourseContainers;
          }

          const paginatedContainers = applyPagination(courseContainers, currentPage, itemsPerPage);
          setContainers(paginatedContainers);
          setTotalPages(Math.ceil(courseContainers.length / itemsPerPage) || 1);
        } else {
          setError("Failed to load data");
        }
      } catch (err) {
        setError("Failed to load data. Please try again later.");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, itemsPerPage]);

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
    <div className="container mx-auto p-4" dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="text-3xl font-bold mb-6">
        {userRole === 'Lecturer' ? t('containersPage.headers.lecturerCourses') : t('containersPage.headers.studentCourses')}
      </h1>
      <p className="text-sm opacity-80">
        {userRole === 'Lecturer' ? t('containersPage.descriptions.lecturer') : t('containersPage.descriptions.student')}
      </p>

      {/* Items per page selector */}
      <div className="flex justify-end mb-4">
        <select 
          className="select select-bordered select-sm" 
          value={itemsPerPage} 
          onChange={handleItemsPerPageChange}
        >
          <option value={5}>{t('containersPage.itemsPerPage', { count: 5 })}</option>
          <option value={10}>{t('containersPage.itemsPerPage', { count: 10 })}</option>
          <option value={20}>{t('containersPage.itemsPerPage', { count: 20 })}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {containers.map(container => (
          <div key={container._id} className="card bg-base-100 shadow-xl">
            <div className="card-body">
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

              <div className="card-actions justify-end mt-4">
                  {userRole === 'Lecturer' ? (
                  <Link 
                    to={`/dashboard/lecturer-dashboard/container-details/${container._id}`} 
                    className="btn btn-primary"
                    state={{ userRole: 'Lecturer' }}
                  >
                    {t('containersPage.buttons.viewDetails')}
                  </Link>
                ) : (
                  <Link 
                    to={`/dashboard/student-dashboard/container-details/${container._id}`} 
                    className="btn btn-primary"
                    state={{ userRole: 'Student' }}
                  >
                    {t('containersPage.buttons.viewDetails')}
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
        <div className="flex justify-center mt-8">
          <div className="join">
            <button 
              className="join-item btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              {t('containersPage.pagination.previous')}
            </button>
            
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                className={`join-item btn ${currentPage === index + 1 ? 'btn-active' : ''}`}
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            
            <button 
              className="join-item btn"
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