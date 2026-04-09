import React from 'react';
import PropTypes from 'prop-types';

const Badge = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  outline = false, 
  ...props 
}) => {
  const variantClasses = {
    primary: outline ? 'border-[#0E5563] text-[#0E5563] bg-transparent' : 'border-[#0E5563] bg-[#0E5563] text-[#F8FCFF]',
    secondary: outline ? 'border-[#4DB3C2] text-[#0B4852] bg-transparent' : 'border-[#4DB3C2] bg-[#4DB3C2] text-[#08343C]',
    accent: outline ? 'border-[#F39A3F] text-[#A85807] bg-transparent' : 'border-[#F39A3F] bg-[#F39A3F] text-[#FFF9F3]',
    success: outline ? 'border-[#0F9D7A] text-[#0F9D7A] bg-transparent' : 'border-[#0F9D7A] bg-[#D9FBEF] text-[#065F46]',
    error: outline ? 'border-[#D64055] text-[#D64055] bg-transparent' : 'border-[#D64055] bg-[#FEECEE] text-[#991B1B]',
    neutral: outline ? 'border-[#334155] text-[#334155] bg-transparent' : 'border-[#334155] bg-[#334155] text-[#F8FAFC]',
  };

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const combinedClasses = [
    'inline-flex items-center justify-center rounded-full font-medium transition-colors duration-200 border',
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={combinedClasses} {...props}>
      {children}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'accent', 'success', 'error', 'neutral']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  outline: PropTypes.bool,
};

export default Badge;
