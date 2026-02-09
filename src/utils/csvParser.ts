import { Wine } from '@/data/mockWines';

export interface ColumnDefinition {
  key: string;
  label: string;
  required: boolean;
  aliases: string[]; // fuzzy match candidates
}

export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  { key: 'name', label: 'Name', required: true, aliases: ['wine name', 'wine', 'title', 'product name', 'product'] },
  { key: 'producer', label: 'Producer', required: false, aliases: ['winery', 'brand', 'maker', 'estate'] },
  { key: 'vintage', label: 'Vintage', required: false, aliases: ['year'] },
  { key: 'type', label: 'Type', required: true, aliases: ['wine type', 'category', 'color', 'colour', 'style'] },
  { key: 'region', label: 'Region', required: false, aliases: ['wine region', 'area'] },
  { key: 'country', label: 'Country', required: false, aliases: ['origin', 'country of origin'] },
  { key: 'volume', label: 'Volume (ml)', required: false, aliases: ['volume', 'ml', 'size', 'bottle size', 'volume ml'] },
  { key: 'abv', label: 'ABV', required: false, aliases: ['alcohol', 'alcohol %', 'alc', 'abv %'] },
  { key: 'sku', label: 'SKU', required: true, aliases: ['sku code', 'item code', 'product code', 'code'] },
  { key: 'barcode', label: 'Barcode', required: false, aliases: ['ean', 'upc', 'barcode number', 'ean-13', 'upc-a'] },
  { key: 'price', label: 'Price', required: false, aliases: ['sell price', 'selling price', 'retail price', 'sale price'] },
  { key: 'purchasePrice', label: 'Purchase Price', required: false, aliases: ['cost', 'cost price', 'buy price', 'wholesale'] },
  { key: 'stockUnopened', label: 'Stock Unopened', required: false, aliases: ['qty', 'quantity', 'stock', 'unopened', 'bottles', 'count', 'on hand'] },
  { key: 'stockOpened', label: 'Stock Opened', required: false, aliases: ['opened', 'open bottles', 'open'] },
  { key: 'minStockLevel', label: 'Min Stock Level', required: false, aliases: ['min stock', 'minimum', 'reorder level', 'par level'] },
  { key: 'location', label: 'Location', required: false, aliases: ['storage', 'cellar', 'bin', 'shelf'] },
  { key: 'grapeVarieties', label: 'Grape Varieties', required: false, aliases: ['grapes', 'grape', 'varietal', 'varietals', 'grape variety'] },
];

const VALID_TYPES = ['Red', 'White', 'Rosé', 'Rose', 'Sparkling', 'Fortified', 'Dessert'];

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

export interface ColumnMapping {
  csvHeader: string;
  systemField: string; // key from COLUMN_DEFINITIONS or 'skip'
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
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
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
      try {
        const text = e.target?.result as string;
        resolve(parseCSV(text));
      } catch (err) {
        reject(err);
      }
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
      if (col.label.toLowerCase() === normalized || col.key.toLowerCase() === normalized) {
        bestMatch = col.key;
        break;
      }
      if (col.aliases.some(a => a.toLowerCase() === normalized)) {
        bestMatch = col.key;
        break;
      }
    }

    // Fuzzy: check if header contains a keyword
    if (bestMatch === 'skip') {
      for (const col of COLUMN_DEFINITIONS) {
        if (normalized.includes(col.key.toLowerCase()) || col.aliases.some(a => normalized.includes(a))) {
          bestMatch = col.key;
          break;
        }
      }
    }

    return { csvHeader: header, systemField: bestMatch };
  });
}

