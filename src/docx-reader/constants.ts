/**
 * Constants for DOCX XML parsing.
 * Ported from Python's docx_reader/constants.py
 */

import {
  ParagraphAlignment as PA,
  LineSpacingRule as LSR,
  LineStyle as LS,
  StyleType as ST,
  Underline as UL,
  SectionStart as SS,
  CellVerticalAlignment as CVA,
} from '../model/enums';

// ═══════════════════════════════════════════════
// XML NAMESPACES
// ═══════════════════════════════════════════════

export const W_NS = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}';
export const R_NS = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}';
export const WP_NS = '{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}';
export const A_NS = '{http://schemas.openxmlformats.org/drawingml/2006/main}';
export const PIC_NS = '{http://schemas.openxmlformats.org/drawingml/2006/picture}';
export const MC_NS = '{http://schemas.openxmlformats.org/markup-compatibility/2006}';
export const WPS_NS = '{http://schemas.microsoft.com/office/word/2010/wordprocessingShape}';
export const WPG_NS = '{http://schemas.microsoft.com/office/word/2010/wordprocessingGroup}';
export const PKG_RELS_NS = '{http://schemas.openxmlformats.org/package/2006/relationships}';

// ═══════════════════════════════════════════════
// UNIT CONVERSION
// ═══════════════════════════════════════════════

export const EMU_PER_MM = 914400.0 / 25.4;
export const EMU_PER_PT = 12700.0;
export const TWIPS_PER_PT = 20.0;
export const HALF_PT_DIVISOR = 2.0;
export const BORDER_SIZE_DIVISOR = 8.0;
export const POINTS_PER_INCH = 72.0;
export const MM_PER_INCH = 25.4;
export const PCT_DIVISOR = 50.0;
export const DML_MOD_SCALE = 100000.0;
export const MAX_COLOR_CHANNEL = 255;
export const DEFAULT_TAB_STOP_PT = 36.0;

// ═══════════════════════════════════════════════
// SENTINEL VALUES
// ═══════════════════════════════════════════════

export const COLOR_EMPTY = 'Color [Empty]';
export const PAGE_FIELD_SENTINEL = '\x00PAGE\x00';

// ═══════════════════════════════════════════════
// MAPPING CONSTANTS
// ═══════════════════════════════════════════════

export const BODY_ANCHOR_MAP: Record<string, number> = {
  t: CVA.TOP,
  ctr: CVA.CENTER,
  b: CVA.BOTTOM,
};

export const HIGHLIGHT_COLOR_MAP: Record<string, string> = {
  yellow: 'Color [A=255, R=255, G=255, B=0]',
  green: 'Color [A=255, R=0, G=128, B=0]',
  cyan: 'Color [A=255, R=0, G=255, B=255]',
  magenta: 'Color [A=255, R=255, G=0, B=255]',
  blue: 'Color [A=255, R=0, G=0, B=255]',
  red: 'Color [A=255, R=255, G=0, B=0]',
  darkBlue: 'Color [A=255, R=0, G=0, B=128]',
  darkCyan: 'Color [A=255, R=0, G=128, B=128]',
  darkGreen: 'Color [A=255, R=0, G=128, B=0]',
  darkMagenta: 'Color [A=255, R=128, G=0, B=128]',
  darkRed: 'Color [A=255, R=128, G=0, B=0]',
  darkYellow: 'Color [A=255, R=128, G=128, B=0]',
  darkGray: 'Color [A=255, R=128, G=128, B=128]',
  lightGray: 'Color [A=255, R=192, G=192, B=192]',
  black: 'Color [A=255, R=0, G=0, B=0]',
  white: 'Color [A=255, R=255, G=255, B=255]',
};

export const EXT_TO_CONTENT_TYPE: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', bmp: 'image/bmp',
  tiff: 'image/tiff', tif: 'image/tiff', webp: 'image/webp',
};

export const ALIGNMENT_MAP: Record<string, number> = {
  left: PA.LEFT, start: PA.LEFT, center: PA.CENTER,
  right: PA.RIGHT, end: PA.RIGHT, both: PA.JUSTIFY, distribute: PA.DISTRIBUTED,
};

export const UNDERLINE_MAP: Record<string, number> = {
  none: UL.NONE, single: UL.SINGLE, words: UL.WORDS, double: UL.DOUBLE,
  dotted: UL.DOTTED, thick: UL.THICK, dash: UL.DASH,
  dotDash: UL.DOT_DASH, dotDotDash: UL.DOT_DOT_DASH, wavy: UL.WAVY,
};

export const BORDER_STYLE_MAP: Record<string, number> = {
  none: LS.NONE, nil: LS.NONE, single: LS.SINGLE, thick: LS.THICK,
  double: LS.DOUBLE, hairline: LS.HAIRLINE, dotted: LS.DOT,
  dashed: LS.DASH_LARGE_GAP, dotDash: LS.DOT_DASH, dotDotDash: LS.DOT_DOT_DASH,
  triple: LS.TRIPLE, thinThickSmallGap: LS.THIN_THICK_SMALL_GAP,
  thickThinSmallGap: LS.THICK_THIN_SMALL_GAP,
  thinThickThinSmallGap: LS.THIN_THICK_THIN_SMALL_GAP,
  thinThickMediumGap: LS.THIN_THICK_MEDIUM_GAP,
  thickThinMediumGap: LS.THICK_THIN_MEDIUM_GAP,
  thinThickThinMediumGap: LS.THIN_THICK_THIN_MEDIUM_GAP,
  thinThickLargeGap: LS.THIN_THICK_LARGE_GAP,
  thickThinLargeGap: LS.THICK_THIN_LARGE_GAP,
  thinThickThinLargeGap: LS.THIN_THICK_THIN_LARGE_GAP,
  wave: LS.WAVE, doubleWave: LS.DOUBLE_WAVE, dashSmallGap: LS.DASH_SMALL_GAP,
  dashDotStroked: LS.DASH_DOT_STROKER, threeDEmboss: LS.EMBOSS_3D,
  threeDEngrave: LS.ENGRAVE_3D, outset: LS.OUTSET, inset: LS.INSET,
};

export const STYLE_TYPE_MAP: Record<string, number> = {
  paragraph: ST.PARAGRAPH, character: ST.CHARACTER,
  table: ST.TABLE, numbering: ST.LIST,
};

export const SECTION_START_MAP: Record<string, number> = {
  continuous: SS.CONTINUOUS, newColumn: SS.NEW_COLUMN,
  newPage: SS.NEW_PAGE, evenPage: SS.EVEN_PAGE, oddPage: SS.ODD_PAGE,
};

export const LINE_RULE_MAP: Record<string, number> = {
  atLeast: LSR.AT_LEAST, exact: LSR.EXACTLY, exactly: LSR.EXACTLY, auto: LSR.MULTIPLE,
};

export const NUMBER_STYLE_MAP: Record<string, number> = {
  decimal: 0, upperRoman: 1, lowerRoman: 2, upperLetter: 3, lowerLetter: 4,
  ordinal: 5, bullet: 23, none: 255,
};
