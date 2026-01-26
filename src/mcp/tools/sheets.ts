import { z } from 'zod';
import { sheets } from '../../lib/google.ts';

// Normalize string: lowercase + remove accents
function normalize(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Parse numeric value from string or number
function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Filter operators
type Operator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte' | 'between' | 'in' | 'isEmpty';

interface Filter {
  column: string | number;
  operator: Operator;
  value?: unknown;
  neg?: boolean;
}

function matchesFilter(cellValue: unknown, filter: Filter): boolean {
  const { operator, value, neg } = filter;

  let result: boolean;

  if (operator === 'isEmpty') {
    result = cellValue === null || cellValue === undefined || cellValue === '';
  } else if (operator === 'equals') {
    result = normalize(cellValue) === normalize(value);
  } else if (operator === 'contains') {
    result = normalize(cellValue).includes(normalize(value));
  } else if (operator === 'startsWith') {
    result = normalize(cellValue).startsWith(normalize(value));
  } else if (operator === 'endsWith') {
    result = normalize(cellValue).endsWith(normalize(value));
  } else if (operator === 'in') {
    const list = Array.isArray(value) ? value : [value];
    const normalizedCell = normalize(cellValue);
    result = list.some((v) => normalize(v) === normalizedCell);
  } else if (operator === 'gt' || operator === 'lt' || operator === 'gte' || operator === 'lte') {
    const cellNum = toNumber(cellValue);
    const filterNum = toNumber(value);
    if (cellNum === null || filterNum === null) {
      result = false;
    } else if (operator === 'gt') {
      result = cellNum > filterNum;
    } else if (operator === 'lt') {
      result = cellNum < filterNum;
    } else if (operator === 'gte') {
      result = cellNum >= filterNum;
    } else {
      result = cellNum <= filterNum;
    }
  } else if (operator === 'between') {
    const cellNum = toNumber(cellValue);
    const range = Array.isArray(value) ? value : [0, 0];
    const min = toNumber(range[0]);
    const max = toNumber(range[1]);
    if (cellNum === null || min === null || max === null) {
      result = false;
    } else {
      result = cellNum >= min && cellNum <= max;
    }
  } else {
    result = false;
  }

  return neg ? !result : result;
}

// Type inference helpers
function inferType(values: unknown[]): string {
  const nonEmpty = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonEmpty.length === 0) return 'empty';

  const types = nonEmpty.map((v) => {
    if (typeof v === 'number') return 'number';
    if (typeof v === 'boolean') return 'boolean';
    if (typeof v !== 'string') return 'string';

    const str = v.trim();

    // Check boolean
    if (['true', 'false', 'TRUE', 'FALSE', 'yes', 'no', 'YES', 'NO'].includes(str)) {
      return 'boolean';
    }

    // Check number
    if (/^-?\d+\.?\d*$/.test(str) || /^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(str)) {
      return 'number';
    }

    // Check date (ISO format, or common patterns)
    if (/^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(str)) {
      return 'date';
    }

    return 'string';
  });

  // If all same type, return it; otherwise string
  const uniqueTypes = [...new Set(types)];
  return uniqueTypes.length === 1 ? uniqueTypes[0] : 'string';
}

