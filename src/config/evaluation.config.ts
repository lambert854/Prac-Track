/**
 * Evaluation Module Configuration
 * 
 * Central configuration for evaluation workflows including autosave timing,
 * badge display text, and evaluation constraints.
 */

export const EvaluationConfig = {
  // Autosave interval in milliseconds (15 seconds)
  AUTOSAVE_MS: 15000,

  // Show print button on locked evaluations
  SHOW_PRINT_BUTTON: true,

  // Require all required fields across all pages before final submit
  REQUIRE_ALL_PAGES: true,

  // Only send evaluations to placements with this status
  ACTIVE_STATUS: 'ACTIVE' as const,

  // Badge text displayed on faculty views
  BADGE_TEXT: {
    student: {
      MIDTERM: 'Mid Self',
      FINAL: 'Final Self',
    },
    supervisor: {
      MIDTERM: 'Mid Eval',
      FINAL: 'Final Eval',
    },
  },

  // Badge styling (Tailwind classes)
  BADGE_STYLES: {
    student: {
      base: 'bg-green-100 text-green-800 border border-green-200',
      hover: 'hover:bg-green-200',
    },
    supervisor: {
      base: 'bg-blue-100 text-blue-800 border border-blue-200',
      hover: 'hover:bg-blue-200',
    },
  },

  // Progress calculation
  PROGRESS: {
    // Minimum percentage to show "In Progress" vs "Not Started"
    MIN_PROGRESS_THRESHOLD: 0.05,
  },

  // Notification messages
  NOTIFICATIONS: {
    SENT: {
      STUDENT: 'A new evaluation is available for you to complete.',
      SUPERVISOR: 'A new evaluation is available for you to complete.',
    },
    LOCKED: {
      STUDENT: 'Your self-evaluation has been submitted successfully.',
      SUPERVISOR: 'Your evaluation has been submitted successfully.',
    },
  },
} as const

export type EvaluationType = 'MIDTERM' | 'FINAL'
export type EvaluationRole = 'STUDENT' | 'SUPERVISOR'
export type EvaluationStatus = 'PENDING' | 'IN_PROGRESS' | 'LOCKED'
