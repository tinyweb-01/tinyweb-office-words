/**
 * Save options for Markdown and PDF export.
 *
 * Provides MarkdownSaveOptions, PdfSaveOptions, and related enums.
 */

/**
 * Table content alignment options.
 */
export const TableContentAlignment = {
  AUTO: 'auto',
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
} as const;

export type TableContentAlignment = (typeof TableContentAlignment)[keyof typeof TableContentAlignment];

/**
 * List export mode options.
 */
export const MarkdownListExportMode = {
  MARKDOWN_SYNTAX: 'markdown_syntax',
  PLAIN_TEXT: 'plain_text',
} as const;

export type MarkdownListExportMode = (typeof MarkdownListExportMode)[keyof typeof MarkdownListExportMode];

/**
 * Link export mode options.
 */
export const MarkdownLinkExportMode = {
  AUTO: 'auto',
  INLINE: 'inline',
  REFERENCE: 'reference',
} as const;

export type MarkdownLinkExportMode = (typeof MarkdownLinkExportMode)[keyof typeof MarkdownLinkExportMode];

/**
 * Controls which elements are exported as raw HTML.
 */
export const MarkdownExportAsHtml = {
  NONE: 'none',
  TABLES: 'tables',
  NON_COMPATIBLE_TABLES: 'non_compatible_tables',
} as const;

export type MarkdownExportAsHtml = (typeof MarkdownExportAsHtml)[keyof typeof MarkdownExportAsHtml];

/**
 * Controls how empty paragraphs are exported.
 */
export const MarkdownEmptyParagraphExportMode = {
  EMPTY_LINE: 'empty_line',
  MARKDOWN_HARD_LINE_BREAK: 'markdown_hard_line_break',
  NONE: 'none',
} as const;

export type MarkdownEmptyParagraphExportMode = (typeof MarkdownEmptyParagraphExportMode)[keyof typeof MarkdownEmptyParagraphExportMode];

/**
 * PDF standards compliance level.
 */
export const PdfCompliance = {
  PDF17: 'pdf17',
  PDF20: 'pdf20',
  PDF_A1A: 'pdf_a1a',
  PDF_A1B: 'pdf_a1b',
  PDF_A2A: 'pdf_a2a',
  PDF_A2U: 'pdf_a2u',
  PDF_A4: 'pdf_a4',
  PDF_UA1: 'pdf_ua1',
} as const;

export type PdfCompliance = (typeof PdfCompliance)[keyof typeof PdfCompliance];

/**
 * Text compression in PDF.
 */
export const PdfTextCompression = {
  NONE: 'none',
  FLATE: 'flate',
} as const;

export type PdfTextCompression = (typeof PdfTextCompression)[keyof typeof PdfTextCompression];

/**
 * Image compression in PDF.
 */
export const PdfImageCompression = {
  AUTO: 'auto',
  JPEG: 'jpeg',
} as const;

export type PdfImageCompression = (typeof PdfImageCompression)[keyof typeof PdfImageCompression];

/**
 * PDF page display mode.
 */
export const PdfPageMode = {
  USE_NONE: 'use_none',
  USE_OUTLINES: 'use_outlines',
  USE_THUMBS: 'use_thumbs',
  FULL_SCREEN: 'full_screen',
} as const;

export type PdfPageMode = (typeof PdfPageMode)[keyof typeof PdfPageMode];

/**
 * Font embedding mode in PDF.
 */
export const PdfFontEmbeddingMode = {
  EMBED_ALL: 'embed_all',
  EMBED_NONSTANDARD: 'embed_nonstandard',
  EMBED_NONE: 'embed_none',
} as const;

export type PdfFontEmbeddingMode = (typeof PdfFontEmbeddingMode)[keyof typeof PdfFontEmbeddingMode];

/**
 * Color rendering mode.
 */
export const ColorMode = {
  NORMAL: 'normal',
  GRAYSCALE: 'grayscale',
} as const;

export type ColorMode = (typeof ColorMode)[keyof typeof ColorMode];

/**
 * Options for saving documents as PDF.
 */
export class PdfSaveOptions {
  /** PDF standard compliance */
  compliance: string = PdfCompliance.PDF17;

  /** Document structure */
  export_document_structure: boolean = false;

  /** Image options */
  image_compression: string = PdfImageCompression.AUTO;
  jpeg_quality: number = 100;

  /** Text compression */
  text_compression: string = PdfTextCompression.FLATE;

  /** Font embedding */
  embed_full_fonts: boolean = false;
  use_core_fonts: boolean = false;
  font_embedding_mode: string = PdfFontEmbeddingMode.EMBED_ALL;

  /** Page display mode */
  page_mode: string = PdfPageMode.USE_NONE;

  /** Color */
  color_mode: string = ColorMode.NORMAL;

  /** Bookmarks and outlines */
  export_bookmarks_outline: boolean = true;

  /** Form fields */
  preserve_form_fields: boolean = false;

  /** Memory optimization */
  memory_optimization: boolean = false;

  /** Zoom factor */
  zoom_factor: number = 100;
}

/**
 * Options for saving documents as Markdown.
 */
export class MarkdownSaveOptions {
  table_content_alignment: string = TableContentAlignment.AUTO;
  list_export_mode: string = MarkdownListExportMode.MARKDOWN_SYNTAX;
  export_images_as_base64: boolean = false;
  images_folder: string = '';
  images_folder_alias: string = '';
  export_underline_formatting: boolean = false;
  link_export_mode: string = MarkdownLinkExportMode.AUTO;
  export_as_html: string = MarkdownExportAsHtml.NONE;
  empty_paragraph_export_mode: string = MarkdownEmptyParagraphExportMode.EMPTY_LINE;
  image_resolution: number = 96;
  save_format: string = 'markdown';
}
