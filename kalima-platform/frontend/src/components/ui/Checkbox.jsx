import React from 'react';
import PropTypes from 'prop-types';

const Checkbox = ({ 
  label, 
  error, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input 
        type="checkbox" 
        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary" 
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

Checkbox.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
};

export default Checkbox;
