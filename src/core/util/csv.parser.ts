/**
 * A small CSV reader for the product import. It follows RFC 4180 for double quoted fields and
 * also tolerates what spreadsheets and the sample file in this repo actually produce: semicolons
 * as separators, values wrapped in single quotes, padding spaces and a trailing separator.
 */

export type CsvRow = Record<string, string>;

const SUPPORTED_DELIMITERS = [',', ';', '\t'] as const;

/** Lowercase, without accents and without anything that is not a letter or a digit */
export function normalizeHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function stripQuotes(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];

    if ((first === "'" && last === "'") || (first === '"' && last === '"')) {
      return trimmed.slice(1, -1).trim();
    }
  }

  return trimmed;
}

/** Splits into rows of raw fields, keeping separators and newlines that sit inside double quotes */
function splitRows(content: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (inQuotes) {
      if (char === '"') {
        //A doubled quote inside a quoted field is a literal quote
        if (content[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === delimiter) {
      row.push(field);
      field = '';
      continue;
    }

    if (char === '\n' || char === '\r') {
      //\r\n counts once
      if (char === '\r' && content[i + 1] === '\n') {
        i++;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  row.push(field);
  rows.push(row);

  return rows;
}

function detectDelimiter(firstLine: string): string {
  let best = ',';
  let bestCount = -1;

  for (const delimiter of SUPPORTED_DELIMITERS) {
    const count = firstLine.split(delimiter).length - 1;
    if (count > bestCount) {
      best = delimiter;
      bestCount = count;
    }
  }

  return best;
}

/**
 * Turns the file into one object per row, keyed by the normalized header. A row with no value at
 * all is left out, and a column with no header is ignored, which is what a trailing separator
 * produces.
 */
export function parseCsv(content: string): CsvRow[] {
  const text = (content || '').replace(/^﻿/, '').trim();

  if (!text) {
    return [];
  }

  const delimiter = detectDelimiter(text.split(/\r?\n/, 1)[0] || '');
  const rows = splitRows(text, delimiter);
  const headers = (rows.shift() || []).map(header => normalizeHeader(stripQuotes(header)));

  return rows
    .map(fields => {
      const row: CsvRow = {};

      headers.forEach((header, index) => {
        if (!header) {
          return;
        }
        row[header] = stripQuotes(fields[index] ?? '');
      });

      return row;
    })
    .filter(row => Object.values(row).some(value => value !== ''));
}
