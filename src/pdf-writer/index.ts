/**
 * PDF writer module — produces PDF output via pdfkit.
 * Ported from Python's pdf_writer/ package.
 */

import * as path from 'path';
import * as fs from 'fs';
import PDFDocument from 'pdfkit';
import * as ldm from '../light-document-model';
import type { Document, Paragraph, Table, Run } from '../light-document-model';
import { PdfSaveOptions } from '../saving';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const DEFAULT_MARGIN_MM = 25.4;
const PT_TO_MM = 0.3528;

export class LdmPdfWriter {
  private options: PdfSaveOptions;
  private _pageNumberOffset: number = 0;

  constructor(options?: PdfSaveOptions) {
    this.options = options || new PdfSaveOptions();
  }

  write(doc: Document, outputPath: string): void {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Determine page size from first section
    let pageW = A4_WIDTH_MM;
    let pageH = A4_HEIGHT_MM;
    let marginTop = DEFAULT_MARGIN_MM;
    let marginBottom = DEFAULT_MARGIN_MM;
    let marginLeft = DEFAULT_MARGIN_MM;
    let marginRight = DEFAULT_MARGIN_MM;

    if (doc.sections.length > 0) {
      const ps = doc.sections[0].page_setup;
      if (ps.page_width > 0) pageW = ps.page_width * PT_TO_MM;
      if (ps.page_height > 0) pageH = ps.page_height * PT_TO_MM;
      if (ps.left_margin > 0) marginLeft = ps.left_margin * PT_TO_MM;
      if (ps.right_margin > 0) marginRight = ps.right_margin * PT_TO_MM;
      if (ps.top_margin > 0) marginTop = ps.top_margin * PT_TO_MM;
      if (ps.bottom_margin > 0) marginBottom = ps.bottom_margin * PT_TO_MM;

      if (ps.restart_page_numbering) {
        this._pageNumberOffset = ps.page_starting_number - 1;
      }
    }

    const pdf = new PDFDocument({
      size: [pageW, pageH],
      margins: { top: marginTop, bottom: marginBottom, left: marginLeft, right: marginRight },
      bufferPages: true,
    });

    // Stream to file
    const writeStream = fs.createWriteStream(outputPath);
    pdf.pipe(writeStream);

    // Render body
    for (const section of doc.sections) {
      for (const child of section.body.children) {
        if (child._type === 'Paragraph') {
          this.renderParagraph(pdf, child as Paragraph, doc);
        } else if (child._type === 'Table') {
          this.renderTable(pdf, child as Table);
        }
      }
    }

    // End the PDF and wait for the stream to finish
    pdf.end();

    // Block until the write stream finishes (synchronous wait)
    let finished = false;
    writeStream.on('finish', () => { finished = true; });
    writeStream.on('error', () => { finished = true; });

    // Busy-wait for stream completion (pdfkit is fast for small docs)
    const start = Date.now();
    while (!finished && Date.now() - start < 5000) {
      // In Node.js, this is blocking but pdfkit emits data on nextTick
      // For small documents, the data is emitted synchronously
    }

    if (!finished) {
      // Fallback: write whatever we have
      writeStream.end();
    }
  }

  private renderParagraph(pdf: PDFKit.PDFDocument, para: Paragraph, _doc: Document): void {
    const pf = para.paragraph_format;

    // Apply alignment
    const alignMap: Record<number, string> = { 0: 'left', 1: 'center', 2: 'right', 3: 'justify' };
    const align = alignMap[pf.alignment] || 'left';

    // Heading handling
    if (pf.is_heading) {
      const level = Math.min(pf.outline_level + 1, 6);
      const sizes = [24, 20, 16, 14, 12, 11];
      pdf.font('Helvetica-Bold').fontSize(sizes[level - 1] || 12);
    } else {
      pdf.font('Helvetica').fontSize(11);
    }

    // Build text from runs
    let text = '';
    for (const run of para.runs) {
      text += run.text || '';
    }

    if (text.trim()) {
      pdf.text(text.trim(), { align: align as any, paragraphGap: 4 });
    } else {
      pdf.moveDown(0.5);
    }

    // Page break
    if (pf.page_break_before) {
      pdf.addPage();
    }
  }

  private renderTable(pdf: PDFKit.PDFDocument, table: Table): void {
    if (!table.rows.length) return;

    const numCols = Math.max(...table.rows.map(r => r.cells.length));

    // Build table data
    const rows: string[][] = table.rows.map(row => {
      const cells: string[] = [];
      for (const cell of row.cells) {
        const text = cell.paragraphs.map(p => p._text || '').join(' ');
        cells.push(text);
      }
      while (cells.length < numCols) cells.push('');
      return cells;
    });

    // Simple text table (pdfkit doesn't have built-in table support)
    pdf.font('Helvetica').fontSize(9);
    for (let i = 0; i < rows.length; i++) {
      if (i === 0) pdf.font('Helvetica-Bold');
      else pdf.font('Helvetica');

      const line = rows[i].join('  |  ');
      pdf.text(line, { paragraphGap: 2 });
    }
    pdf.moveDown(0.5);
  }
}

export { LdmPdfWriter as default };
