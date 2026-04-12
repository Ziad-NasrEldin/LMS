import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading = false, 
  isDisabled = false, 
  as: Component = 'button',
  to,
  style,
  ...props 
}) => {
  const variantClasses = {
    primary: 'bg-[#0E5563] text-[#F8FCFF] hover:bg-[#0A424C] shadow-sm hover:shadow-md',
    secondary: 'bg-[#4DB3C2] text-[#08343C] hover:bg-[#3DA3B3] shadow-sm hover:shadow-md',
    accent: 'bg-[#F39A3F] text-[#FFF9F3] hover:bg-[#E1872C] shadow-sm hover:shadow-md',
    ghost: 'bg-transparent text-[#0E5563] hover:bg-slate-200',
    outline: 'border-2 border-[#0E5563] text-[#0E5563] bg-white hover:bg-[#0E5563] hover:text-[#F8FCFF]',
    error: 'bg-[#D64055] text-[#FFF7F8] hover:bg-[#BD3146] shadow-sm hover:shadow-md',
    success: 'bg-[#0F9D7A] text-[#F3FFFB] hover:bg-[#0C8769] shadow-sm hover:shadow-md',
    neutral: 'bg-[#334155] text-[#F8FAFC] hover:bg-[#1F2937] shadow-sm hover:shadow-md',
  };

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const combinedClasses = [
    'rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center whitespace-nowrap',
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    className,
  ].filter(Boolean).join(' ');

  const buttonContent = (
    <>
      {isLoading && Component === 'button' ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {!isLoading && children}
    </>
  );

  if (to) {
    return (
      <Link 
        to={to}
        className={combinedClasses}
        style={style}
        {...props}
      >
        {buttonContent}
      </Link>
    );
  }

  return (
    <Component 
      className={combinedClasses} 
      disabled={Component === 'button' ? (isDisabled || isLoading) : undefined} 
      style={style}
      {...props}
    >
      {buttonContent}
    </Component>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'accent', 'ghost', 'outline', 'error', 'success', 'neutral']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  className: PropTypes.string,
  isLoading: PropTypes.bool,
  isDisabled: PropTypes.bool,
  to: PropTypes.string,
  style: PropTypes.object,
};

export default Button;
