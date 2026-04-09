import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import PropTypes from 'prop-types';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  size = 'md', 
  variant = 'default', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-full h-full',
  };

  const variantClasses = {
    default: '',
    success: 'border-t-4 border-success',
    error: 'border-t-4 border-error',
    info: 'border-t-4 border-info',
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className={`bg-white rounded-2xl shadow-xl overflow-hidden ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
                {title && (
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <Dialog.Title className="text-lg font-bold text-neutral">{title}</Dialog.Title>
                    <button onClick={onClose} className="rounded-full p-1 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                      <XIcon />
                    </button>
                  </div>
                )}
                
                <div className="p-4 overflow-y-auto">
                  {children}
                </div>

                {footer && (
                  <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
                    {footer}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Simple X icon to avoid adding more dependencies if not needed, 
// but since lucide-react is already used in the project, I'll use it if I can.
// Let's check if lucide-react is available.
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  variant: PropTypes.oneOf(['default', 'success', 'error', 'info']),
  className: PropTypes.string,
};

export default Modal;
