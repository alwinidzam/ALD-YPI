import React from 'react';
import { motion } from 'motion/react';

interface PageTransitionProps {
  children: React.ReactNode;
  pageKey: string;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, pageKey, className = '' }) => {
  return (
    <motion.div
      key={pageKey}
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.99 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full h-full ${className}`}
    >
      {children}
    </motion.div>
  );
};
