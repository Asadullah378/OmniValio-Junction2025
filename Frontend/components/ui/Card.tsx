'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const baseClasses = `bg-white rounded-soft-lg p-6 shadow-soft border border-glacier-200 ${className}`;

  if (hover || onClick) {
    return (
      <motion.div
        className={`${baseClasses} cursor-pointer`}
        whileHover={{
          scale: 1.01,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          borderColor: 'rgba(2, 132, 199, 0.3)',
        }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={baseClasses}>{children}</div>;
}
