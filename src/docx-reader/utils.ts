/**
 * Utility functions for DOCX processing.
 * Ported from Python's docx_reader/utils.py
 */

import { EXT_TO_CONTENT_TYPE, DML_MOD_SCALE, MAX_COLOR_CHANNEL } from './constants';

/**
 * Canonicalize built-in Word style names.
 */
export function canonicalizeStyleName(raw: string): string {
  const BUILTIN_STYLE_NAME_MAP: Record<string, string> = {
    'Normal Table': 'Table Normal',
    'annotation reference': 'Comment Reference',
    'annotation text': 'Comment Text',
    'annotation subject': 'Comment Subject',
    'Outline List 1': '1 / a / i',
    'Outline List 2': '1 / 1.1 / 1.1.1',
    'Outline List 3': 'Article / Section',
    macro: 'Macro Text',
  };

  if (BUILTIN_STYLE_NAME_MAP[raw]) return BUILTIN_STYLE_NAME_MAP[raw];
  return raw;
}

/**
 * Convert hex color to internal color format.
 */
export function hexToColor(hex: string): string {
  if (!hex || hex.length !== 6) return 'Color [Empty]';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return 'Color [Empty]';
  return `Color [A=255, R=${r}, G=${g}, B=${b}]`;
}

/**
 * Collect visible text from a w:r element.
 */
export function collectRunText(rElem: any): string {
  if (!rElem) return '';
  const tElements = Array.isArray(rElem['w:t'])
    ? rElem['w:t']
    : rElem['w:t'] ? [rElem['w:t']] : [];
  return tElements.map((t: any) => (typeof t === 'string' ? t : t['#text'] || '')).join('');
}

/**
 * Get content type from filename extension.
 */
export function extToContentType(filename: string): string {
  const parts = filename.split('.');
  if (parts.length < 2) return 'image/png';
  const ext = parts[parts.length - 1].toLowerCase();
  return EXT_TO_CONTENT_TYPE[ext] || 'image/png';
}

/**
 * Apply theme color modifiers (tint/shade).
 */
export function applyThemeColorModifiers(
  baseHex: string,
  tint?: string | null,
  shade?: string | null
): string {
  if (!baseHex || baseHex.length !== 6) return baseHex;
  let r = parseInt(baseHex.substring(0, 2), 16);
  let g = parseInt(baseHex.substring(2, 4), 16);
  let b = parseInt(baseHex.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return baseHex;

  const tintVal = tint ? parseInt(tint, 16) / DML_MOD_SCALE : 0;
  const shadeVal = shade ? parseInt(shade, 16) / DML_MOD_SCALE : 0;

  if (shade) {
    r = Math.round(r * shadeVal);
    g = Math.round(g * shadeVal);
    b = Math.round(b * shadeVal);
  }
  if (tint) {
    r = Math.round(r + (MAX_COLOR_CHANNEL - r) * (1.0 - tintVal));
    g = Math.round(g + (MAX_COLOR_CHANNEL - g) * (1.0 - tintVal));
    b = Math.round(b + (MAX_COLOR_CHANNEL - b) * (1.0 - tintVal));
  }

  r = Math.max(0, Math.min(MAX_COLOR_CHANNEL, r));
  g = Math.max(0, Math.min(MAX_COLOR_CHANNEL, g));
  b = Math.max(0, Math.min(MAX_COLOR_CHANNEL, b));
  return `${r.toString(16).padStart(2, '0').toUpperCase()}${g.toString(16).padStart(2, '0').toUpperCase()}${b.toString(16).padStart(2, '0').toUpperCase()}`;
}

/**
 * Create empty borders array (6 entries).
 */
export function emptyBorders(): any[] {
  return Array.from({ length: 6 }, () => ({
    line_style: 0,
    line_width: 0.0,
    color: 'Color [Empty]',
  }));
}
