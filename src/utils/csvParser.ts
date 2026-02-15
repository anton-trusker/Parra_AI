export interface ColumnDefinition {
  key: string;
  label: string;
  required: boolean;
  aliases: string[];
}

export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  { key: 'name', label: 'Name', required: true, aliases: ['product name', 'product', 'title', 'item'] },
  { key: 'sku', label: 'SKU', required: true, aliases: ['sku code', 'item code', 'product code', 'code'] },
  { key: 'barcode', label: 'Barcode', required: false, aliases: ['ean', 'upc', 'barcode number'] },
  { key: 'price', label: 'Price', required: false, aliases: ['sell price', 'selling price', 'retail price', 'sale price'] },
  { key: 'purchasePrice', label: 'Purchase Price', required: false, aliases: ['cost', 'cost price', 'buy price', 'wholesale'] },
  { key: 'stock', label: 'Stock', required: false, aliases: ['qty', 'quantity', 'count', 'on hand'] },
  { key: 'category', label: 'Category', required: false, aliases: ['type', 'group'] },
];

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

export interface ColumnMapping {
  csvHeader: string;
  systemField: string;
}

export interface RowError {
  row: number;
  field: string;
  message: string;
}

export interface ValidationResult {
  validRows: Record<string, string>[];
  errors: RowError[];
  skippedRows: number[];
}

export function parseCSV(text: string): ParsedCSV {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim()); current = '';
      } else current += ch;
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

export function parseCSVFile(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try { resolve(parseCSV(e.target?.result as string)); }
      catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function autoMapColumns(csvHeaders: string[]): ColumnMapping[] {
  return csvHeaders.map(header => {
    const normalized = header.toLowerCase().trim();
    let bestMatch = 'skip';
    for (const col of COLUMN_DEFINITIONS) {
      if (col.label.toLowerCase() === normalized || col.key.toLowerCase() === normalized) { bestMatch = col.key; break; }
      if (col.aliases.some(a => a.toLowerCase() === normalized)) { bestMatch = col.key; break; }
    }
    if (bestMatch === 'skip') {
      for (const col of COLUMN_DEFINITIONS) {
        if (normalized.includes(col.key.toLowerCase()) || col.aliases.some(a => normalized.includes(a))) { bestMatch = col.key; break; }
      }
    }
    return { csvHeader: header, systemField: bestMatch };
  });
}

export function validateRows(rows: string[][], mappings: ColumnMapping[], existingSkus: string[]): ValidationResult {
  const errors: RowError[] = [];
  const validRows: Record<string, string>[] = [];
  const skippedRows: number[] = [];
  const seenSkus = new Set<string>();

  rows.forEach((row, rowIdx) => {
    const mapped: Record<string, string> = {};
    mappings.forEach((m, colIdx) => {
      if (m.systemField !== 'skip' && colIdx < row.length) mapped[m.systemField] = row[colIdx]?.trim() || '';
    });
    let hasError = false;
    const addError = (field: string, message: string) => { errors.push({ row: rowIdx, field, message }); hasError = true; };
    if (!mapped.name) addError('name', 'Name is required');
    if (!mapped.sku) addError('sku', 'SKU is required');
    else {
      if (seenSkus.has(mapped.sku)) addError('sku', `Duplicate SKU "${mapped.sku}"`);
      if (existingSkus.includes(mapped.sku)) addError('sku', `SKU "${mapped.sku}" already exists`);
      seenSkus.add(mapped.sku);
    }
    validRows.push(mapped);
    if (hasError) skippedRows.push(rowIdx);
  });

  return { validRows, errors, skippedRows };
}

export function generateTemplate(): void {
  const headers = COLUMN_DEFINITIONS.map(c => c.label);
  const exampleRow = ['Example Product', 'PRD-001', '1234567890', '45.00', '28.00', '12', 'General'];
  const csvContent = [headers.join(','), exampleRow.join(',')].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'product_import_template.csv';
  link.click();
  URL.revokeObjectURL(url);
}
