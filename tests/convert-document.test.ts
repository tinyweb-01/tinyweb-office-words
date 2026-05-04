/**
 * Tests for tinyweb-office-words
 * Ported from Python's ApiExamples and tests
 */
import * as path from 'path';
import * as fs from 'fs';
import { Document, SaveFormat } from '../src/document';
import { MarkdownSaveOptions, PdfSaveOptions, TableContentAlignment } from '../src/saving';

const DATA_DIR = path.join(__dirname, 'data', 'input');

describe('Document', () => {
  describe('Load and convert DOCX', () => {
    it('should load a simple DOCX and extract text', () => {
      const filepath = path.join(DATA_DIR, 'simple_inline.docx');
      if (!fs.existsSync(filepath)) {
        console.warn('Test fixture not found:', filepath);
        return;
      }
      const doc = new Document(filepath);
      const text = doc.getText();
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    });

    it('should load a full article DOCX and save as Markdown', () => {
      const filepath = path.join(DATA_DIR, 'test_full_article.docx');
      if (!fs.existsSync(filepath)) {
        console.warn('Test fixture not found:', filepath);
        return;
      }
      const doc = new Document(filepath);
      const outPath = path.join(__dirname, 'output', 'test_full_article.md');
      const outDir = path.dirname(outPath);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      doc.save(outPath, SaveFormat.MARKDOWN);
      expect(fs.existsSync(outPath)).toBe(true);
      const content = fs.readFileSync(outPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should load a DOCX and save as plain text', () => {
      const filepath = path.join(DATA_DIR, 'simple_inline.docx');
      if (!fs.existsSync(filepath)) {
        console.warn('Test fixture not found:', filepath);
        return;
      }
      const doc = new Document(filepath);
      const outPath = path.join(__dirname, 'output', 'simple_inline.txt');
      const outDir = path.dirname(outPath);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      doc.save(outPath, SaveFormat.TEXT);
      expect(fs.existsSync(outPath)).toBe(true);
    });

    it('should load a DOCX and save as PDF', () => {
      const filepath = path.join(DATA_DIR, 'simple_inline.docx');
      if (!fs.existsSync(filepath)) {
        console.warn('Test fixture not found:', filepath);
        return;
      }
      const doc = new Document(filepath);
      const outPath = path.join(__dirname, 'output', 'simple_inline.pdf');
      const outDir = path.dirname(outPath);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      doc.save(outPath, SaveFormat.PDF);
      expect(fs.existsSync(outPath)).toBe(true);
    });

    it('should convert with MarkdownSaveOptions', () => {
      const filepath = path.join(DATA_DIR, 'test_full_article.docx');
      if (!fs.existsSync(filepath)) {
        console.warn('Test fixture not found:', filepath);
        return;
      }
      const doc = new Document(filepath);
      const opts = new MarkdownSaveOptions();
      opts.table_content_alignment = TableContentAlignment.CENTER;
      opts.export_underline_formatting = true;

      const outPath = path.join(__dirname, 'output', 'test_md_opts.md');
      const outDir = path.dirname(outPath);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      doc.save(outPath, opts);
      expect(fs.existsSync(outPath)).toBe(true);
    });

    it('should convert with PdfSaveOptions', () => {
      const filepath = path.join(DATA_DIR, 'simple_inline.docx');
      if (!fs.existsSync(filepath)) {
        console.warn('Test fixture not found:', filepath);
        return;
      }
      const doc = new Document(filepath);
      const opts = new PdfSaveOptions();
      opts.jpeg_quality = 75;

      const outPath = path.join(__dirname, 'output', 'test_pdf_opts.pdf');
      const outDir = path.dirname(outPath);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      doc.save(outPath, opts);
      expect(fs.existsSync(outPath)).toBe(true);
    });
  });

  describe('Load Markdown', () => {
    it('should load a .md file and extract text', () => {
      const filepath = path.join(DATA_DIR, 'test_markdown.md');
      if (!fs.existsSync(filepath)) {
        console.warn('Test fixture not found:', filepath);
        return;
      }
      const doc = new Document(filepath);
      const text = doc.getText();
      expect(typeof text).toBe('string');
    });
  });

  describe('Load Plain Text', () => {
    it('should load a .txt file and extract text', () => {
      const filepath = path.join(DATA_DIR, 'test_plain.txt');
      if (!fs.existsSync(filepath)) {
        console.warn('Test fixture not found:', filepath);
        return;
      }
      const doc = new Document(filepath);
      const text = doc.getText();
      expect(typeof text).toBe('string');
    });
  });
});
