# tinyweb-office-words

A lightweight, open-source Node.js library for converting DOCX, DOC, RTF, TXT, and MD files to Markdown, plain text, and PDF without requiring Microsoft Word.

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.5-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **DOCX Support**: Pure Node.js reader using `adm-zip` and `fast-xml-parser`
- **DOC Support**: Word 97-2003 binary format reader (planned)
- **RTF Support**: Rich Text Format reader (planned, delegates to DOC)
- **Plain Text & Markdown Input**: Read `.txt` and `.md` files
- **Markdown Export**: Rich formatting — headings, bold/italic/strikethrough/underline, ordered and unordered lists (including nested), tables, block quotes, code blocks, and hyperlinks
- **PDF Export**: Generate PDF output via `pdfkit`
- **Plain Text Export**: Extract document text content

## Installation

```bash
npm install tinyweb-office-words
```

## Quick Start

### Convert a document to Markdown

```typescript
import { Document, SaveFormat } from 'tinyweb-office-words';

const doc = new Document('input.docx');  // or .doc, .rtf, .txt, .md
doc.save('output.md', SaveFormat.MARKDOWN);
```

### Export to PDF

```typescript
import { Document, SaveFormat } from 'tinyweb-office-words';

const doc = new Document('input.docx');
doc.save('output.pdf', SaveFormat.PDF);
```

### Extract plain text

```typescript
import { Document } from 'tinyweb-office-words';

const doc = new Document('input.docx');
const text = doc.getText();
```

### Save with options

```typescript
import { Document } from 'tinyweb-office-words';
import { MarkdownSaveOptions, PdfSaveOptions, TableContentAlignment } from 'tinyweb-office-words/saving';

const doc = new Document('input.docx');

const mdOpts = new MarkdownSaveOptions();
mdOpts.export_underline_formatting = true;
doc.save('output.md', mdOpts);

const pdfOpts = new PdfSaveOptions();
doc.save('output.pdf', pdfOpts);
```

## Requirements

- Node.js >= 18.0.0
- Dependencies: `adm-zip`, `fast-xml-parser`, `pdfkit`, `zod`

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

## License

MIT License - see the [LICENSE](LICENSE) file for details.
