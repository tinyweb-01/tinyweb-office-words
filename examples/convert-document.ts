/**
 * Example: Convert a document to all formats
 * Usage: npx ts-node examples/convert-document.ts
 */
import { Document, SaveFormat } from '../src';

async function main() {
  console.log('tinyweb-office-words — Document Conversion Example\n');

  const inputFile = process.argv[2] || 'tests/data/input/simple_inline.docx';
  console.log(`Loading: ${inputFile}`);

  const doc = new Document(inputFile);

  console.log(`Text preview: ${doc.getText().substring(0, 200)}...\n`);

  // Save as Markdown
  doc.save('output/example.md', SaveFormat.MARKDOWN);
  console.log('Saved: output/example.md');

  // Save as plain text
  doc.save('output/example.txt', SaveFormat.TEXT);
  console.log('Saved: output/example.txt');

  // Save as PDF
  doc.save('output/example.pdf', SaveFormat.PDF);
  console.log('Saved: output/example.pdf');

  console.log('\nDone!');
}

main().catch(console.error);
