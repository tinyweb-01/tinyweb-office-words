/**
 * Specialized converters for different document elements.
 * Ported from Python's converters/ package.
 */

import * as ldm from '../light-document-model';
import type { Paragraph, Table, Document } from '../light-document-model';
import { ConversionOptions } from '../models';

/**
 * Handles list numbering and counter management.
 */
export class ListHandler {
  private counters: Map<string, number> = new Map();

  reset(): void {
    this.counters.clear();
  }

  getNextNumber(listId: number, level: number, start: number = 1): number {
    const key = `${listId}:${level}`;
    if (!this.counters.has(key)) {
      this.counters.set(key, start);
    } else {
      this.counters.set(key, this.counters.get(key)! + 1);
    }
    return this.counters.get(key)!;
  }
}

/**
 * Converts paragraphs to Markdown.
 */
export class ParagraphConverter {
  private options: ConversionOptions;
  private listHandler: ListHandler;

  constructor(options: ConversionOptions, listHandler: ListHandler) {
    this.options = options;
    this.listHandler = listHandler;
  }

  convert(para: Paragraph): string {
    return para._text || '';
  }
}

/**
 * Converts tables to Markdown.
 */
export class TableConverter {
  private options: ConversionOptions;

  constructor(options: ConversionOptions) {
    this.options = options;
  }

  convert(table: Table): string {
    if (!table.rows.length) return '';

    const numCols = Math.max(...table.rows.map(row => row.cells.length));
    const lines: string[] = [];

    // Header row
    if (table.rows.length > 0) {
      const cells = table.rows[0].cells.map(c => this.extractText(c));
      while (cells.length < numCols) cells.push('');
      lines.push('| ' + cells.join(' | ') + ' |');

      const seps = Array(numCols).fill('---');
      lines.push('| ' + seps.join(' | ') + ' |');
    }

    // Data rows
    for (let i = 1; i < table.rows.length; i++) {
      const cells = table.rows[i].cells.map(c => this.extractText(c));
      while (cells.length < numCols) cells.push('');
      lines.push('| ' + cells.join(' | ') + ' |');
    }

    return lines.join('\n');
  }

  private extractText(cell: ldm.Cell): string {
    return cell.paragraphs.map(p => p._text || '').join(' ').replace(/\|/g, '\\|');
  }
}
