/**
 * Specifies the rule for determining the height of an object.
 */
export const HeightRule = {
  /** The height will be at least the specified height in points. */
  AT_LEAST: 0,
  /** The height is specified exactly in points. */
  EXACTLY: 1,
  /** The height will grow automatically to accommodate all text. */
  AUTO: 2,
} as const;

export type HeightRule = (typeof HeightRule)[keyof typeof HeightRule];

/**
 * Specifies the type of break at the beginning of the section.
 */
export const SectionStart = {
  CONTINUOUS: 0,
  NEW_COLUMN: 1,
  NEW_PAGE: 2,
  EVEN_PAGE: 3,
  ODD_PAGE: 4,
} as const;

export type SectionStart = (typeof SectionStart)[keyof typeof SectionStart];

/**
 * Specifies page orientation.
 */
export const Orientation = {
  PORTRAIT: 0,
  LANDSCAPE: 1,
} as const;

export type Orientation = (typeof Orientation)[keyof typeof Orientation];
