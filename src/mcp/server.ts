import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { calendarTools } from './tools/calendar.ts';
import { sheetsTools } from './tools/sheets.ts';

// Combine all tools
const allTools = {
  ...calendarTools,
  ...sheetsTools,
};

type ToolName = keyof typeof allTools;

// Map products to their required scopes
const productScopes: Record<string, string> = {
  calendar: 'https://www.googleapis.com/auth/calendar',
  sheets: 'https://www.googleapis.com/auth/spreadsheets',
};

// Filter tools based on authorized scopes
function getAuthorizedTools(scopes: string[]) {
  return Object.entries(allTools).filter(([_, tool]) => {
    const requiredScope = productScopes[tool.product];
    return scopes.includes(requiredScope);
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
  scopes: string[]
): Promise<McpHttpResponse> {
  const authorizedTools = getAuthorizedTools(scopes);

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
      const requiredScope = productScopes[tool.product];
      if (!scopes.includes(requiredScope)) {
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
      const result = await tool.execute(accessToken, toolParams as any);

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
