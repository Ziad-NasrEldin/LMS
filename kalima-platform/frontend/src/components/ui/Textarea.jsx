import React from 'react';
import PropTypes from 'prop-types';

const Textarea = ({ 
  label, 
  error, 
  helperText, 
  variant = 'default', 
  size = 'md', 
  className = '', 
  rows = 3,
  ...props 
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  };

  const variantClasses = {
    default: 'border-gray-300 bg-white text-neutral focus:ring-2 focus:ring-primary focus:border-transparent',
    error: 'border-error text-neutral focus:ring-2 focus:ring-error',
    success: 'border-success text-neutral focus:ring-2 focus:ring-success',
  };

  const textareaClasses = [
    'rounded-lg outline-none transition-all duration-200 w-full border resize-none',
    variantClasses[variant] || variantClasses.default,
    sizeClasses[size] || sizeClasses.md,
    error ? variantClasses.error : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="block text-sm font-medium text-neutral">{label}</label>}
      <textarea 
        className={textareaClasses} 
        rows={rows}
        {...props} 
      />
      {error && <span className="text-error text-xs">{error}</span>}
      {helperText && !error && <span className="text-neutral/60 text-xs">{helperText}</span>}
    </div>
  );
};

Textarea.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'error', 'success']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  rows: PropTypes.number,
};

export default Textarea;
