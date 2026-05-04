/**
 * Specifies how a cell in a table is merged with other cells.
 */
export const CellMerge = {
  NONE: 0,
  FIRST: 1,
  PREVIOUS: 2,
} as const;

export type CellMerge = (typeof CellMerge)[keyof typeof CellMerge];

/**
 * Specifies vertical justification of text inside a table cell.
 */
export const CellVerticalAlignment = {
  TOP: 0,
  CENTER: 1,
  BOTTOM: 2,
} as const;

export type CellVerticalAlignment = (typeof CellVerticalAlignment)[keyof typeof CellVerticalAlignment];
