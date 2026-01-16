import { z } from 'zod';
import { calendar } from '../../lib/google.ts';

export const calendarTools = {
  list_calendars: {
    product: 'calendar' as const,
    description: 'List all calendars accessible to the user',
    parameters: z.object({}),
    execute: async (accessToken: string) => {
      const result = await calendar.listCalendars({ accessToken });
      return result.items.map((cal) => ({
        id: cal.id,
        name: cal.summary,
        description: cal.description,
        primary: cal.primary ?? false,
        accessRole: cal.accessRole,
      }));
    },
  },

  list_events: {
    product: 'calendar' as const,
    description: 'List events from a calendar within a time range',
    parameters: z.object({
      calendarId: z.string().default('primary').describe('Calendar ID, defaults to primary calendar'),
      timeMin: z.string().optional().describe('Start time in ISO 8601 format (e.g., 2024-01-01T00:00:00Z)'),
      timeMax: z.string().optional().describe('End time in ISO 8601 format'),
      maxResults: z.number().optional().default(50).describe('Maximum number of events to return'),
      query: z.string().optional().describe('Free text search query'),
    }),
    execute: async (accessToken: string, params: {
      calendarId: string;
      timeMin?: string;
      timeMax?: string;
      maxResults?: number;
      query?: string;
    }) => {
      const result = await calendar.listEvents({ accessToken }, params.calendarId, {
        timeMin: params.timeMin,
        timeMax: params.timeMax,
        maxResults: params.maxResults,
        q: params.query,
      });
      return result.items.map((event) => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        location: event.location,
        status: event.status,
        link: event.htmlLink,
        attendees: event.attendees?.map((a) => ({
          email: a.email,
          status: a.responseStatus,
        })),
      }));
    },
  },

  create_event: {
    product: 'calendar' as const,
    description: 'Create a new calendar event',
    parameters: z.object({
      calendarId: z.string().default('primary').describe('Calendar ID, defaults to primary calendar'),
      summary: z.string().describe('Event title'),
      description: z.string().optional().describe('Event description'),
      startDateTime: z.string().describe('Start time in ISO 8601 format'),
      endDateTime: z.string().describe('End time in ISO 8601 format'),
      timeZone: z.string().optional().describe('Time zone (e.g., America/New_York)'),
      location: z.string().optional().describe('Event location'),
      attendees: z.array(z.string()).optional().describe('List of attendee email addresses'),
    }),
    execute: async (accessToken: string, params: {
      calendarId: string;
      summary: string;
      description?: string;
      startDateTime: string;
      endDateTime: string;
      timeZone?: string;
      location?: string;
      attendees?: string[];
    }) => {
      // Detect all-day events (YYYY-MM-DD format) vs timed events
      const isAllDay = (val: string) => /^\d{4}-\d{2}-\d{2}$/.test(val);
      const event = await calendar.createEvent({ accessToken }, params.calendarId, {
        summary: params.summary,
        description: params.description,
        start: isAllDay(params.startDateTime)
          ? { date: params.startDateTime }
          : { dateTime: params.startDateTime, timeZone: params.timeZone },
        end: isAllDay(params.endDateTime)
          ? { date: params.endDateTime }
          : { dateTime: params.endDateTime, timeZone: params.timeZone },
        location: params.location,
        attendees: params.attendees?.map((email) => ({ email })),
      });
      return {
        id: event.id,
        summary: event.summary,
        start: event.start,
        end: event.end,
        link: event.htmlLink,
      };
    },
  },

  update_event: {
    product: 'calendar' as const,
    description: 'Update an existing calendar event',
    parameters: z.object({
      calendarId: z.string().default('primary').describe('Calendar ID'),
      eventId: z.string().describe('Event ID to update'),
      summary: z.string().optional().describe('New event title'),
      description: z.string().optional().describe('New event description'),
      startDateTime: z.string().optional().describe('New start time in ISO 8601 format'),
      endDateTime: z.string().optional().describe('New end time in ISO 8601 format'),
      timeZone: z.string().optional().describe('Time zone'),
      location: z.string().optional().describe('New event location'),
    }),
    execute: async (accessToken: string, params: {
      calendarId: string;
      eventId: string;
      summary?: string;
      description?: string;
      startDateTime?: string;
      endDateTime?: string;
      timeZone?: string;
      location?: string;
    }) => {
      const updateData: Record<string, unknown> = {};
      if (params.summary) updateData.summary = params.summary;
      if (params.description) updateData.description = params.description;
      if (params.location) updateData.location = params.location;
      // Detect all-day events (YYYY-MM-DD format) vs timed events
      const isAllDay = (val: string) => /^\d{4}-\d{2}-\d{2}$/.test(val);
      if (params.startDateTime) {
        updateData.start = isAllDay(params.startDateTime)
          ? { date: params.startDateTime }
          : { dateTime: params.startDateTime, timeZone: params.timeZone };
      }
      if (params.endDateTime) {
        updateData.end = isAllDay(params.endDateTime)
          ? { date: params.endDateTime }
          : { dateTime: params.endDateTime, timeZone: params.timeZone };
      }

      const event = await calendar.updateEvent(
        { accessToken },
        params.calendarId,
        params.eventId,
        updateData
      );
      return {
        id: event.id,
        summary: event.summary,
        start: event.start,
        end: event.end,
        link: event.htmlLink,
      };
    },
  },

  delete_event: {
    product: 'calendar' as const,
    description: 'Delete a calendar event',
    parameters: z.object({
      calendarId: z.string().default('primary').describe('Calendar ID'),
      eventId: z.string().describe('Event ID to delete'),
    }),
    execute: async (accessToken: string, params: { calendarId: string; eventId: string }) => {
      await calendar.deleteEvent({ accessToken }, params.calendarId, params.eventId);
      return { success: true, message: `Event ${params.eventId} deleted` };
    },
  },
};
