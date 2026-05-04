/**
 * Data classes for DOCX document elements.
 * Ported from Python's docx_reader/data_classes.py
 */

export class RunData {
  text: string = '';
  bold: boolean = false;
  italic: boolean = false;
  underline: boolean = false;
  strikethrough: boolean = false;
  style_name: string = '';
  is_code_style: boolean = false;
}

export class ParagraphData {
  text: string = '';
  style_name: string = 'Normal';
  runs: RunData[] = [];
  is_list_item: boolean = false;
  list_level: number = 0;
  list_id: number | null = null;
  alignment: string = 'left';
  has_bottom_border: boolean = false;
  border_size: number = 0;
}

export class CellData {
  paragraphs: ParagraphData[] = [];
  alignment: string = 'left';
}

export class RowData {
  cells: CellData[] = [];
}

export class TableData {
  rows: RowData[] = [];
}

export class NumberingLevel {
  format: string = 'bullet';
  start: number = 1;
  text: string = '';
}

export class NumberingInfo {
  num_id: number;
  abstract_num_id: number;
  levels: Map<number, NumberingLevel> = new Map();

  constructor(numId: number, abstractNumId: number) {
    this.num_id = numId;
    this.abstract_num_id = abstractNumId;
  }
}
