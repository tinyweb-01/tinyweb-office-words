/**
 * Data models for document conversion.
 * Ported from Python's models.py
 */

export enum HeadingStyle {
  ATX = 'atx',
  SETEXT = 'setext',
}

export enum ListMarker {
  DASH = '-',
  ASTERISK = '*',
  PLUS = '+',
}

export enum CodeBlockStyle {
  FENCED = 'fenced',
  INDENTED = 'indented',
}

/**
 * Options for controlling document to Markdown conversion.
 */
export class ConversionOptions {
  heading_style: HeadingStyle = HeadingStyle.ATX;
  list_marker: ListMarker = ListMarker.DASH;
  code_block_style: CodeBlockStyle = CodeBlockStyle.FENCED;
  export_underline: boolean = false;
  export_strikethrough: boolean = true;
  export_headers_footers: boolean = false;
  preserve_emphasis: boolean = true;
  table_pipe_style: boolean = true;
  wrap_width: number | null = null;
  escape_special_chars: boolean = true;
  table_content_alignment: string = 'auto';
  list_export_mode: string = 'markdown_syntax';
  link_export_mode: string = 'auto';
  export_as_html: string = 'none';
  empty_paragraph_export_mode: string = 'empty_line';
  export_images_as_base64: boolean = false;
  images_folder: string = '';
  images_folder_alias: string = '';
}

/**
 * Text run formatting properties.
 */
export class RunFormatting {
  bold: boolean = false;
  italic: boolean = false;
  underline: boolean = false;
  strikethrough: boolean = false;
  code: boolean = false;
  superscript: boolean = false;
  subscript: boolean = false;
}

/**
 * Information about a paragraph's style and context.
 */
export class ParagraphInfo {
  style_name: string = 'Normal';
  heading_level: number = 0;
  is_quote: boolean = false;
  quote_level: number = 0;
  is_list_item: boolean = false;
  list_level: number = 0;
  list_type: string = '';
  list_marker: string = '';
  is_code_block: boolean = false;
  code_language: string = '';
  alignment: string = 'left';
}

/**
 * Represents a table cell.
 */
export class TableCell {
  text: string = '';
  alignment: string = 'left';
  row_span: number = 1;
  col_span: number = 1;
  formatting: RunFormatting = new RunFormatting();
}

/**
 * Represents a table row.
 */
export class TableRow {
  cells: TableCell[] = [];
  is_header: boolean = false;
}

/**
 * Represents a table structure.
 */
export class SimpleTable {
  rows: TableRow[] = [];
  column_alignments: string[] = [];
}
