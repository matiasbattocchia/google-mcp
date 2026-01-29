# Per-Tool Scope Requirements Pattern

A pattern for implementing granular OAuth scope requirements at the tool level, allowing fine-grained access control in MCP servers.

## Overview

Instead of mapping products to scopes (e.g., "calendar" → all calendar scopes), each tool declares exactly which OAuth scopes it requires. This enables:

- Future read-only access patterns
- Minimal permission requests
- Granular tool filtering based on user's authorized scopes

## Data Model

### 1. Product Scope Definitions

Products define which scopes to request during OAuth:

```typescript
// src/auth/scopes.ts
export const PRODUCT_SCOPES = {
  calendar: {
    label: 'Google Calendar',
    scopes: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
    ],
  },
  sheets: {
    label: 'Google Sheets',
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
    ],
  },
} as const;
```

### 2. Tool Definitions with Scopes

Each tool declares its required scopes:

```typescript
// src/tools/calendar.ts
export const calendarTools = {
  list_calendars: {
    product: 'calendar',
    scopes: ['https://www.googleapis.com/auth/calendar.calendarlist.readonly'],
    description: 'List all calendars',
    parameters: z.object({}),
    execute: async (context: ToolContext) => { /* ... */ },
  },

  create_event: {
    product: 'calendar',
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
    description: 'Create a calendar event',
    parameters: z.object({ /* ... */ }),
    execute: async (context: ToolContext, params) => { /* ... */ },
  },
};
```

### 3. Scope Storage

Store the flat list of authorized scopes with each API key:

```sql
CREATE TABLE api_keys (
  api_key TEXT PRIMARY KEY,
  scopes TEXT NOT NULL,  -- JSON array: ["scope1", "scope2", ...]
  -- ... other fields
);
```

## Tool Filtering Logic

Filter available tools based on user's authorized scopes:

```typescript
async function getAuthorizedTools(userScopes: string[], db: D1Database, apiKey: string) {
  return Object.entries(allTools).filter(([name, tool]) => {
    // Check if user has ALL required scopes for this tool
    const hasRequiredScopes = tool.scopes.every(scope => userScopes.includes(scope));
    if (!hasRequiredScopes) return false;

    // Additional checks (e.g., authorized files for drive.file scope)
    if (tool.product === 'sheets' && name !== 'create_spreadsheet') {
      const hasFiles = await hasAuthorizedFileType(db, apiKey, 'application/vnd.google-apps.spreadsheet');
      return hasFiles;
    }

    return true;
  });
}
```

## Tool Execution Access Check

Verify scopes again when executing a tool:

```typescript
// In your MCP request handler
const tool = allTools[toolName];

const hasAccess = tool.scopes.every(scope => userScopes.includes(scope));
if (!hasAccess) {
  return {
    error: {
      code: -32001,
      message: `Tool "${toolName}" requires additional authorization`,
    },
  };
}

const result = await tool.execute(context, params);
```

## OAuth Flow

1. User selects products (calendar, sheets, etc.)
2. Collect all scopes for selected products:
   ```typescript
   const scopes = selectedProducts.flatMap(p => PRODUCT_SCOPES[p].scopes);
   ```
3. Redirect to OAuth with combined scopes
4. Store authorized scopes with API key
5. Filter tools based on stored scopes

## Type Definitions

```typescript
interface Tool {
  product: string;
  scopes: string[];
  description: string;
  parameters: z.ZodType;
  execute: (context: ToolContext, params: any) => Promise<any>;
}

interface ToolContext {
  accessToken: string;
  db: D1Database;
  apiKey: string;
}
```

## Benefits

1. **Minimal permissions**: Request only what's needed
2. **Future flexibility**: Easy to add read-only tool variants
3. **Clear requirements**: Each tool documents its needs
4. **Graceful degradation**: Users see only tools they can use

## Example: Adding a Read-Only Calendar Product

```typescript
// Add new product with limited scopes
export const PRODUCT_SCOPES = {
  calendar: { /* full access */ },
  calendar_readonly: {
    label: 'Google Calendar (read-only)',
    scopes: [
      'https://www.googleapis.com/auth/calendar.events.readonly',
      'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
    ],
  },
};

// Tools automatically filter - create/update/delete won't appear
// because they require calendar.events (write), not calendar.events.readonly
```

## Migration from Product-Level Scopes

1. Add `scopes` array to each tool definition
2. Remove product-to-scope mapping
3. Update filtering logic to use `tool.scopes.every()`
4. Update access check to use per-tool scopes
5. Existing API keys continue to work (scopes already stored)
