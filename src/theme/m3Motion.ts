/**
 * Material Design 3 (M3) Motion & Shape Specifications
 * Enhanced with Spring Overshoot Physics for Expressive UI Animations
 */

export const m3Easing = {
  // Signature M3 Curves
  emphasized: [0.2, 0.0, 0.0, 1.0] as const,
  emphasizedDecelerate: [0.05, 0.7, 0.1, 1.0] as const,
  emphasizedAccelerate: [0.3, 0.0, 0.8, 0.15] as const,

  // Expressive Overshoot Curves
  overshoot: [0.34, 1.56, 0.64, 1.0] as const,
  overshootSubtle: [0.175, 0.885, 0.32, 1.275] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,

  // Standard Utility
  standard: [0.2, 0.0, 0.0, 1.0] as const,
  standardDecelerate: [0.0, 0.0, 0.2, 1.0] as const,
  standardAccelerate: [0.4, 0.0, 1.0, 1.0] as const,

  // CSS strings
  css: {
    overshoot: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    overshootSubtle: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    emphasized: 'cubic-bezier(0.2, 0.0, 0.0, 1.0)',
    emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
    emphasizedAccelerate: 'cubic-bezier(0.3, 0.0, 0.8, 0.15)',
    standard: 'cubic-bezier(0.2, 0.0, 0.0, 1.0)',
    standardDecelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1.0)',
    standardAccelerate: 'cubic-bezier(0.4, 0.0, 1.0, 1.0)',
  },
};

export const m3Duration = {
  short1: 0.05, // 50ms
  short2: 0.1, // 100ms
  short3: 0.15, // 150ms
  short4: 0.2, // 200ms
  medium1: 0.25, // 250ms
  medium2: 0.3, // 300ms
  medium3: 0.35, // 350ms
  medium4: 0.4, // 400ms
  long1: 0.45, // 450ms
  long2: 0.5, // 500ms
  long3: 0.55, // 550ms
  long4: 0.6, // 600ms
  extraLong1: 0.7, // 700ms
  extraLong2: 0.8, // 800ms
  extraLong3: 0.9, // 900ms
  extraLong4: 1.0, // 1000ms
};

export const m3Shape = {
  none: '0px',
  extraSmall: '4px',
  small: '8px',
  medium: '12px',
  large: '16px',
  extraLarge: '28px',
  full: '9999px',
};

// Expressive Spring Physics Tokens Optimized for High Frame-Rate & Low Latency
export const m3Spring = {
  overshoot: {
    type: 'spring' as const,
    stiffness: 350,
    damping: 24,
    mass: 0.7,
  },
  overshootSnappy: {
    type: 'spring' as const,
    stiffness: 420,
    damping: 26,
    mass: 0.65,
  },
  overshootBouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 18,
    mass: 0.8,
  },
  pillGlide: {
    type: 'spring' as const,
    stiffness: 450,
    damping: 30,
    mass: 0.7,
  },
  dialogOvershoot: {
    type: 'spring' as const,
    stiffness: 380,
    damping: 26,
    mass: 0.75,
  },
  spatialFast: { type: 'spring' as const, stiffness: 600, damping: 32 },
  spatialDefault: { type: 'spring' as const, stiffness: 450, damping: 28 },
  spatialSlow: { type: 'spring' as const, stiffness: 280, damping: 24 },
  effectsFast: { type: 'spring' as const, stiffness: 1000, damping: 40 },
  effectsDefault: { type: 'spring' as const, stiffness: 700, damping: 34 },
  effectsSlow: { type: 'spring' as const, stiffness: 400, damping: 28 },
};

// Reusable Framer Motion Variants with Hardware-Accelerated Smoothness
export const m3Variants = {
  // Fade Through (Top-Level Destinations)
  fadeThrough: {
    initial: { opacity: 0, scale: 0.97, y: 6 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 360,
        damping: 26,
        mass: 0.7,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      y: -4,
      transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
    },
  },

  // Shared Axis X (Horizontal filter transitions)
  sharedAxisX: {
    initial: { opacity: 0, x: 18, scale: 0.98 },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 380,
        damping: 26,
        mass: 0.7,
      },
    },
    exit: { opacity: 0, x: -18, scale: 0.98, transition: { duration: 0.12 } },
  },

  // Stagger Container for Cascading list items
  staggerContainer: {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.01,
      },
    },
  },

  // Individual Stagger Item with Smooth GPU Acceleration
  staggerItem: {
    initial: { opacity: 0, y: 16, scale: 0.94 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 360,
        damping: 24,
        mass: 0.7,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      transition: { duration: 0.12, ease: 'easeIn' },
    },
  },

  // Dialog & Modal Pop-in with Snappy Overshoot
  dialogOvershoot: {
    initial: { opacity: 0, scale: 0.88, y: 20 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 380,
        damping: 26,
        mass: 0.75,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.94,
      y: 10,
      transition: { duration: 0.15, ease: 'easeIn' },
    },
  },

  // Interactive Card Hover & Tap
  interactiveCard: {
    rest: { scale: 1, y: 0 },
    hover: {
      scale: 1.025,
      y: -3,
      transition: {
        type: 'spring',
        stiffness: 420,
        damping: 22,
      },
    },
    tap: {
      scale: 0.96,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 24,
      },
    },
  },
};
