import React from 'react';
import PropTypes from 'prop-types';

const Radio = ({ 
  label, 
  error, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input 
        type="radio" 
        className="w-4 h-4 border-gray-300 text-primary focus:ring-primary accent-primary" 
        {...props} 
      />
      {label && (
        <label className="text-sm text-neutral cursor-pointer select-none">
          {label}
        </label>
      )}
      {error && <span className="text-error text-xs">{error}</span>}
    </div>
  );
};

Radio.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
};

export default Radio;
