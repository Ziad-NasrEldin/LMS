import { useState } from "react";
import { useTranslation } from "react-i18next";

const CenterSelector = ({ centers, selectedCenter, onCenterChange }) => {
  const { t, i18n } = useTranslation("centerDashboard");
  const isRTL = i18n.language === "ar";
  
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleDropdown = () => setIsOpen(!isOpen);
  
  const handleCenterSelect = (center) => {
    onCenterChange(center);
    setIsOpen(false);
  };
  
  return (
    <div className="bg-base-100 rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-bold mb-4">
        {t('centerSelector.selectCenter')}
      </h2>
      
      <div className="relative">
        <button 
          className="btn btn-primary w-full justify-between"
          onClick={toggleDropdown}
        >
          <span>
            {selectedCenter ? selectedCenter.name : t('centerSelector.selectPlaceholder')}
          </span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-base-100 shadow-lg rounded-md border border-base-300">
            <ul className="py-1 max-h-60 overflow-auto">
              {centers.map((center) => (
                <li 
                  key={center._id}
                  className="px-4 py-2 hover:bg-base-200 cursor-pointer"
                  onClick={() => handleCenterSelect(center)}
                >
                  <div className="font-medium">{center.name}</div>
                  <div className="text-sm text-base-content/70">{center.location}</div>
                </li>
              ))}
              
              {centers.length === 0 && (
                <li className="px-4 py-2 text-base-content/70">
                  {t('centerSelector.noCenters')}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CenterSelector;