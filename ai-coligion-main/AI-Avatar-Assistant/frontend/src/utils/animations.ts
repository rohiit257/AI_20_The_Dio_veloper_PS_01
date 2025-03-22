// Animation variants for framer-motion

// Fade in animation
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { 
      duration: 0.5,
      ease: "easeInOut"
    }
  },
  exit: { 
    opacity: 0,
    transition: { 
      duration: 0.35,
      ease: "easeInOut"
    }
  }
};

// Slide up animation
export const slideUp = {
  initial: { opacity: 0, y: 30 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: { 
      duration: 0.3,
      ease: "easeIn"
    }
  }
};

// Slide from left animation
export const slideFromLeft = {
  initial: { opacity: 0, x: -40 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.5,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    x: -30,
    transition: { 
      duration: 0.3,
      ease: "easeIn"
    }
  }
};

// Slide from right animation
export const slideFromRight = {
  initial: { opacity: 0, x: 40 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.5,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    x: 30,
    transition: { 
      duration: 0.3,
      ease: "easeIn"
    }
  }
};

// Scale animation for buttons and interactive elements
export const scaleAnimation = {
  hover: { scale: 1.05 },
  tap: { scale: 0.97 },
};

// Staggered children animation
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Typing animation variant
export const typingAnimation = {
  initial: { width: '0%' },
  animate: { 
    width: '100%',
    transition: {
      duration: 2,
      ease: "easeInOut"
    }
  }
};

// Pulse animation for notifications or highlights
export const pulseAnimation = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Notification bell animation
export const bellAnimation = {
  animate: {
    rotate: [0, 15, -15, 10, -10, 0],
    transition: {
      duration: 1,
      ease: "easeInOut"
    }
  }
};

// Chat message appearing animation
export const messageFadeIn = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

// Simple transition settings for general use
export const defaultTransition = {
  duration: 0.35,
  ease: [0.42, 0, 0.58, 1]
}; 