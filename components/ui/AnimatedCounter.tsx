'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AnimatedCounterProps {
  value: number;
  formatter?: (val: number) => string;
  className?: string;
}

export function AnimatedCounter({
  value,
  formatter = (val) => val.toLocaleString('en-IN'),
  className = '',
}: AnimatedCounterProps) {
  return (
    <div className={`relative inline-flex overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="inline-block"
        >
          {formatter(value)}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
