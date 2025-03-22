import React from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'outlined' | 'floating';
  animate?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  animate = false,
}) => {
  const variantStyles = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    glass: 'bg-white/10 dark:bg-gray-800/20 backdrop-blur-lg border border-white/20 dark:border-gray-700/30',
    outlined: 'bg-transparent border-2 border-gray-200 dark:border-gray-700',
    floating: 'bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-900/30',
  };

  const baseStyles = 'rounded-2xl p-6';
  const cardStyles = twMerge(baseStyles, variantStyles[variant], className);

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut'
      }
    },
    hover: { 
      y: -5,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      transition: {
        duration: 0.2,
      }
    }
  };

  if (animate) {
    return (
      <motion.div
        className={cardStyles}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        variants={cardVariants}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={cardStyles}>{children}</div>;
};

export default Card; 