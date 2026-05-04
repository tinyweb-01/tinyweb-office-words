/**
 * Core DocumentReader class for DOCX parsing.
 * Reads DOCX documents using adm-zip and fast-xml-parser.
 * Ported from Python's docx_reader/document_reader.py + ldm_builder.py + shapes.py
 */

import * as path from 'path';
import * as fs from 'fs';
import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';
import * as ldm from '../light-document-model';
import type { Document, Paragraph, Table, ShapeNode, Run, Font, ParagraphFormat, Style, DocList, ListLevel, PageSetup, Row, Cell } from '../light-document-model';
import * as consts from './constants';
import { ParagraphData, RunData, CellData, RowData, TableData, NumberingLevel, NumberingInfo } from './data-classes';
import { canonicalizeStyleName, hexToColor, collectRunText, extToContentType, applyThemeColorModifiers, emptyBorders } from './utils';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
  parseAttributeValue: false,
  ignoreDeclaration: true,
});

export class DocumentReader {
  private _documentData: any = null;
  private _numberingData: any = null;
  private _stylesData: any = null;
  private _numberingCache: Map<number, NumberingInfo> = new Map();
  private _rels: Map<string, string> = new Map();
  private _styleIdToName: Map<string, string> = new Map();
  private _media: Map<string, Buffer> = new Map();
  private _docImageRels: Map<string, string> = new Map();
  private _themeFonts: Map<string, string> = new Map();
  private _themeColors: Map<string, string> = new Map();
  private _docDefaultRPr: any = null;
  private _docDefaultPPr: any = null;
  private _styleElemCache: Map<string, any> = new Map();
  private _nameToStyleId: Map<string, string> = new Map();
  private _currentPageSetup: PageSetup | null = null;
  private _anchorYBaseMode: string = 'body';
  private _firstBodyPageActive: boolean = true;

  loadFile(filepath: string): void {
    const zip = new AdmZip(filepath);
    this.loadFromZip(zip);
  }

  loadStream(data: Buffer): void {
    const zip = new AdmZip(data);
    this.loadFromZip(zip);
  }

  loadBytes(data: Buffer): void {
    const zip = new AdmZip(data);
    this.loadFromZip(zip);
  }

  private loadFromZip(zip: AdmZip): void {
    const entries = zip.getEntries();
    const nameSet = new Set(entries.map(e => e.entryName));

    // Load media files
    for (const entry of entries) {
      if (entry.entryName.startsWith('word/media/')) {
        this._media.set(entry.entryName, entry.getData());
      }
    }

    // Parse document.xml
    const docEntry = zip.getEntry('word/document.xml');
    if (docEntry) {
      this._documentData = xmlParser.parse(docEntry.getData().toString('utf-8'));
    }

    // Parse theme
    const themeEntry = zip.getEntry('word/theme/theme1.xml');
    if (themeEntry) {
      this.parseTheme(xmlParser.parse(themeEntry.getData().toString('utf-8')));
    }

    // Parse styles.xml
    const stylesEntry = zip.getEntry('word/styles.xml');
    if (stylesEntry) {
      this._stylesData = xmlParser.parse(stylesEntry.getData().toString('utf-8'));
      this.buildStyleIdMap();
      this.parseDocDefaults();
    }

    // Parse numbering.xml
    const numEntry = zip.getEntry('word/numbering.xml');
    if (numEntry) {
      this._numberingData = xmlParser.parse(numEntry.getData().toString('utf-8'));
      this.parseNumbering();
    }

    // Parse relationships
    const relsEntry = zip.getEntry('word/_rels/document.xml.rels');
    if (relsEntry) {
      this.parseRelationships(xmlParser.parse(relsEntry.getData().toString('utf-8')));
    }
  }

  private parseTheme(themeData: any): void {
    const themeElements = themeData?.['a:theme']?.['a:themeElements'];
    if (!themeElements) return;

    const fontScheme = themeElements['a:fontScheme'];
    if (fontScheme) {
      for (const [groupTag, prefix] of [['a:majorFont', 'major'], ['a:minorFont', 'minor']] as const) {
        const group = fontScheme[groupTag];
        if (!group) continue;
        const latin = group['a:latin'];
        if (latin && latin.typeface) {
          this._themeFonts.set(`${prefix}HAnsi`, latin.typeface);
          this._themeFonts.set(`${prefix}Ascii`, latin.typeface);
        }
      }
    }

    const clrScheme = themeElements['a:clrScheme'];
    if (clrScheme) {
      for (const [tag, slot] of Object.entries(clrScheme)) {
        const srgb = (slot as any)['a:srgbClr'];
        const sysClr = (slot as any)['a:sysClr'];
        let hexVal = '';
        if (srgb?.val) hexVal = (srgb.val as string).toUpperCase();
        else if (sysClr?.lastClr) hexVal = (sysClr.lastClr as string).toUpperCase();
        if (hexVal) this._themeColors.set(tag.replace('a:', ''), hexVal);
      }
      // Aliases
      for (const [alias, target] of [['bg1', 'lt1'], ['bg2', 'lt2'], ['tx1', 'dk1'], ['tx2', 'dk2']] as const) {
        if (this._themeColors.has(target) && !this._themeColors.has(alias)) {
          this._themeColors.set(alias, this._themeColors.get(target)!);
        }
      }
    }
  }

