/**
 * Lightweight document model for Markdown/PDF rendering.
 *
 * Internal data model used by readers and writers.
 * Ported from Python's light_document_model.py (Pydantic) to Zod + TypeScript.
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════
// Forward-declared interfaces for recursive types
// ═══════════════════════════════════════════════

export interface Cell {
  _type: 'Cell';
  cell_format: CellFormat;
  paragraphs: Paragraph[];
  tables: Table[];
}

export interface Table {
  _type: 'Table';
  alignment: number;
  preferred_width: string;
  left_indent: number;
  left_padding: number;
  right_padding: number;
  top_padding: number;
  bottom_padding: number;
  rows: Row[];
}

export interface Paragraph {
  _type: 'Paragraph';
  paragraph_format: ParagraphFormat;
  list_format: ListFormat | null;
  runs: Run[];
  inline_extras: InlineExtra[];
  content_sequence: (Run | ShapeNode)[];
  _text: string;
}

// ─────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────

export const BorderSchema = z.object({
  line_style: z.number().default(0),
  line_width: z.number().default(0.0),
  color: z.string().default(''),
});

export interface Border { line_style: number; line_width: number; color: string; }

export const ShadingSchema = z.object({
  background_color: z.string().default(''),
});

export interface Shading { background_color: string; }

// ─────────────────────────────────────────────
// Font
// ─────────────────────────────────────────────

export const FontSchema = z.object({
  name: z.string().default(''),
  size: z.number().default(0.0),
  bold: z.boolean().default(false),
  italic: z.boolean().default(false),
  underline: z.number().default(0),
  color: z.string().default(''),
  strike_through: z.boolean().default(false),
  superscript: z.boolean().default(false),
  subscript: z.boolean().default(false),
  highlight_color: z.string().default(''),
  all_caps: z.boolean().default(false),
  small_caps: z.boolean().default(false),
  hidden: z.boolean().default(false),
  style_name: z.string().default(''),
  shading: ShadingSchema.default({}),
});

export interface Font { name: string; size: number; bold: boolean; italic: boolean; underline: number; color: string; strike_through: boolean; superscript: boolean; subscript: boolean; highlight_color: string; all_caps: boolean; small_caps: boolean; hidden: boolean; style_name: string; shading: Shading; }

// ─────────────────────────────────────────────
// Paragraph format
// ─────────────────────────────────────────────

export const ParagraphFormatSchema = z.object({
  style_name: z.string().default(''),
  alignment: z.number().default(0),
  left_indent: z.number().default(0.0),
  right_indent: z.number().default(0.0),
  first_line_indent: z.number().default(0.0),
  space_before: z.number().default(0.0),
  space_after: z.number().default(0.0),
  space_before_auto: z.boolean().default(false),
  space_after_auto: z.boolean().default(false),
  line_spacing: z.number().default(0.0),
  line_spacing_rule: z.number().default(0),
  keep_with_next: z.boolean().default(false),
  page_break_before: z.boolean().default(false),
  outline_level: z.number().default(9),
  is_heading: z.boolean().default(false),
  is_list_item: z.boolean().default(false),
  shading: ShadingSchema.default({}),
  borders: z.array(BorderSchema).default([]),
});

export interface ParagraphFormat {
  style_name: string; alignment: number; left_indent: number; right_indent: number;
  first_line_indent: number; space_before: number; space_after: number;
  space_before_auto: boolean; space_after_auto: boolean; line_spacing: number;
  line_spacing_rule: number; keep_with_next: boolean; page_break_before: boolean;
  outline_level: number; is_heading: boolean; is_list_item: boolean;
  shading: Shading; borders: Border[];
}

export const ListFormatSchema = z.object({
  is_list_item: z.boolean().default(false),
  list_level_number: z.number().default(0),
  list_id: z.number().default(0),
  list_label: z.string().default(''),
});

export interface ListFormat { is_list_item: boolean; list_level_number: number; list_id: number; list_label: string; }

// ─────────────────────────────────────────────
// Image data
// ─────────────────────────────────────────────

export const ImageDataSchema = z.object({
  source_filename: z.string().default(''),
  content_type: z.string().default(''),
  image_bytes: z.instanceof(Buffer).default(Buffer.alloc(0)),
});

export interface ImageData { source_filename: string; content_type: string; image_bytes: Buffer; }

// ─────────────────────────────────────────────
// Inline nodes
// ─────────────────────────────────────────────

export const RunSchema = z.object({
  _type: z.literal('Run').default('Run'),
  text: z.string().default(''),
  font: FontSchema.default({}),
});

export interface Run { _type: 'Run'; text: string; font: Font; }

export const ShapeNodeSchema = z.object({
  _type: z.literal('Shape').default('Shape'),
  shape_type: z.number().nullable().default(null),
  name: z.string().default(''),
  width: z.number().nullable().default(null),
  height: z.number().nullable().default(null),
  left: z.number().default(0.0),
  top: z.number().default(0.0),
  is_inline: z.boolean().nullable().default(null),
  has_image: z.boolean().nullable().default(null),
  image_data: ImageDataSchema.nullable().default(null),
  text_box: z.record(z.any()).nullable().default(null),
  shading: ShadingSchema.default({}),
  borders: z.array(BorderSchema).default([]),
  vertical_alignment: z.number().default(0),
  wrap_type: z.number().default(0),
});

export interface ShapeNode {
  _type: 'Shape'; shape_type: number | null; name: string;
  width: number | null; height: number | null; left: number; top: number;
  is_inline: boolean | null; has_image: boolean | null; image_data: ImageData | null;
  text_box: Record<string, unknown> | null; shading: Shading; borders: Border[];
  vertical_alignment: number; wrap_type: number;
}

export interface ShapeNodeRuntime extends ShapeNode {
  _is_positioned?: boolean;
}

export const FieldStartSchema = z.object({
  _type: z.literal('FieldStart').default('FieldStart'),
  field_type: z.number().nullable().default(null),
});

export interface FieldStart { _type: 'FieldStart'; field_type: number | null; }

export const BookmarkStartSchema = z.object({
  _type: z.literal('BookmarkStart').default('BookmarkStart'),
  name: z.string().default(''),
});

export interface BookmarkStart { _type: 'BookmarkStart'; name: string; }

export const InlineExtraSchema = z.union([
  ShapeNodeSchema,
  FieldStartSchema,
  BookmarkStartSchema,
]);

export type InlineExtra = ShapeNode | FieldStart | BookmarkStart;

const KEPT_INLINE_TYPES = new Set(['Shape', 'FieldStart', 'BookmarkStart']);

// ─────────────────────────────────────────────
// Paragraph Schema
// ─────────────────────────────────────────────

export const ParagraphSchema = z.object({
  _type: z.literal('Paragraph').default('Paragraph'),
  paragraph_format: ParagraphFormatSchema.default({}),
  list_format: ListFormatSchema.nullable().default(null),
  runs: z.array(RunSchema).default([]),
  inline_extras: z.array(InlineExtraSchema).default([]),
  content_sequence: z.array(z.union([RunSchema, ShapeNodeSchema])).default([]),
  _text: z.string().default(''),
});

// ─────────────────────────────────────────────
// Table → Row → Cell
// ─────────────────────────────────────────────

export const CellFormatSchema = z.object({
  width: z.number().default(0.0),
  preferred_width: z.string().default('Auto'),
  vertical_alignment: z.number().default(0),
  vertical_merge: z.number().default(0),
  horizontal_merge: z.number().default(0),
  top_padding: z.number().default(0.0),
  bottom_padding: z.number().default(0.0),
  left_padding: z.number().default(0.0),
  right_padding: z.number().default(0.0),
  shading: ShadingSchema.default({}),
  borders: z.array(BorderSchema).default([]),
});

export interface CellFormat {
  width: number; preferred_width: string; vertical_alignment: number;
  vertical_merge: number; horizontal_merge: number;
  top_padding: number; bottom_padding: number; left_padding: number; right_padding: number;
  shading: Shading; borders: Border[];
}

export const CellSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    _type: z.literal('Cell').default('Cell'),
    cell_format: CellFormatSchema.default({}),
    paragraphs: z.array(ParagraphSchema).default([]),
    tables: z.array(TableSchema).default([]),
  })
);

export const RowFormatSchema = z.object({
  height: z.number().default(0.0),
  height_rule: z.number().default(0),
  heading_format: z.boolean().default(false),
  allow_break_across_pages: z.boolean().default(true),
});

export interface RowFormat { height: number; height_rule: number; heading_format: boolean; allow_break_across_pages: boolean; }

export const RowSchema = z.object({
  _type: z.literal('Row').default('Row'),
  row_format: RowFormatSchema.default({}),
  cells: z.array(CellSchema).default([]),
});

export interface Row { _type: 'Row'; row_format: RowFormat; cells: Cell[]; }

export const TableSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    _type: z.literal('Table').default('Table'),
    alignment: z.number().default(0),
    preferred_width: z.string().default(''),
    left_indent: z.number().default(0.0),
    left_padding: z.number().default(0.0),
    right_padding: z.number().default(0.0),
    top_padding: z.number().default(0.0),
    bottom_padding: z.number().default(0.0),
    rows: z.array(RowSchema).default([]),
  })
);

// ─────────────────────────────────────────────
// Body children
// ─────────────────────────────────────────────

export const UnknownNodeSchema = z.object({
  _type: z.string().default(''),
}).passthrough();

export interface UnknownNode { _type: string; [key: string]: unknown; }

export const BodyChildSchema = z.union([
  ParagraphSchema,
  TableSchema,
  UnknownNodeSchema,
]);

export type BodyChild = Paragraph | Table | UnknownNode;

// ─────────────────────────────────────────────
// Section structure
// ─────────────────────────────────────────────

export const PageSetupSchema = z.object({
  paper_size: z.number().default(0),
  orientation: z.number().default(0),
  top_margin: z.number().default(0.0),
  bottom_margin: z.number().default(0.0),
  left_margin: z.number().default(0.0),
  right_margin: z.number().default(0.0),
  header_distance: z.number().default(0.0),
  footer_distance: z.number().default(0.0),
  page_width: z.number().default(0.0),
  page_height: z.number().default(0.0),
  page_number_style: z.number().default(0),
  page_starting_number: z.number().default(1),
  restart_page_numbering: z.boolean().default(false),
  section_start: z.number().default(0),
  different_first_page_header_footer: z.boolean().default(false),
  odd_and_even_pages_header_footer: z.boolean().default(false),
});

export interface PageSetup {
  paper_size: number; orientation: number; top_margin: number; bottom_margin: number;
  left_margin: number; right_margin: number; header_distance: number; footer_distance: number;
  page_width: number; page_height: number; page_number_style: number;
  page_starting_number: number; restart_page_numbering: boolean; section_start: number;
  different_first_page_header_footer: boolean; odd_and_even_pages_header_footer: boolean;
}

export const HeaderFooterSchema = z.object({
  _type: z.string().default(''),
  header_footer_type: z.number().nullable().default(null),
  paragraphs: z.array(ParagraphSchema).default([]),
  tables: z.array(TableSchema).default([]),
});

export interface HeaderFooter { _type: string; header_footer_type: number | null; paragraphs: Paragraph[]; tables: Table[]; }

export const BodySchema = z.object({
  _type: z.literal('Body').default('Body'),
  children: z.array(BodyChildSchema).default([]),
});

export interface Body { _type: 'Body'; children: BodyChild[]; }

export const SectionSchema = z.object({
  _type: z.literal('Section').default('Section'),
  page_setup: PageSetupSchema.default({}),
  body: BodySchema.default({}),
  headers_footers: z.array(HeaderFooterSchema).default([]),
});

export interface Section { _type: 'Section'; page_setup: PageSetup; body: Body; headers_footers: HeaderFooter[]; }

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

export const StyleSchema = z.object({
  name: z.string().default(''),
  type: z.number().default(0),
  is_heading: z.boolean().default(false),
  base_style_name: z.string().default(''),
  next_paragraph_style_name: z.string().default(''),
  paragraph_format: ParagraphFormatSchema.nullable().default(null),
  font: FontSchema.nullable().default(null),
});

export interface Style {
  name: string; type: number; is_heading: boolean; base_style_name: string;
  next_paragraph_style_name: string; paragraph_format: ParagraphFormat | null; font: Font | null;
}

// ─────────────────────────────────────────────
// Lists
// ─────────────────────────────────────────────

export const ListLevelSchema = z.object({
  number_format: z.string().default(''),
  number_style: z.number().default(0),
  start_at: z.number().default(1),
  alignment: z.number().default(0),
  number_position: z.number().default(0.0),
  text_position: z.number().default(0.0),
});

export interface ListLevel {
  number_format: string; number_style: number; start_at: number;
  alignment: number; number_position: number; text_position: number;
}

export const DocListSchema = z.object({
  list_id: z.number().default(0),
  is_multi_level: z.boolean().default(false),
  levels: z.array(ListLevelSchema).default([]),
});

export interface DocList { list_id: number; is_multi_level: boolean; levels: ListLevel[]; }

// ─────────────────────────────────────────────
// Root Document
// ─────────────────────────────────────────────

export const DocumentSchema = z.object({
  _type: z.literal('Document').default('Document'),
  default_tab_stop: z.number().default(36.0),
  page_color: z.string().default(''),
  page_count: z.number().default(0),
  styles: z.array(StyleSchema).default([]),
  lists: z.array(DocListSchema).default([]),
  sections: z.array(SectionSchema).default([]),
  header_paragraphs: z.array(ParagraphSchema).default([]),
  footer_paragraphs: z.array(ParagraphSchema).default([]),
});

export interface Document {
  _type: 'Document'; default_tab_stop: number; page_color: string; page_count: number;
  styles: Style[]; lists: DocList[]; sections: Section[];
  header_paragraphs: Paragraph[]; footer_paragraphs: Paragraph[];
}

// ─────────────────────────────────────────────
// Convenience helpers
// ─────────────────────────────────────────────

export function allParagraphs(doc: Document): Paragraph[] {
  const result: Paragraph[] = [];
  for (const sec of doc.sections) {
    for (const child of sec.body.children) {
      if (child._type === 'Paragraph') {
        result.push(child as Paragraph);
      }
    }
  }
  return result;
}

export function getAllTables(doc: Document): Table[] {
  const result: Table[] = [];
  for (const sec of doc.sections) {
    for (const child of sec.body.children) {
      if (child._type === 'Table') {
        result.push(child as Table);
      }
    }
  }
  return result;
}

export function getPlainText(doc: Document): string {
  return allParagraphs(doc)
    .filter(p => p._text)
    .map(p => p._text)
    .join('\n');
}

export function findStyle(doc: Document, name: string): Style | null {
  for (const s of doc.styles) {
    if (s.name === name) {
      return s;
    }
  }
  return null;
}

export function getHeadings(doc: Document, maxLevel: number = 9): Paragraph[] {
  return allParagraphs(doc).filter(
    p => p.paragraph_format.is_heading && p.paragraph_format.outline_level < maxLevel
  );
}

// ─────────────────────────────────────────────
// Factory helpers
// ─────────────────────────────────────────────

export function createDocument(overrides: Partial<Document> = {}): Document {
  return DocumentSchema.parse({
    _type: 'Document',
    default_tab_stop: 36.0,
    page_color: '',
    page_count: 0,
    styles: [],
    lists: [],
    sections: [],
    header_paragraphs: [],
    footer_paragraphs: [],
    ...overrides,
  });
}

export function createParagraph(overrides: Partial<Paragraph> = {}): Paragraph {
  return ParagraphSchema.parse({
    _type: 'Paragraph',
    paragraph_format: {},
    list_format: null,
    runs: [],
    inline_extras: [],
    content_sequence: [],
    _text: '',
    ...overrides,
  });
}

export function createRun(text: string = '', overrides: Partial<Run> = {}): Run {
  return RunSchema.parse({
    _type: 'Run',
    text,
    font: {},
    ...overrides,
  });
}

export function createSection(overrides: Partial<Section> = {}): Section {
  return SectionSchema.parse({
    _type: 'Section',
    page_setup: {},
    body: { _type: 'Body', children: [] },
    headers_footers: [],
    ...overrides,
  });
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

export const COLOR_EMPTY = 'Color [Empty]';

export function emptyBorders(): Border[] {
  return Array.from({ length: 6 }, () => ({
    line_style: 0,
    line_width: 0.0,
    color: COLOR_EMPTY,
  }));
}

export const PAGE_FIELD_SENTINEL = '\x00PAGE\x00';
