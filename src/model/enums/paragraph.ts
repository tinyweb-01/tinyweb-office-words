/**
 * Specifies text alignment in a paragraph.
 */
export const ParagraphAlignment = {
  LEFT: 0,
  CENTER: 1,
  RIGHT: 2,
  JUSTIFY: 3,
  DISTRIBUTED: 4,
  ARABIC_MEDIUM_KASHIDA: 5,
  ARABIC_HIGH_KASHIDA: 7,
  ARABIC_LOW_KASHIDA: 8,
  THAI_DISTRIBUTED: 9,
  MATH_ELEMENT_CENTER_AS_GROUP: 10,
} as const;

export type ParagraphAlignment = (typeof ParagraphAlignment)[keyof typeof ParagraphAlignment];

/**
 * Specifies values for line spacing.
 */
export const LineSpacingRule = {
  /** The line spacing can be greater than or equal to, but never less
   * than, the value specified in the `line_spacing` property. */
  AT_LEAST: 0,
  /** The line spacing never changes from the value specified in the
   * `line_spacing` property, even if a larger font is used. */
  EXACTLY: 1,
  /** The line spacing is specified in the `line_spacing` property as
   * the number of lines. One line equals 12 points. */
  MULTIPLE: 2,
} as const;

export type LineSpacingRule = (typeof LineSpacingRule)[keyof typeof LineSpacingRule];
