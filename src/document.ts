/**
 * Document class for tinyweb-office-words.
 *
 * Provides a Document class supporting .doc, .docx, .rtf, .txt, and .md input formats.
 *
 * Ported from Python's document.py
 */

import * as path from 'path';
import * as fs from 'fs';
import type { Document as LdmDocument } from './light-document-model';
import * as ldm from './light-document-model';
import { createReader } from './reader-factory';
import type { DocumentFormatReader } from './text-reader';
import { MarkdownSaveOptions, PdfSaveOptions } from './saving';
import { ConversionOptions } from './models';

/**
 * Document load format constants.
 */
export const LoadFormat = {
  AUTO: 'auto',
  DOC: 'doc',
  DOCX: 'docx',
  RTF: 'rtf',
  TEXT: 'text',
  MARKDOWN: 'markdown',
} as const;

export type LoadFormat = (typeof LoadFormat)[keyof typeof LoadFormat];

/**
 * Document save format constants.
 */
export const SaveFormat = {
  MARKDOWN: 'markdown',
  DOC: 'doc',
  DOCX: 'docx',
  TEXT: 'text',
  PDF: 'pdf',
} as const;

export type SaveFormat = (typeof SaveFormat)[keyof typeof SaveFormat];

/**
 * Represents a Word document.
 */
export class Document {
  private _document: LdmDocument | null = null;
  private _reader: DocumentFormatReader | null = null;

  /**
   * Initialize Document, loading from a file, stream, or bytes.
   */
  constructor(
    filepath?: string | null,
    options?: {
      stream?: Buffer;
      data?: Buffer;
    }
  ) {
    if (filepath) {
      const suffix = path.extname(filepath).toLowerCase();
      const reader = createReader(suffix);
      reader.loadFile(filepath);
      this._document = reader.toLightDocument();
      this._reader = reader;
    } else if (options?.stream) {
      const reader = createReader('.docx');
      reader.loadStream(options.stream);
      this._document = reader.toLightDocument();
      this._reader = reader;
    } else if (options?.data) {
      const reader = createReader('.docx');
      reader.loadBytes(options.data);
      this._document = reader.toLightDocument();
      this._reader = reader;
    }
  }

  /**
   * Access the internal Light Document Model.
   */
  get lightDocumentModel(): LdmDocument {
    if (this._document === null) {
      throw new Error('No document loaded. Provide a filepath to Document().');
    }
    return this._document;
  }

  /**
   * Extract plain text from the loaded document.
   */
  getText(): string {
    return ldm.getPlainText(this.lightDocumentModel);
  }

  /**
   * Save the document to the specified format.
   */
  save(
    outputPath: string,
    saveFormatOrOptions?: string | MarkdownSaveOptions | PdfSaveOptions
  ): void {
    const doc = this.lightDocumentModel;
    const resolvedPath = path.resolve(outputPath);
    const suffix = path.extname(resolvedPath).toLowerCase();

    if (saveFormatOrOptions instanceof MarkdownSaveOptions) {
      this._saveAsMarkdown(resolvedPath, doc, saveFormatOrOptions);
    } else if (saveFormatOrOptions instanceof PdfSaveOptions) {
      this._saveAsPdf(resolvedPath, doc, saveFormatOrOptions);
    } else if (saveFormatOrOptions === SaveFormat.MARKDOWN || suffix === '.md') {
      this._saveAsMarkdown(resolvedPath, doc);
    } else if (saveFormatOrOptions === SaveFormat.TEXT || suffix === '.txt') {
      this._saveAsText(resolvedPath, doc);
    } else if (saveFormatOrOptions === SaveFormat.PDF || suffix === '.pdf') {
      this._saveAsPdf(resolvedPath, doc);
    } else {
      throw new Error(
        `Unsupported save format: ${saveFormatOrOptions}. ` +
        `Supported formats: Markdown, Text, PDF.`
      );
    }
  }

  private _saveAsMarkdown(
    outputPath: string,
    doc: LdmDocument,
    options?: MarkdownSaveOptions
  ): void {
    const { LdmMarkdownWriter } = require('./md-writer');

    const conversionOpts = new ConversionOptions();
    if (options) {
      if (options.export_underline_formatting) {
        conversionOpts.export_underline = true;
      }
      conversionOpts.table_content_alignment = options.table_content_alignment;
      conversionOpts.list_export_mode = options.list_export_mode;
      conversionOpts.link_export_mode = options.link_export_mode;
      conversionOpts.export_as_html = options.export_as_html;
      conversionOpts.empty_paragraph_export_mode = options.empty_paragraph_export_mode;
      conversionOpts.export_images_as_base64 = options.export_images_as_base64;
      conversionOpts.images_folder = options.images_folder;
      conversionOpts.images_folder_alias = options.images_folder_alias;
    }

    const writer = new LdmMarkdownWriter(conversionOpts);
    const markdown = writer.write(doc, outputPath);

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, markdown, 'utf-8');
  }

  private _saveAsText(outputPath: string, doc: LdmDocument): void {
    const text = ldm.getPlainText(doc);
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, text, 'utf-8');
  }

  private _saveAsPdf(
    outputPath: string,
    doc: LdmDocument,
    options?: PdfSaveOptions
  ): void {
    const { LdmPdfWriter } = require('./pdf-writer');
    const writer = new LdmPdfWriter(options);
    writer.write(doc, outputPath);
  }
}
