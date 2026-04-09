import React from 'react';
import PropTypes from 'prop-types';

const Input = ({ 
  label, 
  error, 
  helperText, 
  variant = 'default', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  };

  const variantClasses = {
    default: 'border-gray-300 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent',
    error: 'border-error text-slate-900 focus:ring-2 focus:ring-error',
    success: 'border-success text-slate-900 focus:ring-2 focus:ring-success',
  };

  const inputClasses = [
    'rounded-lg outline-none transition-all duration-200 w-full border h-full',
    variantClasses[variant] || variantClasses.default,
    sizeClasses[size] || sizeClasses.md,
    error ? 'border-error' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      <input 
        className={inputClasses} 
        {...props} 
      />
      {error && <span className="text-error text-xs">{error}</span>}
      {helperText && !error && <span className="text-slate-600 text-xs">{helperText}</span>}
    </div>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'error', 'success']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

export default Input;
