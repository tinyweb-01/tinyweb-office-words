/**
 * Markdown writer operating on the light document model.
 *
 * Converts an ldm.Document into a Markdown string.
 *
 * Ported from Python's md_writer.py
 */

import * as path from 'path';
import * as fs from 'fs';
import * as ldm from './light-document-model';
import type { Document, Paragraph, Run, Table, ShapeNode, Cell, Style, ListLevel } from './light-document-model';
import { ConversionOptions, RunFormatting, HeadingStyle } from './models';

const ALIGN_STR: Record<number, string> = { 0: 'left', 1: 'center', 2: 'right', 3: 'left' };

export class LdmMarkdownWriter {
  private options: ConversionOptions;
  private _listCounters: Map<string, number> = new Map();
  private _doc: Document | null = null;
  private _outputPath: string | null = null;
  private _imageCounter: number = 0;
  private _referenceLinks: [string, string][] = [];

  private static readonly LIST = 'list';
  private static readonly BLOCK = 'block';
  private static readonly BLANK = 'blank';

  constructor(options?: ConversionOptions) {
    this.options = options || new ConversionOptions();
  }

  // ------------------------------------------------------------------
  // Public entry point
  // ------------------------------------------------------------------

  write(doc: Document, outputPath?: string): string {
    this._listCounters.clear();
    this._referenceLinks = [];
    this._imageCounter = 0;
    this._doc = doc;
    this._outputPath = outputPath || null;
    const blocks: [string, string][] = [];

    // Header images
    for (const para of doc.header_paragraphs) {
      for (const item of para.inline_extras) {
        if (item._type === 'Shape' && (item as ShapeNode).has_image && (item as ShapeNode).image_data) {
          blocks.push([LdmMarkdownWriter.BLOCK, this.renderImage(item as ShapeNode)]);
        }
      }
    }

    // Body
    for (const section of doc.sections) {
      for (const child of section.body.children) {
        if (child._type === 'Paragraph') {
          const [tag, md] = this.convertParagraphTagged(child as Paragraph);
          if (md !== null && md !== undefined) {
            blocks.push([tag, md]);
          }
        } else if (child._type === 'Table') {
          const md = this.convertTable(child as Table);
          blocks.push([LdmMarkdownWriter.BLOCK, md]);
        }
      }
    }

    // Footer images
    for (const para of doc.footer_paragraphs) {
      for (const item of para.inline_extras) {
        if (item._type === 'Shape' && (item as ShapeNode).has_image && (item as ShapeNode).image_data) {
          blocks.push([LdmMarkdownWriter.BLOCK, this.renderImage(item as ShapeNode)]);
        }
      }
    }

    let result = this.joinBlocks(blocks);

    // Append reference-style link definitions
    if (this._referenceLinks.length > 0) {
      const defs = this._referenceLinks.map(([label, url]) => `[${label}]: ${url}`).join('\n');
      result = result.replace(/\n+$/, '') + '\n\n' + defs + '\n';
    }

    return result;
  }

  // ------------------------------------------------------------------
  // Block joining
  // ------------------------------------------------------------------

  private joinBlocks(blocks: [string, string][]): string {
    const result: string[] = [];
    let prevTag: string | null = null;

    for (const [tag, text] of blocks) {
      if (!text.trim()) {
        if (prevTag !== LdmMarkdownWriter.BLANK) {
          result.push('');
          prevTag = LdmMarkdownWriter.BLANK;
        }
        continue;
      }

      let needBlank = false;
      if (prevTag !== null && prevTag !== LdmMarkdownWriter.BLANK) {
        if (tag === LdmMarkdownWriter.LIST && prevTag === LdmMarkdownWriter.LIST) {
          needBlank = false;
        } else {
          needBlank = true;
        }
      }

      if (needBlank) {
        result.push('');
      }
      result.push(text);
      prevTag = tag;
    }

    const output = result.join('\n');
    return output ? output.replace(/\n+$/, '') + '\n' : '';
  }

  // ------------------------------------------------------------------
  // Image rendering
  // ------------------------------------------------------------------

