/**
 * Centralized animation timing constants for the landing page.
 *
 * All timing values are in milliseconds unless noted otherwise.
 * Adjust SPEED_MULTIPLIER to globally speed up (< 1) or slow down (> 1) all animations.
 *
 * NOTE: CSS animations in globals.css should be kept in sync with these values.
 * See CSS_ANIMATIONS below for the corresponding CSS values.
 */

// =============================================================================
// GLOBAL SPEED CONTROL
// =============================================================================

/**
 * Global speed multiplier for all animations.
 * - 1.0 = normal speed
 * - 0.8 = 20% faster
 * - 1.2 = 20% slower
 */
export const SPEED_MULTIPLIER = 1.0;

/** Helper to apply speed multiplier to a duration */
export const duration = (ms: number) => Math.round(ms * SPEED_MULTIPLIER);

/** Helper to convert ms to seconds (for CSS/framer-motion) */
export const seconds = (ms: number) => duration(ms) / 1000;

// =============================================================================
// CSS ANIMATION DURATIONS (in ms, will be converted to seconds for CSS)
// =============================================================================

/**
 * CSS animation durations (in ms).
 *
 * These values are mirrored in globals.css. When updating, ensure both are in sync:
 * - fadeIn: .animate-fade-in
 * - slideUp: .animate-slide-up
 * - slideDown: .animate-slide-down
 * - scaleIn: .animate-scale-in
 * - fadeInUp: .stagger-children > *
 * - floatSlow/Medium/Fast: .animate-float-*
 * - staggerDelay: .stagger-children > *:nth-child(n)
 */
export const CSS_ANIMATIONS = {
  /** Quick fade in (0.3s in CSS) */
  fadeIn: 300,
  /** Slide up entrance (0.4s in CSS) */
  slideUp: 400,
  /** Slide down entrance (0.4s in CSS) */
  slideDown: 400,
  /** Scale in entrance (0.3s in CSS) */
  scaleIn: 300,
  /** Fade + translate up (0.4s in CSS) */
  fadeInUp: 400,

  /** Floating card - slow bob (6s in CSS) */
  floatSlow: 6000,
  /** Floating card - medium bob (4.5s in CSS) */
  floatMedium: 4500,
  /** Floating card - fast bob (3s in CSS) */
  floatFast: 3000,

  /** Stagger delay between children (50ms in CSS) */
  staggerDelay: 50,
} as const;

// =============================================================================
// FRAMER MOTION TRANSITIONS
// =============================================================================

export const TRANSITIONS = {
  /** Fast micro-interaction */
  fast: { duration: seconds(200) },
  /** Standard element entrance */
  normal: { duration: seconds(400) },
  /** Slower, more dramatic entrance */
  slow: { duration: seconds(450) },
  /** Section reveal on scroll */
  section: { duration: seconds(450) },

  /** Stagger delay for sequential reveals */
  staggerDelay: 0.08,
} as const;

// =============================================================================
// ANIMATED LOGO (nav bar domain cycling)
// =============================================================================

export const ANIMATED_LOGO = {
  /** How long "backpocket" shows before first cycle */
  initialDelay: duration(2000),
  /** How long each domain shows before cycling */
  cycleDelay: duration(2800),
  /** Duration of the morph transition between domains */
  morphDuration: duration(220),
} as const;

// =============================================================================
// HERO POCKET VISUAL (save animation demo)
// =============================================================================

export const HERO_POCKET = {
  /** Time before "Saving..." appears */
  idleToSaving: duration(1500),
  /** Time before "Saved!" confirmation */
  savingToSaved: duration(2400),
  /** Time before fade out starts */
  savedToFading: duration(4800),
  /** Time before reset */
  fadingToReset: duration(5600),
  /** Full loop interval - needs enough gap after reset for spring animations to settle */
  loopInterval: duration(6800),
} as const;

// =============================================================================
// MULTI-PLATFORM DEMO (URL typing + card preview)
// =============================================================================