  private parseNumbering(): void {
    this._numberingCache.clear();
    if (!this._numberingData) return;

    const numbering = this._numberingData['w:numbering'];
    if (!numbering) return;

    const abstractNums: Map<number, Map<number, NumberingLevel>> = new Map();
    const abstractList = Array.isArray(numbering['w:abstractNum']) ? numbering['w:abstractNum'] : numbering['w:abstractNum'] ? [numbering['w:abstractNum']] : [];

    for (const abstract of abstractList) {
      const absId = parseInt(abstract['w:abstractNumId'], 10);
      const levels: Map<number, NumberingLevel> = new Map();
      const lvlList = Array.isArray(abstract['w:lvl']) ? abstract['w:lvl'] : abstract['w:lvl'] ? [abstract['w:lvl']] : [];

      for (const lvl of lvlList) {
        const ilvl = parseInt(lvl['w:ilvl'], 10);
        const numFmt = lvl['w:numFmt'];
        const start = lvl['w:start'];
        const lvlText = lvl['w:lvlText'];

        levels.set(ilvl, {
          format: numFmt?.['w:val'] || 'bullet',
          start: start ? parseInt(start['w:val'], 10) : 1,
          text: lvlText?.['w:val'] || '',
        });
      }
      abstractNums.set(absId, levels);
    }

    const numList = Array.isArray(numbering['w:num']) ? numbering['w:num'] : numbering['w:num'] ? [numbering['w:num']] : [];
    for (const num of numList) {
      const numId = parseInt(num['w:numId'], 10);
      const absIdElem = num['w:abstractNumId'];
      if (absIdElem) {
        const absId = parseInt(absIdElem['w:val'], 10);
        this._numberingCache.set(numId, new NumberingInfo(numId, absId));
        const cached = this._numberingCache.get(numId)!;
        const absLevels = abstractNums.get(absId);
        if (absLevels) cached.levels = absLevels;
      }
    }
  }

  private buildStyleIdMap(): void {
    if (!this._stylesData) return;
    const styles = this._stylesData['w:styles'];
    if (!styles) return;

    const styleList = Array.isArray(styles['w:style']) ? styles['w:style'] : styles['w:style'] ? [styles['w:style']] : [];
    for (const styleElem of styleList) {
      const styleId = styleElem['w:styleId'];
      if (styleId) this._styleElemCache.set(styleId, styleElem);
      const nameElem = styleElem['w:name'];
      if (nameElem && styleId) {
        const rawName = nameElem['w:val'] || styleId;
        const isCustom = styleElem['w:customStyle'] === '1';
        this._styleIdToName.set(styleId, isCustom ? rawName : canonicalizeStyleName(rawName));
      }
    }
  }

  private parseDocDefaults(): void {
    if (!this._stylesData) return;
    const docDefaults = this._stylesData['w:styles']?.['w:docDefaults'];
    if (!docDefaults) return;
    const rPrDefault = docDefaults['w:rPrDefault'];
    if (rPrDefault) this._docDefaultRPr = rPrDefault['w:rPr'] || null;
    const pPrDefault = docDefaults['w:pPrDefault'];
    if (pPrDefault) this._docDefaultPPr = pPrDefault['w:pPr'] || null;
  }

  private parseRelationships(relsData: any): void {
    const rels = relsData?.['Relationships']?.['Relationship'];
    if (!rels) return;
    const relList = Array.isArray(rels) ? rels : [rels];
    for (const rel of relList) {
      const rId = rel.Id;
      const target = rel.Target;
      const type = rel.Type;
      const targetMode = rel.TargetMode;
      if (!rId || !target) continue;
      if (targetMode === 'External') {
        this._rels.set(rId, target);
      } else if (type?.endsWith('/image')) {
        const raw = target.startsWith('/') ? `word${target}` : `word/${target}`;
        this._docImageRels.set(rId, raw);
      }
    }
  }

  resolveStyleName(styleId: string): string {
    return this._styleIdToName.get(styleId) || styleId;
  }

  // ═══════════════════════════════════════════════
  // LDM Builder
  // ═══════════════════════════════════════════════

