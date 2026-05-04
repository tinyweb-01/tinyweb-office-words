/**
 * Specifies how text is wrapped around a shape or picture.
 */
export const WrapType = {
  /** The shape remains on the same layer as text and treated as a character. */
  INLINE: 0,
  /** The text stops at the top of the shape and restarts on the line below the shape. */
  TOP_BOTTOM: 1,
  /** Wraps text around all sides of the square bounding box of the shape. */
  SQUARE: 2,
  /** No text wrapping around the shape. The shape is placed behind or in front of text. */
  NONE: 3,
  /** Wraps tightly around the edges of the shape, instead of wrapping around the bounding box. */
  TIGHT: 4,
  /** Same as Tight, but wraps inside any parts of the shape that are open. */
  THROUGH: 5,
} as const;

export type WrapType = (typeof WrapType)[keyof typeof WrapType];
