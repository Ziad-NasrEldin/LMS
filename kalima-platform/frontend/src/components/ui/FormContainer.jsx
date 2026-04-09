import React from 'react';
import PropTypes from 'prop-types';

const FormContainer = ({ 
  children, 
  onSubmit, 
  className = '', 
  isLoading = false,
  ...props 
}) => {
  return (
    <form 
      onSubmit={onSubmit} 
      className={`space-y-6 ${className}`} 
      {...props}
    >
      {children}
    </form>
  );
};

FormContainer.propTypes = {
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func.isRequired,
  className: PropTypes.string,
  isLoading: PropTypes.bool,
};

export default FormContainer;
