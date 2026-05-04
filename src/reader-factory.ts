/**
 * Reader factory for document format readers.
 *
 * Provides a factory function that returns the appropriate reader
 * for a given file extension.
 *
 * Ported from Python's reader_factory.py
 */

import type { DocumentFormatReader } from './text-reader';
import { TextFileReader, MarkdownFileReader } from './text-reader';

export function createReader(suffix: string): DocumentFormatReader {
  switch (suffix) {
    case '.md':
      return new MarkdownFileReader();
    case '.txt':
      return new TextFileReader();
    case '.doc': {
      const { DocFileReader } = require('./doc-reader');
      return new DocFileReader();
    }
    case '.rtf': {
      const { RtfFileReader } = require('./rtf-reader');
      return new RtfFileReader();
    }
    default: {
      const { DocumentReader } = require('./docx-reader');
      return new DocumentReader();
    }
  }
}
