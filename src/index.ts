/**
 * tinyweb-office-words — Lightweight free open-source document converter.
 *
 * Convert DOCX, DOC, RTF to Markdown, text, and PDF.
 */

// Main classes
export { Document, SaveFormat, LoadFormat } from './document';

// Save options
export {
  MarkdownSaveOptions,
  PdfSaveOptions,
  TableContentAlignment,
  MarkdownListExportMode,
  MarkdownLinkExportMode,
  MarkdownExportAsHtml,
  MarkdownEmptyParagraphExportMode,
  PdfCompliance,
  PdfTextCompression,
  PdfImageCompression,
  PdfPageMode,
  PdfFontEmbeddingMode,
  ColorMode,
} from './saving';

// Model enums (re-exported for aw.ParagraphAlignment etc.)
export {
  CellMerge,
  CellVerticalAlignment,
  HeightRule,
  LineSpacingRule,
  LineStyle,
  NumberStyle,
  Orientation,
  ParagraphAlignment,
  SectionStart,
  StyleType,
  Underline,
} from './model/enums';

// Wrap type
export { WrapType } from './model/wrap-type';

// Light document model (for advanced usage)
export * as ldm from './light-document-model';

// Models
export {
  ConversionOptions,
  RunFormatting,
  HeadingStyle,
  ListMarker,
  CodeBlockStyle,
} from './models';

// Version
export const __version__ = '1.0.0';
