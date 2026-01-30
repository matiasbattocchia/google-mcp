// Google API client utilities for Cloudflare Workers
// Note: We use fetch directly instead of googleapis SDK due to CF Workers compatibility

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const SHEETS_API = 'https://sheets.googleapis.com/v4';

export interface GoogleApiOptions {
  accessToken: string;
}

async function googleFetch(
  url: string,
  options: GoogleApiOptions,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  return response;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google API error (${response.status}): ${error}`);
  }
  return response.json();
}

// Calendar API
export const calendar = {
  async listCalendars(options: GoogleApiOptions) {
    const response = await googleFetch(
      `${CALENDAR_API}/users/me/calendarList`,
      options
    );
    return handleResponse<{ items: CalendarListEntry[] }>(response);
  },

  async freeBusy(
    options: GoogleApiOptions,
    params: {
      timeMin: string;
      timeMax: string;
      calendarIds: string[];
    }
  ) {
    const response = await googleFetch(
      `${CALENDAR_API}/freeBusy`,
      options,
      {
        method: 'POST',
        body: JSON.stringify({
          timeMin: params.timeMin,
          timeMax: params.timeMax,
          items: params.calendarIds.map((id) => ({ id })),
        }),
      }
    );
    return handleResponse<FreeBusyResponse>(response);
  },

  async listEvents(
    options: GoogleApiOptions,
    calendarId: string,
    params?: {
      timeMin?: string;
      timeMax?: string;
      maxResults?: number;
      q?: string;
    }
  ) {
    const searchParams = new URLSearchParams();
    // singleEvents=true expands recurring events into instances, required for proper time filtering
    searchParams.set('singleEvents', 'true');
    // orderBy=startTime is required when singleEvents=true
    searchParams.set('orderBy', 'startTime');
    if (params?.timeMin) searchParams.set('timeMin', params.timeMin);
    if (params?.timeMax) searchParams.set('timeMax', params.timeMax);
    if (params?.maxResults) searchParams.set('maxResults', params.maxResults.toString());
    if (params?.q) searchParams.set('q', params.q);

    const url = `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${searchParams}`;
    const response = await googleFetch(url, options);
    return handleResponse<{ items: CalendarEvent[] }>(response);
  },

  async createEvent(
    options: GoogleApiOptions,
    calendarId: string,
    event: CreateEventRequest,
    sendUpdates?: SendUpdates
  ) {
    const params = sendUpdates ? `?sendUpdates=${sendUpdates}` : '';
    const response = await googleFetch(
      `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events${params}`,
      options,
      {
        method: 'POST',
        body: JSON.stringify(event),
      }
    );
    return handleResponse<CalendarEvent>(response);
  },

  async updateEvent(
    options: GoogleApiOptions,
    calendarId: string,
    eventId: string,
    event: Partial<CreateEventRequest>
  ) {
    const response = await googleFetch(
      `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      options,
      {
        method: 'PATCH',
        body: JSON.stringify(event),
      }
    );
    return handleResponse<CalendarEvent>(response);
  },

  async deleteEvent(options: GoogleApiOptions, calendarId: string, eventId: string) {
    const response = await googleFetch(
      `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      options,
      { method: 'DELETE' }
    );
    if (!response.ok && response.status !== 204) {
      const error = await response.text();
      throw new Error(`Google API error (${response.status}): ${error}`);
    }
    return { success: true };
  },
};

// Sheets API
export const sheets = {
  async getSpreadsheet(options: GoogleApiOptions, spreadsheetId: string) {
    const response = await googleFetch(
      `${SHEETS_API}/spreadsheets/${encodeURIComponent(spreadsheetId)}`,
      options
    );
    return handleResponse<Spreadsheet>(response);
  },

  async readRange(options: GoogleApiOptions, spreadsheetId: string, range: string) {
    const response = await googleFetch(
      `${SHEETS_API}/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`,
      options
    );
    return handleResponse<SheetValues>(response);
  },

  async writeRange(
    options: GoogleApiOptions,
    spreadsheetId: string,
    range: string,
    values: unknown[][],
    valueInputOption: 'RAW' | 'USER_ENTERED' = 'USER_ENTERED'
  ) {
    const response = await googleFetch(
      `${SHEETS_API}/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueInputOption=${valueInputOption}`,
      options,
      {
        method: 'PUT',
        body: JSON.stringify({ values }),
      }
    );
    return handleResponse<UpdateValuesResponse>(response);
  },

  async appendRows(
    options: GoogleApiOptions,
    spreadsheetId: string,
    range: string,
    values: unknown[][],
    valueInputOption: 'RAW' | 'USER_ENTERED' = 'USER_ENTERED'
  ) {
    const response = await googleFetch(
      `${SHEETS_API}/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=${valueInputOption}&insertDataOption=INSERT_ROWS`,
      options,
      {
        method: 'POST',
        body: JSON.stringify({ values }),
      }
    );
    return handleResponse<AppendValuesResponse>(response);
  },

  async createSpreadsheet(options: GoogleApiOptions, title: string) {
    const response = await googleFetch(
      `${SHEETS_API}/spreadsheets`,
      options,
      {
        method: 'POST',
        body: JSON.stringify({
          properties: { title },
        }),
      }
    );
    return handleResponse<Spreadsheet>(response);
  },
};

// User Info API
export async function getUserEmail(accessToken: string): Promise<string> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }
  const data = await response.json() as { email: string };
  return data.email;
}

// Types
export interface CalendarListEntry {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole: string;
}

export interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  location?: string;
  attendees?: { email: string; responseStatus?: string }[];
  status?: string;
  htmlLink?: string;
}

export interface CreateEventRequest {
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  location?: string;
  attendees?: { email: string }[];
  guestsCanModify?: boolean;
  guestsCanInviteOthers?: boolean;
  guestsCanSeeOtherGuests?: boolean;
  colorId?: string;
}

// Google Calendar event color IDs
export const EVENT_COLORS = {
  lavender: '1',
  sage: '2',
  grape: '3',
  flamingo: '4',
  banana: '5',
  tangerine: '6',
  peacock: '7',
  graphite: '8',
  blueberry: '9',
  basil: '10',
  tomato: '11',
} as const;

export type EventColor = keyof typeof EVENT_COLORS;

export interface FreeBusyResponse {
  timeMin: string;
  timeMax: string;
  calendars: {
    [calendarId: string]: {
      busy: { start: string; end: string }[];
      errors?: { domain: string; reason: string }[];
    };
  };
}

export type SendUpdates = 'all' | 'externalOnly' | 'none';

export interface Spreadsheet {
  spreadsheetId: string;
  properties: { title: string };
  sheets: { properties: { sheetId: number; title: string; index: number } }[];
}

export interface SheetValues {
  range: string;
  majorDimension: string;
  values: unknown[][];
}

export interface UpdateValuesResponse {
  spreadsheetId: string;
  updatedRange: string;
  updatedRows: number;
  updatedColumns: number;
  updatedCells: number;
}

export interface AppendValuesResponse {
  spreadsheetId: string;
  tableRange: string;
  updates: UpdateValuesResponse;
}
