/**
 * DOC (Word 97-2003) binary format reader package.
 * 
 * This is a stub implementation. Full DOC binary format parsing
 * requires OLE2 compound document reading via @ronomon/ole.
 */
import type { Document } from '../light-document-model';
import type { DocumentFormatReader } from '../text-reader';

export { DocFileReader };

class DocFileReader implements DocumentFormatReader {
  loadFile(_filepath: string): void {
    throw new Error('DOC binary format reader not yet implemented. Use DOCX format.');
  }

  loadStream(_data: Buffer): void {
    throw new Error('DOC binary format reader not yet implemented. Use DOCX format.');
  }

  loadBytes(_data: Buffer): void {
    throw new Error('DOC binary format reader not yet implemented. Use DOCX format.');
  }

  toLightDocument(): Document {
    throw new Error('DOC binary format reader not yet implemented. Use DOCX format.');
  }
}