export const MULTI_PLATFORM_DEMO = {
  /** Delay between each character typed */
  typingSpeed: duration(30),
  /** How long the preview card is displayed */
  cardDisplayTime: duration(2800),
  /** Delay between phases */
  transitionDelay: duration(240),
  /** Card entrance/exit animation */
  cardTransition: seconds(200),
  /** "Save to Library" button pulse duration */
  buttonPulseDuration: seconds(1200),
  /** Button pulse repeat delay */
  buttonPulseRepeatDelay: seconds(400),
} as const;

// =============================================================================
// NOTES CURATION DEMO (typing + formatting + tagging)
// =============================================================================

export const NOTES_DEMO = {
  /** Delay between each character typed */
  typingSpeed: duration(28),
  /** Delay between phases (typing → formatting → tagging → saved) */
  phaseDelay: duration(640),
  /** Delay between each tag appearing */
  tagStagger: duration(160),
  /** How long "Saved" is shown before reset */
  loopPause: duration(2400),
  /** Reset transition duration */
  resetDelay: duration(400),
  /** Toolbar button animation duration */
  toolbarButtonDuration: seconds(240),
  /** Tag entrance duration */
  tagEntranceDuration: seconds(160),
} as const;

// =============================================================================
// BROWSER EXTENSION DEMO
// =============================================================================

export const BROWSER_EXTENSION_DEMO = {
  /** Time before click animation */
  browsingToClicking: duration(2400),
  /** Time before saving indicator */
  clickingToSaving: duration(2900),
  /** Time before saved confirmation */
  savingToSaved: duration(3600),
  /** Time before card appears in collection */
  savedToAppearing: duration(4400),
  /** Time before reset */
  appearingToReset: duration(8000),
  /** Full loop interval */
  loopInterval: duration(8400),
  /** Click ripple effect duration */
  clickRippleDuration: seconds(400),
} as const;

// =============================================================================
// MOBILE APP DEMO (share sheet)
// =============================================================================

export const MOBILE_APP_DEMO = {
  /** Time before share sheet appears */
  articleToShareSheet: duration(2000),
  /** Time before app opens */
  shareSheetToAppOpening: duration(3400),
  /** Time before saved confirmation */
  appOpeningToSaved: duration(4000),
  /** Time before complete state */
  savedToComplete: duration(5200),
  /** Time before reset to article */
  completeToReset: duration(8400),
  /** Full loop interval */
  loopInterval: duration(8800),
  /** Share sheet icon scale animation */
  iconScaleDuration: seconds(400),
  /** Share sheet icon scale delay */
  iconScaleDelay: seconds(600),
  /** Share sheet glow animation */
  glowDuration: seconds(1000),
  /** Share sheet glow delay */
  glowDelay: seconds(400),
} as const;

// =============================================================================
// WEB APP DEMO (paste to save)
// =============================================================================

export const WEB_APP_DEMO = {
  /** Time before typing starts */
  emptyToPasting: duration(1200),
  /** Delay between each character typed */
  typingSpeed: duration(24),
  /** Time before processing indicator */
  pastingToProcessing: duration(2800),
  /** Time before saved confirmation */
  processingToSaved: duration(3600),
  /** Time before complete state */
  savedToComplete: duration(4800),
  /** Time before reset */
  completeToReset: duration(7200),
  /** Full loop interval */
  loopInterval: duration(7600),
} as const;

// =============================================================================
// RSS FEED DEMO
// =============================================================================

export const RSS_FEED_DEMO = {
  /** Time before saving indicator */
  idleToSaving: duration(1600),
  /** Time before feed updates */
  savingToUpdating: duration(2400),
  /** Time before complete state */
  updatingToComplete: duration(3200),
  /** Time before reset */
  completeToReset: duration(6400),
  /** Full loop interval */
  loopInterval: duration(6800),
} as const;

// =============================================================================
// HOW IT WORKS SECTION
// =============================================================================

export const HOW_IT_WORKS = {
  /** Globe icon rotation duration (seconds) */
  globeRotation: seconds(2500),
} as const;