  toLightDocument(): Document {
    const doc = ldm.createDocument();
    doc.styles = this.buildStyles();
    doc.lists = this.buildLists();
    doc.sections = this.buildSections();
    return doc;
  }

  private buildStyles(): Style[] {
    const result: Style[] = [];
    if (!this._stylesData) return result;

    const styles = this._stylesData['w:styles'];
    if (!styles) return result;

    const styleList = Array.isArray(styles['w:style']) ? styles['w:style'] : styles['w:style'] ? [styles['w:style']] : [];
    for (const styleElem of styleList) {
      const s: Style = {
        name: '', type: 1, is_heading: false, base_style_name: '',
        next_paragraph_style_name: '', paragraph_format: null, font: null,
      };

      const isCustom = styleElem['w:customStyle'] === '1';
      const nameElem = styleElem['w:name'];
      if (nameElem) {
        const rawName = nameElem['w:val'] || '';
        s.name = isCustom ? rawName : canonicalizeStyleName(rawName);
      }

      const st = styleElem['w:type'] || '';
      s.type = consts.STYLE_TYPE_MAP[st] || 0;

      const headingMatch = s.name.match(/[Hh]eading\s*(\d+)/);
      s.is_heading = headingMatch !== null;

      const basedOn = styleElem['w:basedOn'];
      if (basedOn) {
        s.base_style_name = this.resolveStyleName(basedOn['w:val'] || '');
      }

      const next = styleElem['w:next'];
      s.next_paragraph_style_name = next ? this.resolveStyleName(next['w:val'] || '') : s.name;

      if (s.is_heading && headingMatch) {
        s.paragraph_format = this.buildParagraphFormat(styleElem['w:pPr'] || {});
        s.paragraph_format.is_heading = true;
        s.paragraph_format.outline_level = parseInt(headingMatch[1], 10) - 1;
        s.paragraph_format.style_name = s.name;
      } else if (s.type === 1) {
        s.paragraph_format = this.buildParagraphFormat(styleElem['w:pPr'] || {});
        s.paragraph_format.style_name = s.name;
      }

      const rPr = styleElem['w:rPr'];
      if (rPr) {
        s.font = this.buildFont(rPr);
      }

      result.push(s);
    }
    return result;
  }

  private buildLists(): DocList[] {
    const result: DocList[] = [];
    if (!this._numberingData) return result;

    for (const [numId, info] of this._numberingCache) {
      const dl: DocList = { list_id: numId, is_multi_level: false, levels: [] };
      for (const [, lvl] of info.levels) {
        dl.levels.push({
          number_format: lvl.text,
          number_style: consts.NUMBER_STYLE_MAP[lvl.format] || 0,
          start_at: lvl.start,
          alignment: 0,
          number_position: 0,
          text_position: 0,
        });
      }
      result.push(dl);
    }
    return result;
  }

  private buildSections(): ldm.Section[] {
    const docBody = this._documentData?.['w:document']?.['w:body'];
    if (!docBody) return [];

    const section = ldm.createSection();
    const children: ldm.BodyChild[] = [];

    // Iterate body children
    const bodyChildren: any[] = [];
    for (const [key, val] of Object.entries(docBody)) {
      if (key === 'w:p' || key === 'w:tbl' || key === 'w:sectPr') {
        if (Array.isArray(val)) {
          for (const item of val) bodyChildren.push({ tag: key, data: item });
        } else {
          bodyChildren.push({ tag: key, data: val });
        }
      }
    }

    for (const child of bodyChildren) {
      if (child.tag === 'w:p') {
        children.push(this.buildParagraph(child.data));
      } else if (child.tag === 'w:tbl') {
        children.push(this.buildTable(child.data));
      }
    }

    section.body = { _type: 'Body', children };
    return [section];
  }

  buildParagraph(pData: any): Paragraph {
    const para = ldm.createParagraph();
    const pPr = pData['w:pPr'] || {};

    const pStyle = pPr['w:pStyle'];
    let styleId = '';
    if (pStyle) styleId = pStyle['w:val'] || '';

    para.paragraph_format = this.buildParagraphFormat(pPr);
    if (styleId) {
      para.paragraph_format.style_name = this.resolveStyleName(styleId);
    }

    // Runs
    const runs: Run[] = [];
    const runList = Array.isArray(pData['w:r']) ? pData['w:r'] : pData['w:r'] ? [pData['w:r']] : [];

    const textParts: string[] = [];
    for (const rElem of runList) {
      const text = collectRunText(rElem);
      if (!text) continue;

      const rPr = rElem['w:rPr'] || {};
      const run = ldm.createRun(text);
      run.font = this.buildResolvedFont(rPr, styleId);
      runs.push(run);
      textParts.push(text);
    }

    para.runs = runs;
    para._text = textParts.join('');
    return para;
  }

