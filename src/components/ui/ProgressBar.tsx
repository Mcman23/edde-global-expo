'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
  showText?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  className = '',
  showText = true,
}) => {
  const percentage = Math.min(Math.max(Math.round((currentStep / totalSteps) * 100), 0), 100);

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {showText && (
        <div className="flex justify-between items-center text-xs font-semibold tracking-wider text-edde-purple uppercase">
          <span>Question {currentStep} of {totalSteps}</span>
          <span className="text-edde-vivid">{percentage}%</span>
        </div>
      )}
      <div className="w-full h-2.5 bg-edde-purple/10 rounded-full overflow-hidden p-0.5 border border-edde-purple/10">
        <motion.div
          className="h-full brand-gradient rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};
