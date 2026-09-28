import React from 'react';
import { Info } from 'lucide-react';

export interface DisclaimerProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export const Disclaimer: React.FC<DisclaimerProps> = ({
  className = '',
  variant = 'light',
}) => {
  const textColor = variant === 'dark' ? 'text-gray-300' : 'text-gray-500';
  const iconColor = variant === 'dark' ? 'text-edde-yellow' : 'text-edde-purple/60';

  return (
    <div
      className={`flex items-start space-x-2 text-xs leading-relaxed ${textColor} ${className}`}
    >
      <Info className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} strokeWidth={1.75} />
      <p>
        Your result is an educational guidance match based on the information you provided. It does not guarantee admission, scholarship eligibility or visa approval.
      </p>
    </div>
  );
};
