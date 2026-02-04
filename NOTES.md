# Future Ideas

Non-critical feature ideas for potential future implementation.

## append_rows with field names

Currently `append_rows` with `tableId` requires positional arrays:

```javascript
append_rows({
  tableId: "123",
  values: [[0, 0, -30000, 0, 30, 0, 0, 0]]
})
```

Could add support for named fields using table's `columnProperties`:

```javascript
append_rows({
  tableId: "123",
  rows: [{ "Fecha": "2024-01-15", "Monto": -30000, "Comisión": 30 }]
})
```

Implementation:
1. Fetch table metadata to get column names → indices mapping
2. Convert named object to positional array
3. Send to API

Benefits:
- More readable
- Column order doesn't matter
- Missing columns get empty values

## append_rows table mode: return updated range

The `AppendCellsRequest` via `batchUpdate` doesn't return range info (unlike `values.append`).

Current response:
```json
{
  "spreadsheetId": "...",
  "appendedRows": 1,
  "method": "table"
}
```

Could add:
- Extra API call after append to fetch table's updated range
- Or calculate estimated range from table's start position

Trade-off: extra API call for info that may not be needed.
