import { Variants, Transition } from 'motion/react';

// Transition presets
export const transitions = {
  fast: { duration: 0.15, ease: [0.4, 0, 0.2, 1] } as Transition,
  normal: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } as Transition,
  slow: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } as Transition,
  spring: { type: 'spring', stiffness: 350, damping: 25 } as Transition,
  springBouncy: { type: 'spring', stiffness: 400, damping: 15 } as Transition,
  springSmooth: { type: 'spring', stiffness: 200, damping: 20 } as Transition,
};

// Motion Variants
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.normal },
  exit: { opacity: 0, transition: transitions.fast },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: transitions.spring },
  exit: { opacity: 0, y: 12, transition: transitions.fast },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: transitions.spring },
  exit: { opacity: 0, y: -12, transition: transitions.fast },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: transitions.spring },
  exit: { opacity: 0, x: 24, transition: transitions.fast },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: transitions.spring },
  exit: { opacity: 0, x: -24, transition: transitions.fast },
};

export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: transitions.spring },
  exit: { opacity: 0, scale: 0.95, transition: transitions.fast },
};

export const staggerContainer = (staggerChildren = 0.05, delayChildren = 0): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
});

export const pressScale = {
  tap: { scale: 0.96 },
  hover: { scale: 1.02 },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } },
};

export const reducedMotionVariants = (normalVariants: Variants, reduced: boolean): Variants => {
  if (!reduced) return normalVariants;
  return {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.01 } },
    exit: { opacity: 0, transition: { duration: 0.01 } },
  };
};