  renderImage(shape: ShapeNode): string {
    const img = shape.image_data;
    if (!img) return '';

    if (this.options.images_folder && !this.options.export_images_as_base64) {
      this._imageCounter++;
      const ext = this.guessImageExtension(img.content_type, img.source_filename);
      let filename = img.source_filename ? path.basename(img.source_filename) : '';
      filename = filename || `image${this._imageCounter}${ext}`;
      const folder = this.options.images_folder;
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
      }
      const filepath = path.join(folder, filename);
      fs.writeFileSync(filepath, img.image_bytes);

      let url: string;
      if (this.options.images_folder_alias) {
        url = `${this.options.images_folder_alias.replace(/\/$/, '')}/${filename}`;
      } else if (this._outputPath) {
        url = path.relative(path.dirname(this._outputPath), filepath);
      } else {
        url = filepath;
      }
      return `![${img.source_filename}](${url})`;
    }

    // Default: inline base64 data URI
    const b64 = img.image_bytes.toString('base64');
    return `![${img.source_filename}](data:${img.content_type};base64,${b64})`;
  }

  private guessImageExtension(contentType: string, fileName: string): string {
    if (fileName && fileName.includes('.')) return '';
    const mimeMap: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/gif': '.gif',
      'image/bmp': '.bmp',
      'image/svg+xml': '.svg',
      'image/tiff': '.tiff',
    };
    return mimeMap[contentType] || '.png';
  }

  // ------------------------------------------------------------------
  // Paragraph conversion
  // ------------------------------------------------------------------

  private isListParagraph(para: Paragraph): boolean {
    return !!(para.list_format && para.list_format.is_list_item);
  }

  private convertParagraphTagged(para: Paragraph): [string, string | null] {
    const isList = this.isListParagraph(para);
    const tag = isList && this.options.list_export_mode !== 'plain_text'
      ? LdmMarkdownWriter.LIST
      : LdmMarkdownWriter.BLOCK;
    const md = this.convertParagraph(para);
    return [tag, md];
  }

  private convertParagraph(para: Paragraph): string | null {
    const pf = para.paragraph_format;
    const styleName = pf.style_name;

    // Horizontal rule takes precedence
    if (this.isHorizontalRule(para)) {
      return '---';
    }

    // Handle empty paragraphs
    if (this.isEmptyParagraph(para)) {
      const mode = this.options.empty_paragraph_export_mode;
      if (mode === 'none') return null;
      if (mode === 'markdown_hard_line_break') return '\\';
      return '';
    }

    const isCodeBlock = !!(styleName && (styleName.includes('Code') || styleName.includes('code')));

    // Check for images in content_sequence
    if (para.content_sequence.some(i => i._type === 'Shape')) {
      const outputParts: string[] = [];
      const pendingRuns: Run[] = [];

      const flushRuns = () => {
        if (pendingRuns.length === 0) return;
        const text = this.convertRuns(pendingRuns, isCodeBlock, para);
        pendingRuns.length = 0;
        if (text) {
          const formatted = this.formatTextPart(text, pf, styleName, isCodeBlock, para);
          if (formatted !== null && formatted !== undefined) {
            outputParts.push(formatted);
          }
        }
      };

      for (const item of para.content_sequence) {
        if (item._type === 'Shape') {
          const shape = item as ShapeNode;
          if (shape.has_image && shape.image_data) {
            flushRuns();
            outputParts.push(this.renderImage(shape));
          }
        } else if (item._type === 'Run') {
          pendingRuns.push(item as Run);
        }
      }
      flushRuns();

      if (outputParts.length === 0) return '';
      return outputParts.join('\n');
    }

    // Legacy path: no content_sequence images
    const imageParts = para.inline_extras
      .filter(i => i._type === 'Shape' && (i as ShapeNode).has_image && (i as ShapeNode).image_data)
      .map(i => this.renderImage(i as ShapeNode));

    const text = this.convertRuns(para.runs, isCodeBlock, para);
    const textPart = text ? this.formatTextPart(text, pf, styleName, isCodeBlock, para) : null;

    const parts = [...imageParts];
    if (textPart !== null && textPart !== undefined) {
      parts.push(textPart);
    }

    if (parts.length === 0) return '';
    return parts.join('\n');
  }

  private formatTextPart(
    text: string,
    pf: ldm.ParagraphFormat,
    styleName: string,
    isCodeBlock: boolean,
    para: Paragraph
  ): string | null {
    if (!text) return null;

    if (pf.is_heading) {
      const level = Math.min(pf.outline_level + 1, 6);
      return this.formatHeading(text, level, styleName);
    }
    if (isCodeBlock) {
      const lang = this.extractCodeLanguage(styleName);
      return this.formatCodeBlock(text, lang, styleName);
    }
    if (styleName && styleName.includes('Quote')) {
      const level = this.extractQuoteLevel(styleName);
      return this.formatQuote(text, level);
    }
    if (para.list_format && para.list_format.is_list_item) {
      return this.formatListItem(text, para);
    }
    return text;
  }

  // ------------------------------------------------------------------
  // Empty / HR detection
  // ------------------------------------------------------------------

  private isEmptyParagraph(para: Paragraph): boolean {
    if (para.runs.some(r => r.text && r.text.trim())) return false;
    if (para.content_sequence.some(i => i._type === 'Shape')) return false;
    if (para.inline_extras.some(i => i._type === 'Shape' && (i as ShapeNode).has_image)) return false;
    const text = para._text ? para._text.trim() : '';
    return !text;
  }

  private isHorizontalRule(para: Paragraph): boolean {
    const pf = para.paragraph_format;

    if (pf.borders.length >= 3) {
      const bottom = pf.borders[2];
      if (bottom.line_style > 0 && bottom.line_width >= 1.5) {
        return true;
      }
    }

    const text = (para._text || '').trim();
    if (/^[-*_]{3,}$/.test(text.replace(/\s/g, ''))) {
      return true;
    }

    return false;
  }

  // ------------------------------------------------------------------
  // Run conversion
  // ------------------------------------------------------------------

  private convertRuns(runs: Run[], isCodeBlock: boolean, para?: Paragraph): string {
    const [styleBold, styleItalic] = this.getStyleEmphasis(para);

    const parts = runs.map(run => {
      const text = run.text || '';
      if (!text) return '';
      const fmt = this.getRunFormatting(run);
      if (styleBold && fmt.bold) fmt.bold = false;
      if (styleItalic && fmt.italic) fmt.italic = false;
      return this.applyFormatting(text, fmt, isCodeBlock);
    });

    let result = parts.join('');

    if (this.options.link_export_mode === 'reference') {
      result = this.convertLinksToReference(result);
    }

    return result;
  }

  private getStyleEmphasis(para?: Paragraph): [boolean, boolean] {
    if (!para || !this._doc) return [false, false];
    const styleName = para.paragraph_format.style_name;
    if (!styleName) return [false, false];
    const style = this._doc.styles.find(s => s.name === styleName);
    if (!style || !style.font) return [false, false];
    return [style.font.bold, style.font.italic];
  }

  private convertLinksToReference(text: string): string {
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, url) => {
      const refNum = this._referenceLinks.length + 1;
      this._referenceLinks.push([String(refNum), url]);
      return `[${label}][${refNum}]`;
    });
  }

  private getRunFormatting(run: Run): RunFormatting {
    const f = run.font;
    const fmt = new RunFormatting();
    fmt.bold = f.bold;
    fmt.italic = f.italic;
    fmt.underline = f.underline > 0;
    fmt.strikethrough = f.strike_through;
    fmt.code = !!(f.style_name && f.style_name.toLowerCase().includes('code'));
    return fmt;
  }

  private applyFormatting(text: string, fmt: RunFormatting, isCodeBlock: boolean): string {
    if (!text) return text;

    if (fmt.code) {
      return `\`${text}\``;
    }

    let result = text;

    if (fmt.bold && fmt.italic) {
      result = `***${result}***`;
    } else if (fmt.bold) {
      result = `**${result}**`;
    } else if (fmt.italic) {
      result = `*${result}*`;
    }

    if (fmt.strikethrough && this.options.export_strikethrough) {
      result = `~~${result}~~`;
    }

    if (fmt.underline && this.options.export_underline) {
      result = `++${result}++`;
    }

    return result;
  }

  // ------------------------------------------------------------------
  // Heading
  // ------------------------------------------------------------------

  private formatHeading(text: string, level: number, styleName: string): string {
    const clampedLevel = Math.min(Math.max(level, 1), 6);
    const useSetext = this.options.heading_style === HeadingStyle.SETEXT || styleName.includes('Setext');

    if (useSetext && clampedLevel <= 2) {
      const underline = clampedLevel === 1 ? '=' : '-';
      return `${text}\n${underline.repeat(text.length)}`;
    }
    return `${'#'.repeat(clampedLevel)} ${text}`;
  }

  // ------------------------------------------------------------------
  // Code block
  // ------------------------------------------------------------------

  private extractCodeLanguage(styleName: string): string {
    if (styleName.includes('.')) {
      return styleName.split('.').pop() || '';
    }
    return '';
  }

  private formatCodeBlock(text: string, language: string, styleName: string = ''): string {
    const isIndented = this.options.code_block_style === 'indented' || styleName.toLowerCase().includes('indented');
    if (!isIndented) {
      const langSpec = language.toLowerCase();
      return `\`\`\`${langSpec}\n${text}\n\`\`\``;
    }
    return text.split('\n').map(line => `    ${line}`).join('\n');
  }

  // ------------------------------------------------------------------
  // Block quote
  // ------------------------------------------------------------------

  private extractQuoteLevel(styleName: string): number {
    const match = styleName.match(/Quote(\d+)?/);
    if (match && match[1]) return parseInt(match[1], 10);
    return 1;
  }

  private formatQuote(text: string, level: number): string {
    const prefix = '> '.repeat(level);
    return text.split('\n').map(line => `${prefix}${line}`).join('\n');
  }

  // ------------------------------------------------------------------
  // List item
  // ------------------------------------------------------------------

  private formatListItem(text: string, para: Paragraph): string {
    const lf = para.list_format!;
    const level = lf.list_level_number;
    const listId = lf.list_id;

    if (this.options.list_export_mode === 'plain_text') {
      const indent = '    '.repeat(level);
      return `${indent}${text}`;
    }

    const [, marker] = this.getListType(listId, level);
    const indent = '  '.repeat(level);
    return `${indent}${marker} ${text}`;
  }

  private getListType(listId: number, level: number): [string, string] {
    if (this._doc && listId > 0) {
      for (const dl of this._doc.lists) {
        if (dl.list_id === listId) {
          let ll: ListLevel;
          if (level < dl.levels.length) {
            ll = dl.levels[level];
          } else if (dl.levels.length > 0) {
            ll = dl.levels[0];
          } else {
            return ['bullet', this.options.list_marker];
          }

          if (ll.number_style !== 23 && ll.number_style !== 255) {
            return this.getOrderedMarker(listId, level, ll.start_at);
          } else {
            return ['bullet', this.options.list_marker];
          }
        }
      }
    }
    return ['bullet', this.options.list_marker];
  }

  private getOrderedMarker(listId: number, level: number, start: number): [string, string] {
    const key = `${listId}:${level}`;
    if (!this._listCounters.has(key)) {
      this._listCounters.set(key, start);
    } else {
      this._listCounters.set(key, this._listCounters.get(key)! + 1);
    }
    const num = this._listCounters.get(key)!;
    return ['ordered', `${num}.`];
  }

  // ------------------------------------------------------------------
  // Table conversion
  // ------------------------------------------------------------------

  private convertTable(table: Table): string {
    if (!table.rows.length) return '';

    if (this.options.export_as_html === 'tables') {
      return this.convertTableAsHtml(table);
    }

    const numCols = Math.max(...table.rows.map(row => row.cells.length));

    // Extract cell texts and alignments
    const cellData: [string, string][][] = table.rows.map(row =>
      row.cells.map(cell => [this.extractCellText(cell), this.resolveCellAlignment(cell)] as [string, string])
    );

    // Column widths
    const colWidths = Array(numCols).fill(3);
    for (const rowCells of cellData) {
      for (let j = 0; j < rowCells.length && j < numCols; j++) {
        colWidths[j] = Math.max(colWidths[j], rowCells[j][0].length);
      }
    }

    // Render rows
    const lines: string[] = [];
    for (let i = 0; i < cellData.length; i++) {
      const rowCells = cellData[i];
      const cells: string[] = [];
      for (let j = 0; j < numCols; j++) {
        const text = j < rowCells.length ? rowCells[j][0] : '';
        cells.push(text.padEnd(colWidths[j]));
      }
      lines.push('| ' + cells.join(' | ') + ' |');

      if (i === 0) {
        const seps: string[] = [];
        for (let j = 0; j < numCols; j++) {
          const width = colWidths[j];
          const align = j < rowCells.length ? rowCells[j][1] : 'left';
          if (align === 'center') {
            seps.push(':' + '-'.repeat(width - 2) + ':');
          } else if (align === 'right') {
            seps.push('-'.repeat(width - 1) + ':');
          } else {
            seps.push('-'.repeat(width));
          }
        }
        lines.push('| ' + seps.join(' | ') + ' |');
      }
    }

    return lines.join('\n');
  }

  private extractCellText(cell: Cell): string {
    const parts: string[] = [];

    for (const para of cell.paragraphs) {
      if (para.content_sequence.length > 0) {
        const paraParts: string[] = [];
        for (const item of para.content_sequence) {
          if (item._type === 'Shape' && (item as ShapeNode).has_image && (item as ShapeNode).image_data) {
            paraParts.push(this.renderImage(item as ShapeNode));
          } else if (item._type === 'Run') {
            const run = item as Run;
            const text = run.text || '';
            if (text) {
              const fmt = this.getRunFormatting(run);
              paraParts.push(this.applyFormatting(text, fmt, false));
            }
          }
        }
        if (paraParts.length > 0) {
          parts.push(paraParts.join(''));
        }
      } else {
        for (const item of para.inline_extras) {
          if (item._type === 'Shape' && (item as ShapeNode).has_image && (item as ShapeNode).image_data) {
            parts.push(this.renderImage(item as ShapeNode));
          }
        }
        const runParts: string[] = [];
        for (const run of para.runs) {
          const text = run.text || '';
          if (text) {
            const fmt = this.getRunFormatting(run);
            runParts.push(this.applyFormatting(text, fmt, false));
          }
        }
        if (runParts.length > 0) {
          parts.push(runParts.join(''));
        }
      }
    }

    let result = parts.join(' ');
    result = result.replace(/\|/g, '\\|');
    result = result.replace(/[\n\r]/g, ' ');
    return result.trim();
  }

  private cellAlignment(cell: Cell): string {
    if (cell.paragraphs.length > 0) {
      const a = cell.paragraphs[0].paragraph_format.alignment;
      return ALIGN_STR[a] || 'left';
    }
    return 'left';
  }

  private resolveCellAlignment(cell: Cell): string {
    const override = this.options.table_content_alignment;
    if (override && override !== 'auto') {
      return override;
    }
    return this.cellAlignment(cell);
  }

  private convertTableAsHtml(table: Table): string {
    const lines: string[] = ['<table>'];
    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];
      lines.push('<tr>');
      const tag = i === 0 ? 'th' : 'td';
      for (const cell of row.cells) {
        const text = this.escapeHtml(this.extractCellText(cell));
        const align = this.resolveCellAlignment(cell);
        if (align !== 'left') {
          lines.push(`<${tag} style="text-align: ${align}">${text}</${tag}>`);
        } else {
          lines.push(`<${tag}>${text}</${tag}>`);
        }
      }
      lines.push('</tr>');
    }
    lines.push('</table>');
    return lines.join('\n');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }
}
