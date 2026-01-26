import { z } from 'zod';
import { sheets } from '../../lib/google.ts';

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
