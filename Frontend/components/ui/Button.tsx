'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  type = 'button',
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-valio-600 text-white hover:bg-valio-700 active:bg-valio-800 shadow-sm hover:shadow-md';
      case 'secondary':
        return 'bg-glacier-100 text-glacier-900 hover:bg-glacier-200 active:bg-glacier-300';
      case 'ghost':
        return 'hover:bg-glacier-100 active:bg-glacier-200 text-glacier-700';
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm hover:shadow-md';
      default:
        return '';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-body-sm';
      case 'md':
        return 'px-4 py-2 text-body-sm';
      case 'lg':
        return 'px-6 py-3 text-body';
      default:
        return '';
    }
  };

  const baseClasses = `inline-flex items-center justify-center gap-2 rounded-soft font-medium transition-all duration-200 ${getVariantStyles()} ${getSizeStyles()} ${
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  } ${className}`;

  return (
    <motion.button
      type={type}
      className={baseClasses}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {children}
    </motion.button>
  );
}
