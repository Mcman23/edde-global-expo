'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'vivid' | 'yellow' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'lg',
      isLoading = false,
      children,
      icon,
      iconPosition = 'right',
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles: large touch target min-h-12 (48px), flex, font, transition
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none';

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm min-h-[40px]',
      md: 'px-6 py-3 text-base min-h-[48px]',
      lg: 'px-8 py-4 text-lg min-h-[56px] font-semibold tracking-wide',
    };

    const variantStyles = {
      primary:
        'bg-edde-purple text-white hover:bg-[#431b57] focus:ring-edde-purple shadow-md hover:shadow-lg active:bg-[#381648]',
      vivid:
        'bg-edde-vivid text-white hover:bg-[#580ac4] focus:ring-edde-vivid shadow-glow active:bg-[#4d09ad]',
      yellow:
        'bg-edde-yellow text-edde-dark hover:bg-[#ecd000] focus:ring-edde-yellow shadow-md hover:shadow-glow-yellow active:bg-[#d2b800] font-bold',
      secondary:
        'bg-white text-edde-purple border border-edde-purple/20 hover:bg-edde-purple/5 focus:ring-edde-purple shadow-sm',
      outline:
        'bg-transparent text-white border-2 border-white/80 hover:bg-white/10 focus:ring-white',
      ghost:
        'bg-transparent text-edde-purple hover:bg-edde-purple/10 focus:ring-edde-purple',
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
            <span>Loading...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2.5">
            {icon && iconPosition === 'left' && <span className="inline-flex shrink-0">{icon}</span>}
            {children && <span>{children}</span>}
            {icon && iconPosition === 'right' && <span className="inline-flex shrink-0">{icon}</span>}
          </div>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
