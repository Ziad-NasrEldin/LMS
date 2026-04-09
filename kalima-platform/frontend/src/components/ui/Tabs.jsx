import React from 'react';
import { Tab } from '@headlessui/react';
import PropTypes from 'prop-types';

const Tabs = ({ 
  tabs, 
  activeIndex, 
  onChange, 
  className = '', 
  variant = 'boxed' 
}) => {
  const variantClasses = {
    boxed: 'rounded-xl p-1.5 shadow-inner bg-slate-100',
    underline: 'border-b border-gray-200',
  };

  return (
    <Tab.Group selectedIndex={activeIndex} onChange={onChange}>
      <div className={`${variantClasses[variant]} ${className}`}>
        <Tab.List className={`flex ${variant === 'underline' ? 'gap-8' : 'flex-wrap gap-1'}`}>
          {tabs.map((tab, index) => (
            <Tab
              key={tab.id || index}
              className={`
                flex-1 rounded-lg px-4 py-3 text-sm font-bold transition-all whitespace-nowrap
                ${activeIndex === index 
                  ? 'bg-white shadow-sm text-primary' 
                  : 'hover:bg-white/50 text-neutral/70'}
                ${variant === 'underline' ? 'rounded-none bg-transparent border-b-2' : ''}
                ${activeIndex === index && variant === 'underline' ? 'border-primary' : 'border-transparent'}
              `}
            >
              {tab.label}
            </Tab>
          ))}
        </Tab.List>
      </div>
    </Tab.Group>
  );
};

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string.isRequired,
  })).isRequired,
  activeIndex: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['boxed', 'underline']),
};

export default Tabs;
