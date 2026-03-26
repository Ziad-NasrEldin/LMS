import React from "react";
import { designTokens } from "../constants/designTokens";

const TOKENS = designTokens.colors;
const SHADOWS = designTokens.shadows;

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
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            className="btn btn-sm sm:btn-md border-none rounded-[1.4rem] font-medium transition-all"
            style={{ 
              backgroundColor: currentPage === 1 ? TOKENS.neutralCloud : TOKENS.creamSurface,
              color: currentPage === 1 ? TOKENS.slateText : TOKENS.deepTeal,
              boxShadow: currentPage === 1 ? "none" : SHADOWS.level1,
              opacity: currentPage === 1 ? 0.6 : 1,
              cursor: currentPage === 1 ? "not-allowed" : "pointer"
            }}
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
                  <span key={index} className="px-2 text-gray-400 font-bold">...</span>
                );
              }
              return null;
            }

            const isActive = currentPage === pageNum;

            return (
              <button
                key={index}
                onClick={() => paginate(pageNum)}
                className="btn btn-sm sm:btn-md border-none rounded-full min-w-[2.5rem] font-bold transition-all"
                style={{
                  backgroundColor: isActive ? TOKENS.warmMango : TOKENS.creamSurface,
                  color: isActive ? "#fff" : TOKENS.deepTeal,
                  boxShadow: isActive ? "0 4px 14px rgba(243, 154, 63, 0.4)" : SHADOWS.level1,
                }}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            className="btn btn-sm sm:btn-md border-none rounded-[1.4rem] font-medium transition-all"
            style={{ 
              backgroundColor: currentPage === totalPages ? TOKENS.neutralCloud : TOKENS.creamSurface,
              color: currentPage === totalPages ? TOKENS.slateText : TOKENS.deepTeal,
              boxShadow: currentPage === totalPages ? "none" : SHADOWS.level1,
              opacity: currentPage === totalPages ? 0.6 : 1,
              cursor: currentPage === totalPages ? "not-allowed" : "pointer"
            }}
            onClick={nextPage}
            disabled={currentPage === totalPages}
          >
            {labels.next}
          </button>
        </div>
      </div>

      {/* Results summary */}
      <div className="text-center mt-4 text-sm font-medium" style={{ color: TOKENS.slateText }}>
        {labels.showing} {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)} {labels.of} {totalItems} مستخدم
      </div>
    </div>
  );
};

export default Pagination;