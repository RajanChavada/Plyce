// Glass UI utility classes and components
// For consistent glassmorphism styling across the app

import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Glassmorphism preset styles
export const glassStyles = {
  // Base glass panel
  panel: "bg-white/80 backdrop-blur-glass border border-white/20 shadow-glass",

  // Strong glass (for modals, sheets)
  strong: "bg-white/90 backdrop-blur-xl border border-white/30 shadow-glass",

  // Subtle glass (for cards, items)
  subtle: "bg-white/70 backdrop-blur-md border border-white/10 shadow-glass-sm",

  // Dark glass variant
  dark: "bg-gray-900/80 backdrop-blur-glass border border-gray-800/20 shadow-glass text-white",

  // Input glass
  input: "bg-white/60 backdrop-blur-md border border-white/20 focus:bg-white/80 focus:border-accent-400/50 transition-all",

  // Vibrant gradient glass (Apple-like)
  gradient: "bg-gradient-to-br from-white/95 via-white/85 to-white/70 backdrop-blur-2xl saturate-150 border border-white/50 shadow-glass ring-1 ring-white/20",
};

// Hover state utilities
export const hoverStates = {
  // Scale up slightly on hover
  lift: "hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200",

  // Glow effect
  glow: "hover:shadow-accent-500/20 hover:shadow-lg transition-shadow duration-300",

  // Glass intensify
  intensify: "hover:bg-white/90 hover:backdrop-blur-xl transition-all duration-300",

  // Subtle brightness
  brighten: "hover:brightness-105 transition-all duration-200",
};

// Animation presets for Framer Motion
export const motionPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },

  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 },
    transition: { duration: 0.3, ease: "easeOut" },
  },

  slideInRight: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
    transition: { duration: 0.3, ease: "easeOut" },
  },

  scaleIn: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
    transition: { duration: 0.2, ease: "easeOut" },
  },

  // Stagger children animation
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  },

  staggerItem: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2 },
  },
};

// Map marker pulse animation
export const markerPulse = {
  scale: [1, 1.1, 1],
  opacity: [0.7, 1, 0.7],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

// Radius overlay pulse
export const radiusPulse = {
  scale: [1, 1.02, 1],
  opacity: [0.2, 0.3, 0.2],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  },
};
