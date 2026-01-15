import { z } from 'zod';
import { sheets } from '../../lib/google.ts';

export const sheetsTools = {
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