export function validateRows(
  rows: string[][],
  mappings: ColumnMapping[],
  existingSkus: string[]
): ValidationResult {
  const errors: RowError[] = [];
  const validRows: Record<string, string>[] = [];
  const skippedRows: number[] = [];
  const seenSkus = new Set<string>();

  rows.forEach((row, rowIdx) => {
    const mapped: Record<string, string> = {};
    mappings.forEach((m, colIdx) => {
      if (m.systemField !== 'skip' && colIdx < row.length) {
        mapped[m.systemField] = row[colIdx]?.trim() || '';
      }
    });

    let hasError = false;
    const addError = (field: string, message: string) => {
      errors.push({ row: rowIdx, field, message });
      hasError = true;
    };

    // Required: name
    if (!mapped.name) addError('name', 'Name is required');
    // Required: type
    if (!mapped.type) {
      addError('type', 'Type is required');
    } else {
      const normalizedType = mapped.type.charAt(0).toUpperCase() + mapped.type.slice(1).toLowerCase();
      if (!VALID_TYPES.includes(normalizedType) && !VALID_TYPES.includes(mapped.type)) {
        addError('type', `Invalid type "${mapped.type}". Must be one of: ${VALID_TYPES.join(', ')}`);
      }
    }
    // Required: sku
    if (!mapped.sku) {
      addError('sku', 'SKU is required');
    } else {
      if (seenSkus.has(mapped.sku)) addError('sku', `Duplicate SKU "${mapped.sku}" in file`);
      if (existingSkus.includes(mapped.sku)) addError('sku', `SKU "${mapped.sku}" already exists in inventory`);
      seenSkus.add(mapped.sku);
    }

    // Vintage
    if (mapped.vintage) {
      const v = parseInt(mapped.vintage);
      if (isNaN(v) || v < 1900 || v > 2026) addError('vintage', 'Vintage must be a year between 1900-2026');
    }

    // Numeric non-negative fields
    const numFields = ['volume', 'price', 'purchasePrice', 'stockUnopened', 'stockOpened', 'minStockLevel', 'abv'];
    numFields.forEach(f => {
      if (mapped[f]) {
        const n = parseFloat(mapped[f]);
        if (isNaN(n) || n < 0) addError(f, `${f} must be a non-negative number`);
      }
    });

    validRows.push(mapped);
    if (hasError) skippedRows.push(rowIdx);
  });

  return { validRows, errors, skippedRows };
}

export function mappedRowToWine(row: Record<string, string>, index: number): Omit<Wine, 'id'> {
  const normalizeType = (t: string): Wine['type'] => {
    const map: Record<string, Wine['type']> = {
      red: 'Red', white: 'White', rosé: 'Rosé', rose: 'Rosé',
      sparkling: 'Sparkling', fortified: 'Fortified', dessert: 'Dessert',
    };
    return map[t.toLowerCase()] || 'Red';
  };

  return {
    name: row.name || `Imported Wine ${index + 1}`,
    producer: row.producer || '',
    vintage: row.vintage ? parseInt(row.vintage) : null,
    type: normalizeType(row.type || 'Red'),
    region: row.region || '',
    country: row.country || '',
    volume: row.volume ? parseInt(row.volume) : 750,
    abv: row.abv ? parseFloat(row.abv) : 0,
    sku: row.sku || `IMP-${Date.now()}-${index}`,
    barcode: row.barcode || '',
    price: row.price ? parseFloat(row.price) : 0,
    purchasePrice: row.purchasePrice ? parseFloat(row.purchasePrice) : undefined,
    grapeVarieties: row.grapeVarieties ? row.grapeVarieties.split(',').map(g => g.trim()).filter(Boolean) : [],
    stockUnopened: row.stockUnopened ? parseInt(row.stockUnopened) : 0,
    stockOpened: row.stockOpened ? parseInt(row.stockOpened) : 0,
    minStockLevel: row.minStockLevel ? parseInt(row.minStockLevel) : 0,
    location: row.location || '',
    hasImage: false,
    isActive: true,
  };
}

export function generateTemplate(): void {
  const headers = COLUMN_DEFINITIONS.map(c => c.label);
  const exampleRow = [
    'Château Example', 'Example Winery', '2020', 'Red', 'Bordeaux', 'France',
    '750', '13.5', 'EX-2020-750', '3760001234567', '45.00', '28.00',
    '12', '1', '6', 'Cellar A - Rack 1', 'Cabernet Sauvignon, Merlot',
  ];

  const csvContent = [headers.join(','), exampleRow.join(',')].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'wine_inventory_template.csv';
  link.click();
  URL.revokeObjectURL(url);
}
