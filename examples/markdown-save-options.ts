/**
 * Example: Working with Markdown save options
 * Usage: npx ts-node examples/markdown-save-options.ts
 */
import { Document } from '../src';
import { MarkdownSaveOptions, TableContentAlignment, MarkdownLinkExportMode } from '../src/saving';

async function main() {
  const inputFile = process.argv[2] || 'tests/data/input/test_full_article.docx';

  console.log('tinyweb-office-words — MarkdownSaveOptions Example\n');
  const doc = new Document(inputFile);

  // Default options
  doc.save('output/default.md', 'markdown');
  console.log('Default markdown saved.');

  // Custom options
  const opts = new MarkdownSaveOptions();
  opts.table_content_alignment = TableContentAlignment.CENTER;
  opts.link_export_mode = MarkdownLinkExportMode.REFERENCE;
  opts.export_underline_formatting = true;

  doc.save('output/custom.md', opts);
  console.log('Custom markdown with options saved.');

  console.log('\nDone!');
}

main().catch(console.error);