  buildParagraphFormat(pPr: any): ParagraphFormat {
    const pf: ParagraphFormat = {
      style_name: '', alignment: 0, left_indent: 0, right_indent: 0,
      first_line_indent: 0, space_before: 0, space_after: 0,
      space_before_auto: false, space_after_auto: false, line_spacing: 0,
      line_spacing_rule: 0, keep_with_next: false, page_break_before: false,
      outline_level: 9, is_heading: false, is_list_item: false,
      shading: { background_color: '' }, borders: emptyBorders(),
    };

    const jc = pPr['w:jc'];
    if (jc) pf.alignment = consts.ALIGNMENT_MAP[jc['w:val']] || 0;

    const outline = pPr['w:outlineLvl'];
    if (outline) {
      pf.outline_level = parseInt(outline['w:val'] || '9', 10);
      if (pf.outline_level < 9) pf.is_heading = true;
    }

    return pf;
  }

  buildFont(rPr: any): Font {
    const font: Font = {
      name: '', size: 0, bold: false, italic: false, underline: 0,
      color: '', strike_through: false, superscript: false, subscript: false,
      highlight_color: '', all_caps: false, small_caps: false, hidden: false,
      style_name: 'Default Paragraph Font', shading: { background_color: '' },
    };

    const rFonts = rPr['w:rFonts'];
    if (rFonts) {
      font.name = rFonts['w:ascii'] || rFonts['w:hAnsi'] || '';
    }

    const sz = rPr['w:sz'];
    if (sz) font.size = parseInt(sz['w:val'] || '0', 10) / consts.HALF_PT_DIVISOR;

    const b = rPr['w:b'];
    if (b) font.bold = !b['w:val'] || b['w:val'] !== 'false';

    const i = rPr['w:i'];
    if (i) font.italic = !i['w:val'] || i['w:val'] !== 'false';

    const u = rPr['w:u'];
    if (u) font.underline = consts.UNDERLINE_MAP[u['w:val']] || (u['w:val'] !== 'none' ? 1 : 0);

    const color = rPr['w:color'];
    if (color) {
      const val = color['w:val'] || '';
      if (val && val !== 'auto') {
        font.color = hexToColor(val);
      }
    }

    return font;
  }

  buildResolvedFont(rPr: any, styleId: string = ''): Font {
    // Start with doc defaults
    const baseFont = this._docDefaultRPr ? this.buildFont(this._docDefaultRPr) : this.buildFont({});

    // Apply direct formatting
    const directFont = this.buildFont(rPr);
    if (directFont.name) baseFont.name = directFont.name;
    if (directFont.size > 0) baseFont.size = directFont.size;
    if (directFont.bold) baseFont.bold = directFont.bold;
    if (directFont.italic) baseFont.italic = directFont.italic;
    if (directFont.underline > 0) baseFont.underline = directFont.underline;
    if (directFont.color) baseFont.color = directFont.color;
    if (directFont.strike_through) baseFont.strike_through = directFont.strike_through;

    return baseFont;
  }

  buildTable(tblData: any): Table {
    const table: Table = {
      _type: 'Table', alignment: 0, preferred_width: '', left_indent: 0,
      left_padding: 0, right_padding: 0, top_padding: 0, bottom_padding: 0,
      rows: [],
    };

    const trList = Array.isArray(tblData['w:tr']) ? tblData['w:tr'] : tblData['w:tr'] ? [tblData['w:tr']] : [];
    for (const trElem of trList) {
      const row: ldm.Row = { _type: 'Row', row_format: { height: 0, height_rule: 0, heading_format: false, allow_break_across_pages: true }, cells: [] };
      const tcList = Array.isArray(trElem['w:tc']) ? trElem['w:tc'] : trElem['w:tc'] ? [trElem['w:tc']] : [];

      for (const tcElem of tcList) {
        const cell: Cell = {
          _type: 'Cell', cell_format: { width: 0, preferred_width: 'Auto', vertical_alignment: 0, vertical_merge: 0, horizontal_merge: 0, top_padding: 0, bottom_padding: 0, left_padding: 0, right_padding: 0, shading: { background_color: '' }, borders: emptyBorders() },
          paragraphs: [], tables: [],
        };

        const pList = Array.isArray(tcElem['w:p']) ? tcElem['w:p'] : tcElem['w:p'] ? [tcElem['w:p']] : [];
        for (const pElem of pList) {
          cell.paragraphs.push(this.buildParagraph(pElem));
        }
        row.cells.push(cell);
      }
      table.rows.push(row);
    }

    return table;
  }
}
