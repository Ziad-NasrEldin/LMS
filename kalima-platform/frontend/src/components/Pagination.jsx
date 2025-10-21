import React from "react";

const Pagination = ({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange,
  labels = { 
    previous: "السابق", 
    next: "التالي",
    showing: "عرض",
    of: "من"
  },
  className = ""
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Calculate indices for display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  // Change page
  const paginate = (pageNumber) => onPageChange(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  if (totalItems === 0) return null;

  return (
    <div className={`${className}`}>
      <div className="flex justify-center mt-8">
        <div className="join">
          <button 
            className="join-item btn btn-secondary" 
            onClick={prevPage}
            disabled={currentPage === 1}
          >
            {labels.previous}
          </button>
          
          {/* Page numbers */}
          {Array.from({ length: totalPages }).map((_, index) => {
            // Show limited page numbers with ellipsis for better UX
            const pageNum = index + 1;
            const showPageButton = 
              pageNum === 1 || 
              pageNum === totalPages || 
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
            
            if (!showPageButton) {
              // Show ellipsis only once between gaps
              if (pageNum === 2 || pageNum === totalPages - 1) {
                return (
                  <button key={index} className="join-item btn btn-disabled">...</button>
                );
              }
              return null;
            }
            
            return (
              <button 
                key={index} 
                onClick={() => paginate(pageNum)}
                className={`join-item btn ${currentPage === pageNum ? 'btn-accent' : 'btn-secondary'}`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button 
            className="join-item btn btn-secondary" 
            onClick={nextPage}
            disabled={currentPage === totalPages}
          >
            {labels.next}
          </button>
        </div>
      </div>

      {/* Results summary */}
      <div className="text-center mt-4 text-sm">
        {labels.showing} {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)} {labels.of} {totalItems} مستخدم
      </div>
    </div>
  );
};

export default Pagination;