import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { calendarTools } from './tools/calendar.ts';
import { sheetsTools } from './tools/sheets.ts';
import { driveTools } from './tools/drive.ts';
import { getAuthorizedFiles, hasAuthorizedFileType } from '../db/index.ts';

// Context passed to tools
export interface ToolContext {
  accessToken: string;
  db: D1Database;
  apiKey: string;
}

// Combine all tools
const allTools = {
  ...calendarTools,
  ...sheetsTools,
  ...driveTools,
};

type ToolName = keyof typeof allTools;

// Map products to their required scopes
const productScopes: Record<string, string[]> = {
  calendar: ['https://www.googleapis.com/auth/calendar'],
  sheets: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'],
  drive: ['https://www.googleapis.com/auth/drive.file'],
};

// Filter tools based on authorized scopes and authorized files
async function getAuthorizedTools(scopes: string[], db: D1Database, apiKey: string) {
  const hasDriveFile = scopes.includes('https://www.googleapis.com/auth/drive.file');
  const hasSpreadsheets = scopes.includes('https://www.googleapis.com/auth/spreadsheets');

  // Check if user has any authorized spreadsheets (for drive.file scope)
  let hasAuthorizedSpreadsheets = false;
  if (hasDriveFile) {
    hasAuthorizedSpreadsheets = await hasAuthorizedFileType(
      db, apiKey, 'application/vnd.google-apps.spreadsheet'
    );
  }

  return Object.entries(allTools).filter(([_, tool]) => {
    const allowedScopes = productScopes[tool.product];

    // For sheets tools with drive.file scope, also need authorized spreadsheets
    if (tool.product === 'sheets') {
      if (hasSpreadsheets) return true;
      if (hasDriveFile && hasAuthorizedSpreadsheets) return true;
      return false;
    }

    // For drive tools, just need drive.file scope
    if (tool.product === 'drive') {
      return hasDriveFile;
    }

    // For other tools (calendar), check if any allowed scope is present
    return allowedScopes.some(scope => scopes.includes(scope));
  });
}

export function createMcpServer() {
  const server = new Server(
    {
      name: 'google-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: Object.entries(allTools).map(([name, tool]) => ({
        name,
        description: tool.description,
        inputSchema: z.toJSONSchema(tool.parameters),
      })),
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const toolName = request.params.name as ToolName;
    const tool = allTools[toolName];

    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    // Access token should be passed via extra context
    const accessToken = (extra as any)?.accessToken;
    if (!accessToken) {
      throw new Error('No access token provided');
    }

    try {
      const params = tool.parameters.parse(request.params.arguments ?? {});
      const result = await tool.execute(accessToken, params as any);

      // structuredContent must be an object, wrap arrays
      const structuredContent = Array.isArray(result) ? { items: result } : result;

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
        structuredContent: structuredContent as Record<string, unknown>,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${message}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

// HTTP transport handler for MCP
export interface McpHttpRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: unknown;
}

export interface McpHttpResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export async function handleMcpRequest(
  request: McpHttpRequest,
  accessToken: string,
  scopes: string[],
  db: D1Database,
  apiKey: string
): Promise<McpHttpResponse> {
  const authorizedTools = await getAuthorizedTools(scopes, db, apiKey);
  const context: ToolContext = { accessToken, db, apiKey };

  try {
    // Handle the request based on method
    if (request.method === 'tools/list') {
      const tools = authorizedTools.map(([name, tool]) => ({
        name,
        description: tool.description,
        inputSchema: z.toJSONSchema(tool.parameters),
      }));

      return {
        jsonrpc: '2.0',
        id: request.id,
        result: { tools },
      };
    }

    if (request.method === 'tools/call') {
      const params = request.params as { name: string; arguments?: Record<string, unknown> };
      const toolName = params.name as ToolName;
      const tool = allTools[toolName];

      if (!tool) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Unknown tool: ${toolName}`,
          },
        };
      }

      // Check if user has access to this tool
      const allowedScopes = productScopes[tool.product];
      const hasAccess = allowedScopes.some(scope => scopes.includes(scope));
      if (!hasAccess) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32001,
            message: `Tool "${toolName}" requires ${tool.product} authorization`,
          },
        };
      }

      const toolParams = tool.parameters.parse(params.arguments ?? {});
      // Drive tools get full context, other tools get just accessToken for backwards compatibility
      const result = tool.product === 'drive'
        ? await tool.execute(context, toolParams as any)
        : await tool.execute(accessToken, toolParams as any);

      // structuredContent must be an object, wrap arrays
      const structuredContent = Array.isArray(result) ? { items: result } : result;

      // Return structured content for programmatic access, plus text fallback
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          structuredContent,
        },
      };
    }

    if (request.method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: 'google-mcp',
            version: '0.1.0',
          },
          capabilities: {
            tools: {},
          },
        },
      };
    }

    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32601,
        message: `Method not found: ${request.method}`,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message,
      },
    };
  }
}
