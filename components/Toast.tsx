import React, { useEffect } from 'react';
import XCircleIcon from './icons/XCircleIcon';
import ClipboardCheckIcon from './icons/ClipboardCheckIcon'; // Example icon

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'clipboard';
  onClose: () => void;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, actionButton, duration = 5000 }) => {
  useEffect(() => {
    if (duration === Infinity) return; // Persist indefinitely if duration is Infinity

    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  let bgColor = 'bg-slate-700 dark:bg-slate-600';
  let textColor = 'text-slate-100 dark:text-slate-50';
  let icon = null;

  switch (type) {
    case 'success':
      bgColor = 'bg-green-600 dark:bg-green-700';
      break;
    case 'error':
      bgColor = 'bg-red-600 dark:bg-red-700';
      break;
    case 'info':
      bgColor = 'bg-sky-600 dark:bg-sky-700';
      break;
    case 'clipboard':
      bgColor = 'bg-indigo-600 dark:bg-indigo-700';
      icon = <ClipboardCheckIcon className="w-5 h-5 mr-2" />;
      break;
  }

  return (
    <div 
      className={`fixed bottom-5 right-5 md:bottom-8 md:right-8 p-4 rounded-lg shadow-xl ${bgColor} ${textColor} flex items-center justify-between max-w-sm z-[100] transition-all duration-300 ease-in-out animate-toast-slide-in`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center">
        {icon}
        <span>{message}</span>
      </div>
      <div className="flex items-center ml-4">
        {actionButton && (
          <button
            onClick={() => {
              actionButton.onClick();
              onClose(); // Optionally close toast on action
            }}
            className="mr-2 px-3 py-1 text-sm font-medium bg-black/20 hover:bg-black/30 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            {actionButton.text}
          </button>
        )}
        <button onClick={onClose} className="p-1 rounded-full hover:bg-black/20" aria-label="Close notification">
          <XCircleIcon className="w-6 h-6" />
        </button>
      </div>
      <style>{`
        @keyframes toast-slide-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;