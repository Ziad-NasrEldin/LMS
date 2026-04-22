import React from 'react';
import PropTypes from 'prop-types';

const Card = ({ 
  children, 
  title, 
  actions, 
  className = '', 
  style,
  ...props 
}) => {
  const defaultBorder = "1px solid transparent";
  
  return (
    <div 
      className={`bg-white rounded-2xl shadow-sm overflow-hidden ${className}`} 
      style={style}
      {...props}
    >
      <div className="p-6">
        {title && <h2 className="text-lg font-bold text-[#111827]">{title}</h2>}
        {children}
        {actions && (
          <div className="mt-6 flex justify-end gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  actions: PropTypes.node,
  className: PropTypes.string,
};

export default Card;