export const sheetsTools = {
  get_sheet_schema: {
    product: 'sheets' as const,
    description: 'Get column names and inferred types from a sheet (useful before appending data)',
    parameters: z.object({
      spreadsheetId: z.string().describe('The spreadsheet ID'),
      sheet: z.string().default('Sheet1').describe('Sheet name'),
      sampleRows: z.number().optional().default(5).describe('Number of data rows to sample for type inference'),
    }),
    execute: async (accessToken: string, params: {
      spreadsheetId: string;
      sheet: string;
      sampleRows: number;
    }) => {
      // Read header + sample rows
      const range = `${params.sheet}!1:${params.sampleRows + 1}`;
      const result = await sheets.readRange({ accessToken }, params.spreadsheetId, range);

      const rows = result.values ?? [];
      if (rows.length === 0) {
        return { columns: [], error: 'Sheet is empty' };
      }

      const headers = rows[0] as string[];
      const dataRows = rows.slice(1);

      const columns = headers.map((name, index) => {
        // Get all values for this column from sample rows
        const columnValues = dataRows.map((row) => row[index]);
        const type = inferType(columnValues);

        return {
          name: name ?? `Column ${index + 1}`,
          type,
          index,
        };
      });

      return {
        columns,
        sampleRowCount: dataRows.length,
      };
    },
  },

  describe_sheet: {
    product: 'sheets' as const,
    description: 'Get a statistical summary of all columns in a sheet (like pandas describe). Shows types, unique values, top values for categorical columns, and min/max for numeric columns.',
    parameters: z.object({
      spreadsheetId: z.string().describe('The spreadsheet ID'),
      sheet: z.string().default('Sheet1').describe('Sheet name'),
      maxRows: z.number().optional().default(1000).describe('Maximum rows to analyze'),
      topValuesLimit: z.number().optional().default(5).describe('Number of top values to show per column'),
    }),
    execute: async (accessToken: string, params: {
      spreadsheetId: string;
      sheet: string;
      maxRows: number;
      topValuesLimit: number;
    }) => {
      const range = `${params.sheet}!1:${params.maxRows + 1}`;
      const result = await sheets.readRange({ accessToken }, params.spreadsheetId, range);

      const rows = result.values ?? [];
      if (rows.length === 0) {
        return { columns: [], error: 'Sheet is empty' };
      }

      const headers = rows[0] as string[];
      const dataRows = rows.slice(1);

      const columns = headers.map((name, index) => {
        const columnValues = dataRows.map((row) => row[index]);
        const type = inferType(columnValues);

        // Count empty values
        const emptyCount = columnValues.filter(
          (v) => v === null || v === undefined || v === ''
        ).length;

        // Get unique values and their counts
        const valueCounts = new Map<string, number>();
        for (const v of columnValues) {
          if (v === null || v === undefined || v === '') continue;
          const key = String(v);
          valueCounts.set(key, (valueCounts.get(key) ?? 0) + 1);
        }

        const uniqueCount = valueCounts.size;

        // Sort by frequency and get top values
        const sorted = [...valueCounts.entries()].sort((a, b) => b[1] - a[1]);
        const topValues = sorted.slice(0, params.topValuesLimit).map(([value, count]) => ({
          value,
          count,
        }));

        const columnInfo: Record<string, unknown> = {
          name: name ?? `Column ${index + 1}`,
          type,
          uniqueCount,
          emptyCount,
          topValues,
        };

        // Add numeric stats if applicable
        if (type === 'number') {
          const numbers = columnValues
            .map((v) => toNumber(v))
            .filter((n): n is number => n !== null);

          if (numbers.length > 0) {
            columnInfo.min = Math.min(...numbers);
            columnInfo.max = Math.max(...numbers);
          }
        }

        return columnInfo;
      });

      return {
        rowCount: dataRows.length,
        columns,
      };
    },
  },

  search_rows: {
    product: 'sheets' as const,
    description: 'Search for rows matching filter criteria. All string comparisons are case-insensitive and accent-normalized.',
    parameters: z.object({
      spreadsheetId: z.string().describe('The spreadsheet ID'),
      sheet: z.string().default('Sheet1').describe('Sheet name'),
      filters: z.array(z.object({
        column: z.union([z.string(), z.number()]).describe('Column name or index (0-based)'),
        operator: z.enum(['equals', 'contains', 'startsWith', 'endsWith', 'gt', 'lt', 'gte', 'lte', 'between', 'in', 'isEmpty']).describe('Comparison operator'),
        value: z.unknown().optional().describe('Value to compare (not needed for isEmpty)'),
        neg: z.boolean().optional().describe('Negate the condition'),
      })).describe('Filter conditions (AND logic)'),
      maxRows: z.number().optional().default(1000).describe('Maximum rows to scan'),
      maxResults: z.number().optional().default(100).describe('Maximum matching rows to return'),
    }),
    execute: async (accessToken: string, params: {
      spreadsheetId: string;
      sheet: string;
      filters: Filter[];
      maxRows: number;
      maxResults: number;
    }) => {
      // Read header + data rows
      const range = `${params.sheet}!1:${params.maxRows + 1}`;
      const result = await sheets.readRange({ accessToken }, params.spreadsheetId, range);

      const rows = result.values ?? [];
      if (rows.length === 0) {
        return { matches: [], error: 'Sheet is empty' };
      }

      const headers = rows[0] as string[];
      const dataRows = rows.slice(1);

      // Resolve column names to indices
      const resolvedFilters = params.filters.map((f) => ({
        ...f,
        columnIndex: typeof f.column === 'number'
          ? f.column
          : headers.findIndex((h) => normalize(h) === normalize(f.column)),
      }));

      // Check for invalid column references
      const invalidFilter = resolvedFilters.find((f) => f.columnIndex === -1);
      if (invalidFilter) {
        return { matches: [], error: `Column not found: ${invalidFilter.column}` };
      }

      // Filter rows
      const matches: { rowIndex: number; data: Record<string, unknown> }[] = [];

      for (let i = 0; i < dataRows.length && matches.length < params.maxResults; i++) {
        const row = dataRows[i];
        const allMatch = resolvedFilters.every((f) =>
          matchesFilter(row[f.columnIndex], f)
        );

        if (allMatch) {
          // Convert row to object with column names
          const data: Record<string, unknown> = {};
          headers.forEach((header, idx) => {
            data[header] = row[idx] ?? null;
          });
          matches.push({ rowIndex: i + 2, data }); // +2 for 1-indexed + header row
        }
      }

      return {
        matches,
        scannedRows: dataRows.length,
        matchCount: matches.length,
      };
    },
  },

  get_spreadsheet: {
    product: 'sheets' as const,
    description: 'Get spreadsheet metadata including sheet names',
    parameters: z.object({
      spreadsheetId: z.string().describe('The spreadsheet ID'),
    }),
    execute: async (accessToken: string, params: { spreadsheetId: string }) => {
      const spreadsheet = await sheets.getSpreadsheet({ accessToken }, params.spreadsheetId);
      return {
        id: spreadsheet.spreadsheetId,
        title: spreadsheet.properties.title,
        sheets: spreadsheet.sheets.map((s) => ({
          id: s.properties.sheetId,
          title: s.properties.title,
          index: s.properties.index,
        })),
      };
    },
  },

  read_sheet: {
    product: 'sheets' as const,
    description: 'Read data from a spreadsheet range',
    parameters: z.object({
      spreadsheetId: z.string().describe('The spreadsheet ID'),
      range: z.string().describe('A1 notation range (e.g., "Sheet1!A1:D10" or "A1:D10")'),
    }),
    execute: async (accessToken: string, params: { spreadsheetId: string; range: string }) => {
      const result = await sheets.readRange({ accessToken }, params.spreadsheetId, params.range);
      return {
        range: result.range,
        values: result.values ?? [],
        rowCount: result.values?.length ?? 0,
        columnCount: result.values?.[0]?.length ?? 0,
      };
    },
  },

  write_sheet: {
    product: 'sheets' as const,
    description: 'Write data to a spreadsheet range (overwrites existing data)',
    parameters: z.object({
      spreadsheetId: z.string().describe('The spreadsheet ID'),
      range: z.string().describe('A1 notation range to write to'),
      values: z.array(z.array(z.unknown())).describe('2D array of values to write'),
      raw: z.boolean().optional().default(false).describe('If true, values are stored as-is without parsing'),
    }),
    execute: async (accessToken: string, params: {
      spreadsheetId: string;
      range: string;
      values: unknown[][];
      raw?: boolean;
    }) => {
      const result = await sheets.writeRange(
        { accessToken },
        params.spreadsheetId,
        params.range,
        params.values,
        params.raw ? 'RAW' : 'USER_ENTERED'
      );
      return {
        spreadsheetId: result.spreadsheetId,
        updatedRange: result.updatedRange,
        updatedRows: result.updatedRows,
        updatedColumns: result.updatedColumns,
        updatedCells: result.updatedCells,
      };
    },
  },

  append_rows: {
    product: 'sheets' as const,
    description: 'Append rows to the end of a spreadsheet table',
    parameters: z.object({
      spreadsheetId: z.string().describe('The spreadsheet ID'),
      range: z.string().describe('A1 notation range defining the table (e.g., "Sheet1!A:D")'),
      values: z.array(z.array(z.unknown())).describe('2D array of rows to append'),
      raw: z.boolean().optional().default(false).describe('If true, values are stored as-is'),
    }),
    execute: async (accessToken: string, params: {
      spreadsheetId: string;
      range: string;
      values: unknown[][];
      raw?: boolean;
    }) => {
      const result = await sheets.appendRows(
        { accessToken },
        params.spreadsheetId,
        params.range,
        params.values,
        params.raw ? 'RAW' : 'USER_ENTERED'
      );
      return {
        spreadsheetId: result.spreadsheetId,
        tableRange: result.tableRange,
        updatedRange: result.updates.updatedRange,
        updatedRows: result.updates.updatedRows,
        updatedCells: result.updates.updatedCells,
      };
    },
  },

  create_spreadsheet: {
    product: 'sheets' as const,
    description: 'Create a new spreadsheet',
    parameters: z.object({
      title: z.string().describe('Title for the new spreadsheet'),
    }),
    execute: async (accessToken: string, params: { title: string }) => {
      const spreadsheet = await sheets.createSpreadsheet({ accessToken }, params.title);
      return {
        id: spreadsheet.spreadsheetId,
        title: spreadsheet.properties.title,
        url: `https://docs.google.com/spreadsheets/d/${spreadsheet.spreadsheetId}`,
      };
    },
  },
};
