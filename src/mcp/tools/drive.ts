import { z } from 'zod';
import { getAuthorizedFiles } from '../../db/index.ts';
import type { ToolContext } from '../server.ts';

export const driveTools = {
  list_authorized_files: {
    product: 'drive' as const,
    description: 'List files the user has authorized for access. Use this to discover which spreadsheets are available before using sheets tools.',
    parameters: z.object({
      mimeType: z.string().optional().describe('Filter by MIME type (e.g., "application/vnd.google-apps.spreadsheet")'),
    }),
    execute: async (context: ToolContext, params: { mimeType?: string }) => {
      const files = await getAuthorizedFiles(context.db, context.apiKey, params.mimeType);

      if (files.length === 0) {
        return {
          files: [],
          message: 'No files authorized. The user can create new spreadsheets, or re-authenticate to select existing files to share.',
        };
      }

      return {
        files: files.map(f => ({
          fileId: f.fileId,
          fileName: f.fileName,
          mimeType: f.mimeType,
          addedAt: new Date(f.addedAt * 1000).toISOString(),
        })),
      };
    },
  },
};
