import Font from "./Font";

// ////////////////////////////////////////////////////////////////////////////
//
// Internationalization
//
// ////////////////////////////////////////////////////////////////////////////

// Whether Node's forward and backward are switched.
export const RIGHT_TO_LEFT = false;

// ////////////////////////////////////////////////////////////////////////////
//
// User input settings
//
// ////////////////////////////////////////////////////////////////////////////

// How long the carousel takes, in milliseconds, to open.
export const CAROUSEL_SHOW_DURATION = 200;

// Minimum distance from center where a carousel option can be chosen.
export const CAROUSEL_MIN_DISTANCE = 8;

// ////////////////////////////////////////////////////////////////////////////
//
// Text settings
//
// ////////////////////////////////////////////////////////////////////////////

export const FONT_SIZE = 12;
export const FONT_UPSCALE = Math.max(1, 72 / FONT_SIZE);
export const UPSCALED_FONT_SIZE = FONT_UPSCALE * FONT_SIZE;
export const LETTER_HEIGHT = 2.0;

let DEFAULT_FONT: Font = null;
export function defaultFont() {
  if (!DEFAULT_FONT) {
    DEFAULT_FONT = new Font(UPSCALED_FONT_SIZE, "sans-serif", "white");
  }
  return DEFAULT_FONT;
}

// ////////////////////////////////////////////////////////////////////////////
//
// Optimization hints.
//
// ////////////////////////////////////////////////////////////////////////////

// The size used to split large number of nodes into creased graphs.
export const NATURAL_GROUP_SIZE = 250;

// Use a faster combining algorithm to speed layout calculation.
export const FIT_LOOSE = false;

// Whether graphs should be creased.
export const CREASE = false;
