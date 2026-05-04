/**
 * Plain-text and Markdown file readers.
 *
 * Provides TextFileReader (for .txt) and MarkdownFileReader (for .md) that
 * implement the same public interface as DocumentReader and DocFileReader,
 * producing a light_document_model.Document for the conversion pipeline.
 *
 * Ported from Python's text_reader.py
 */

import * as ldm from './light-document-model';
import type { Document, Paragraph, Run, Table, UnknownNode } from './light-document-model';

/**
 * Reader interface that all document format readers must implement.
 */
export interface DocumentFormatReader {
  loadFile(filepath: string): void;
  loadStream(data: Buffer): void;
  loadBytes(data: Buffer): void;
  toLightDocument(): Document;
}

/**
 * Reads plain-text (.txt) files and yields one Paragraph per line.
 */
export class TextFileReader implements DocumentFormatReader {
  private _text: string | null = null;

  loadFile(filepath: string): void {
    const fs = require('fs');
    this._text = fs.readFileSync(filepath, 'utf-8');
  }

  loadStream(data: Buffer): void {
    this._text = data.toString('utf-8');
  }

  loadBytes(data: Buffer): void {
    this._text = data.toString('utf-8');
  }

  toLightDocument(): Document {
    const doc = ldm.createDocument();
    const children: (Paragraph | Table | UnknownNode)[] = [];

    if (this._text !== null) {
      for (const line of this._text.split(/\r?\n/)) {
        const para = ldm.createParagraph();
        para._text = line;
        const run = ldm.createRun(line);
        para.runs = [run];
        children.push(para);
      }
    }

    const sec = ldm.createSection({ body: { _type: 'Body', children } });
    doc.sections = [sec];
    return doc;
  }
}

/**
 * Reads Markdown (.md) files and yields one Paragraph per blank-line-separated block.
 */
export class MarkdownFileReader implements DocumentFormatReader {
  private _text: string | null = null;

  loadFile(filepath: string): void {
    const fs = require('fs');
    this._text = fs.readFileSync(filepath, 'utf-8');
  }

  loadStream(data: Buffer): void {
    this._text = data.toString('utf-8');
  }

  loadBytes(data: Buffer): void {
    this._text = data.toString('utf-8');
  }

  toLightDocument(): Document {
    const doc = ldm.createDocument();
    const children: (Paragraph | Table | UnknownNode)[] = [];

    if (this._text !== null) {
      const lines = this._text.split(/\r?\n/);
      let block: string[] = [];

      for (const line of lines) {
        if (line.trim() === '') {
          if (block.length > 0) {
            const para = ldm.createParagraph();
            const blockText = block.join('\n');
            para._text = blockText;
            const run = ldm.createRun(blockText);
            para.runs = [run];
            children.push(para);
            block = [];
          }
        } else {
          block.push(line);
        }
      }

      if (block.length > 0) {
        const para = ldm.createParagraph();
        const blockText = block.join('\n');
        para._text = blockText;
        const run = ldm.createRun(blockText);
        para.runs = [run];
        children.push(para);
      }
    }

    const sec = ldm.createSection({ body: { _type: 'Body', children } });
    doc.sections = [sec];
    return doc;
  }
}
