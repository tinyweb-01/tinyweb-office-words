/**
 * RTF File Reader - Reads RTF files saved in OLE2/DOC binary format.
 *
 * Many RTF files produced by Microsoft Word are actually stored in the
 * Word 97-2003 binary format (OLE2). This reader delegates to DocFileReader
 * for parsing, providing transparent RTF support alongside DOC and DOCX.
 *
 * Ported from Python's rtf_reader.py
 */

import type { Document } from './light-document-model';
import type { DocumentFormatReader } from './text-reader';

export class RtfFileReader implements DocumentFormatReader {
  private _delegate: DocumentFormatReader;

  constructor() {
    // Lazy import to avoid circular dependency
    const { DocFileReader } = require('./doc-reader');
    this._delegate = new DocFileReader();
  }

  loadFile(filepath: string): void {
    this._delegate.loadFile(filepath);
  }

  loadStream(data: Buffer): void {
    this._delegate.loadStream(data);
  }

  loadBytes(data: Buffer): void {
    this._delegate.loadBytes(data);
  }

  toLightDocument(): Document {
    return this._delegate.toLightDocument();
  }
}
