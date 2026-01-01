import React from 'react';

interface SuccessCheckmarkProps {
  size?: number;
  className?: string;
}

export const SuccessCheckmark: React.FC<SuccessCheckmarkProps> = ({ 
  size = 48, 
  className = '' 
}) => {
  return (
    <svg 
      className={`success-checkmark ${className}`}
      width={size} 
      height={size} 
      viewBox="0 0 52 52"
      aria-label="Success"
      role="img"
    >
      <circle 
        className="success-checkmark__circle" 
        cx="26" 
        cy="26" 
        r="24" 
      />
      <path 
        className="success-checkmark__check" 
        d="M14 27l8 8 16-16" 
      />
    </svg>
  );
};
