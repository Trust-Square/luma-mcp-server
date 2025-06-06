#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

// Types based on our OpenAPI specification
interface LumaApiConfig {
  apiKey: string;
  baseUrl?: string;
}

interface EventDetails {
  api_id: string;
  name: string;
  description?: string;
  start_at: string;
  end_at?: string;
  duration_interval?: string;
  timezone: string;
  event_type?: "in_person" | "online" | "hybrid";
  cover_url?: string;
  url?: string;
  geo_address_json?: {
    city?: string;
    region?: string;
    address?: string;
    country?: string;
    full_address?: string;
    description?: string;
  };
  geo_latitude?: string;
  geo_longitude?: string;
  visibility?: "public" | "private" | "unlisted";
  meeting_url?: string;
  zoom_meeting_url?: string;
  user_api_id?: string;
  calendar_api_id?: string;
  created_at?: string;
}

interface Guest {
  api_id: string;
  name: string;
  email: string;
  approval_status?: "approved" | "pending" | "declined";
  created_at?: string;
  registered_at?: string;
  invited_at?: string;
  joined_at?: string;
  checked_in_at?: string;
  user_api_id?: string;
  user_name?: string;
  user_email?: string;
  user_first_name?: string;
  user_last_name?: string;
  phone_number?: string;
  check_in_qr_code?: string;
  registration_answers?: Array<{
    label: string;
    answer: string;
    question_id: string;
    question_type: string;
  }>;
  event_tickets?: Array<{
    api_id: string;
    name: string;
    amount: number;
    currency: string;
    checked_in_at?: string;
  }>;
  event_ticket?: {
    api_id: string;
    name: string;
    amount: number;
    currency: string;
    checked_in_at?: string;
  };
}

interface GuestEntry {
  api_id: string;
  guest: Guest;
}

interface GuestsListResponse {
  entries: GuestEntry[];
  has_more: boolean;
  next_cursor?: string;
}

interface EventSummary {
  api_id: string;
  event: {
    api_id: string;
    name: string;
    start_at: string;
    end_at?: string;
    timezone: string;
    url?: string;
    cover_url?: string;
    visibility?: "public" | "private" | "unlisted";
    meeting_url?: string;
    zoom_meeting_url?: string;
    geo_address_json?: {
      city?: string;
      region?: string;
      address?: string;
      country?: string;
      full_address?: string;
    };
    duration_interval?: string;
  };
  tags?: Array<{
    api_id: string;
    name: string;
  }>;
}

interface EventsListResponse {
  entries: EventSummary[];
  has_more: boolean;
  next_cursor?: string;
}

class LumaMCPServer {
  private config: LumaApiConfig;
  private readonly baseUrl = "https://api.lu.ma/public/v1";
  private readonly publicApiBaseUrl = "https://public-api.lu.ma/public/v1";

  constructor(config: LumaApiConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || this.baseUrl,
    };
  }

  private async makeRequest(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: any,
    usePublicApi: boolean = false
  ): Promise<any> {
    const baseUrl = usePublicApi ? this.publicApiBaseUrl : this.config.baseUrl;
    const url = `${baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      "x-luma-api-key": this.config.apiKey,
      "Content-Type": "application/json",
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage: string;
        
        switch (response.status) {
          case 401:
            errorMessage = "Unauthorized: Invalid API key or insufficient permissions";
            break;
          case 404:
            errorMessage = "Not found: Event or resource does not exist";
            break;
          case 429:
            errorMessage = "Rate limited: Too many requests. Wait 1 minute before retrying";
            break;
          default:
            errorMessage = `API error (${response.status}): ${errorText}`;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Lu.ma API error: ${errorMessage}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async listEvents(options?: {
    paginationCursor?: string;
    paginationLimit?: number;
    after?: string;
    before?: string;
    seriesMode?: "instances" | "series";
    includeCancelled?: boolean;
  }): Promise<EventsListResponse> {
    const params = new URLSearchParams();
    
    if (options?.paginationCursor) {
      params.append("pagination_cursor", options.paginationCursor);
    }
    
    if (options?.paginationLimit) {
      params.append("pagination_limit", options.paginationLimit.toString());
    }
    
    if (options?.after) {
      params.append("after", options.after);
    }
    
    if (options?.before) {
      params.append("before", options.before);
    }
    
    if (options?.seriesMode) {
      params.append("series_mode", options.seriesMode);
    }
    
    if (options?.includeCancelled !== undefined) {
      params.append("include_cancelled", options.includeCancelled.toString());
    }

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return await this.makeRequest(`/calendar/list-events${queryString}`, "GET", undefined, true);
  }

  async getAllEvents(): Promise<EventSummary[]> {
    const allEvents: EventSummary[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const response = await this.listEvents({
        paginationCursor: cursor,
        paginationLimit: 100, // Max allowed per request
      });

      allEvents.push(...response.entries);
      hasMore = response.has_more;
      cursor = response.next_cursor;
    }

    return allEvents;
  }

  async getEvent(eventApiId: string): Promise<EventDetails> {
    // Fixed: Use 'api_id' parameter name as per the API documentation
    const params = new URLSearchParams({ api_id: eventApiId });
    const response = await this.makeRequest(`/event/get?${params}`);
    
    // The API returns the event data nested under an "event" key
    if (!response.event) {
      throw new McpError(
        ErrorCode.InternalError,
        "Invalid API response: missing event data"
      );
    }
    
    return response.event;
  }

  async getEventGuest(
    eventApiId: string,
    guestIdentifier: { guestApiId?: string; email?: string; proxyKey?: string }
  ): Promise<Guest> {
    // Guest endpoints use 'event_api_id' parameter name
    const params = new URLSearchParams({ event_api_id: eventApiId });
    
    if (guestIdentifier.guestApiId) {
      params.append("guest_api_id", guestIdentifier.guestApiId);
    } else if (guestIdentifier.email) {
      params.append("email", guestIdentifier.email);
    } else if (guestIdentifier.proxyKey) {
      params.append("proxy_key", guestIdentifier.proxyKey);
    } else {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Must provide either guestApiId, email, or proxyKey to identify the guest"
      );
    }

    const response = await this.makeRequest(`/event/get-guest?${params}`);
    
    // The API returns the guest data nested under a "guest" key
    if (!response.guest) {
      throw new McpError(
        ErrorCode.InternalError,
        "Invalid API response: missing guest data"
      );
    }
    
    return response.guest;
  }

  async getEventGuests(
    eventApiId: string,
    options?: {
      paginationCursor?: string;
      paginationLimit?: number;
    }
  ): Promise<GuestsListResponse> {
    // Guest endpoints use 'event_api_id' parameter name
    const params = new URLSearchParams({ event_api_id: eventApiId });
    
    if (options?.paginationCursor) {
      params.append("pagination_cursor", options.paginationCursor);
    }
    
    if (options?.paginationLimit) {
      params.append("pagination_limit", options.paginationLimit.toString());
    }

    return await this.makeRequest(`/event/get-guests?${params}`);
  }

  async getAllEventGuests(eventApiId: string): Promise<Guest[]> {
    const allGuests: Guest[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getEventGuests(eventApiId, {
        paginationCursor: cursor,
        paginationLimit: 100, // Max allowed per request
      });

      // Extract guest data from each entry
      allGuests.push(...response.entries.map(entry => entry.guest));
      hasMore = response.has_more;
      cursor = response.next_cursor;
    }

    return allGuests;
  }

  async updateEvent(eventApiId: string, updates: Partial<EventDetails>): Promise<EventDetails> {
    const body = {
      api_id: eventApiId,
      ...updates
    };

    const response = await this.makeRequest(`/event/update`, "POST", body, true);
    
    // The API returns the event data nested under an "event" key
    if (!response.event) {
      throw new McpError(
        ErrorCode.InternalError,
        "Invalid API response: missing event data"
      );
    }
    
    return response.event;
  }
}

// Main MCP Server Implementation
const server = new Server(
  {
    name: "luma-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let lumaClient: LumaMCPServer | null = null;

// Initialize the Luma client
function initializeLumaClient(): LumaMCPServer {
  const apiKey = process.env.LUMA_API_KEY;
  
  if (!apiKey) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      "LUMA_API_KEY environment variable is required"
    );
  }

  return new LumaMCPServer({ apiKey });
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_events",
        description: "📅 Browse Events - List your Lu.ma events with optional date filtering and pagination",
        inputSchema: {
          type: "object",
          properties: {
            pagination_cursor: {
              type: "string",
              description: "Continue from a previous page (leave empty for first page)",
            },
            pagination_limit: {
              type: "number",
              description: "Number of events to show (1-100, default 50)",
              minimum: 1,
              maximum: 100,
            },
            after: {
              type: "string",
              description: "Show events starting after this date (e.g., '2025-06-01T00:00:00Z')",
            },
            before: {
              type: "string",
              description: "Show events starting before this date (e.g., '2025-12-31T23:59:59Z')",
            },
            series_mode: {
              type: "string",
              description: "How to handle recurring events",
              enum: ["instances", "series"],
            },
            include_cancelled: {
              type: "boolean",
              description: "Include cancelled events in results (default: false)",
            },
          },
          required: [],
        },
      },
      {
        name: "get_all_events",
        description: "📊 All Events Overview - Get complete analytics and overview of all your events",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_event",
        description: "🔍 Event Details - Get comprehensive information about a specific event",
        inputSchema: {
          type: "object",
          properties: {
            api_id: {
              type: "string",
              description: "The event ID (e.g., 'evt-12345') - you can find this from list_events",
            },
          },
          required: ["api_id"],
        },
      },
      {
        name: "get_event_guest",
        description: "👤 Individual Guest - Get detailed information about a specific guest",
        inputSchema: {
          type: "object",
          properties: {
            api_id: {
              type: "string",
              description: "The event ID where the guest is registered",
            },
            guest_api_id: {
              type: "string",
              description: "The guest's ID (use this OR email OR proxy_key)",
            },
            email: {
              type: "string",
              description: "Guest's email address (use this OR guest_api_id OR proxy_key)",
            },
            proxy_key: {
              type: "string",
              description: "Guest's proxy key (use this OR guest_api_id OR email)",
            },
          },
          required: ["api_id"],
        },
      },
      {
        name: "get_event_guests",
        description: "👥 Guest List - Get a paginated list of all guests for an event",
        inputSchema: {
          type: "object",
          properties: {
            api_id: {
              type: "string",
              description: "The event ID to get guests for",
            },
            pagination_cursor: {
              type: "string",
              description: "Continue from a previous page (leave empty for first page)",
            },
            pagination_limit: {
              type: "number",
              description: "Number of guests to show (1-100, default 50)",
              minimum: 1,
              maximum: 100,
            },
          },
          required: ["api_id"],
        },
      },
      {
        name: "get_all_event_guests",
        description: "📋 Complete Guest Analytics - Get all guests for an event with status breakdown and analytics",
        inputSchema: {
          type: "object",
          properties: {
            api_id: {
              type: "string",
              description: "The event ID to analyze all guests for",
            },
          },
          required: ["api_id"],
        },
      },
      {
        name: "get_event_summary",
        description: "📈 Event Report - Get a comprehensive summary combining event details with guest analytics",
        inputSchema: {
          type: "object",
          properties: {
            api_id: {
              type: "string",
              description: "The event ID to create a summary report for",
            },
            include_guest_details: {
              type: "boolean",
              description: "Include detailed guest analytics in the summary (default: true)",
              default: true,
            },
          },
          required: ["api_id"],
        },
      },
      {
        name: "update_event",
        description: "✏️ Update Event - Update event details (requires approval before making changes)",
        inputSchema: {
          type: "object",
          properties: {
            api_id: {
              type: "string",
              description: "The event ID to update (e.g., 'evt-12345')",
            },
            name: {
              type: "string",
              description: "New event name",
            },
            description: {
              type: "string",
              description: "New event description",
            },
            start_at: {
              type: "string",
              description: "New start date/time (ISO 8601 format, e.g., '2025-06-15T18:00:00Z')",
            },
            end_at: {
              type: "string",
              description: "New end date/time (ISO 8601 format)",
            },
            timezone: {
              type: "string",
              description: "New timezone (e.g., 'America/New_York', 'Europe/London')",
            },
            event_type: {
              type: "string",
              description: "Event type",
              enum: ["in_person", "online", "hybrid"],
            },
            geo_address_json: {
              type: "object",
              description: "Location details for in-person events",
              properties: {
                city: { type: "string" },
                region: { type: "string" },
                address: { type: "string" },
                country: { type: "string" },
                full_address: { type: "string" },
                description: { type: "string" },
              },
            },
            geo_latitude: {
              type: "string",
              description: "Latitude for location",
            },
            geo_longitude: {
              type: "string",
              description: "Longitude for location",
            },
            visibility: {
              type: "string",
              description: "Event visibility",
              enum: ["public", "private", "unlisted"],
            },
            meeting_url: {
              type: "string",
              description: "Meeting URL for online events",
            },
            zoom_meeting_url: {
              type: "string",
              description: "Zoom meeting URL",
            },
            cover_url: {
              type: "string",
              description: "URL for event cover image",
            },
            require_approval: {
              type: "boolean",
              description: "Ask for approval before making changes (default: true)",
              default: true,
            },
          },
          required: ["api_id"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (!lumaClient) {
    lumaClient = initializeLumaClient();
  }

  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_events": {
        const { 
          pagination_cursor, 
          pagination_limit, 
          after, 
          before, 
          series_mode, 
          include_cancelled 
        } = args as {
          pagination_cursor?: string;
          pagination_limit?: number;
          after?: string;
          before?: string;
          series_mode?: "instances" | "series";
          include_cancelled?: boolean;
        };

        const response = await lumaClient.listEvents({
          paginationCursor: pagination_cursor,
          paginationLimit: pagination_limit,
          after,
          before,
          seriesMode: series_mode,
          includeCancelled: include_cancelled,
        });

        // Helper function to determine event type from nested event data
        const getEventType = (eventEntry: EventSummary) => {
          const event = eventEntry.event;
          if (event.meeting_url || event.zoom_meeting_url) {
            return event.geo_address_json ? "hybrid" : "online";
          }
          return event.geo_address_json ? "in_person" : "unknown";
        };

        const eventsList = response.entries
          .map((eventEntry, index) => {
            const event = eventEntry.event; // Access nested event data
            return `${index + 1}. **${event.name}** (${event.api_id})
   - Type: ${getEventType(eventEntry)}
   - Start: ${new Date(event.start_at).toLocaleString()}
   - Timezone: ${event.timezone}
   - Visibility: ${event.visibility || "public"}
   - URL: ${event.url || "Not available"}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `Events List (Page Results):

**Pagination Info:**
- Showing ${response.entries.length} events
- Has more pages: ${response.has_more ? "Yes" : "No"}
- Next cursor: ${response.next_cursor || "None"}

**Date Range:**
${after ? `- After: ${new Date(after).toLocaleString()}` : ""}
${before ? `- Before: ${new Date(before).toLocaleString()}` : ""}
${after || before ? "" : "- All dates"}

**Events:**
${eventsList || "No events found"}`,
            },
          ],
        };
      }

      case "get_all_events": {
        const allEvents = await lumaClient.getAllEvents();

        // Group events by visibility (since status isn't available in list response)
        const eventsByVisibility = allEvents.reduce((acc, eventEntry) => {
          const visibility = eventEntry.event.visibility || "public";
          acc[visibility] = acc[visibility] || [];
          acc[visibility].push(eventEntry);
          return acc;
        }, {} as Record<string, EventSummary[]>);

        const visibilitySummary = Object.entries(eventsByVisibility)
          .map(([visibility, events]) => `- ${visibility.charAt(0).toUpperCase() + visibility.slice(1)}: ${events.length}`)
          .join("\n");

        // Helper function to determine event type
        const getEventType = (eventEntry: EventSummary) => {
          const event = eventEntry.event;
          if (event.meeting_url || event.zoom_meeting_url) {
            return event.geo_address_json ? "hybrid" : "online";
          }
          return event.geo_address_json ? "in_person" : "unknown";
        };

        // Group by event type
        const eventsByType = allEvents.reduce((acc, eventEntry) => {
          const type = getEventType(eventEntry);
          acc[type] = acc[type] || [];
          acc[type].push(eventEntry);
          return acc;
        }, {} as Record<string, EventSummary[]>);

        const typeSummary = Object.entries(eventsByType)
          .map(([type, events]) => `- ${type.replace("_", " ")}: ${events.length}`)
          .join("\n");

        // Create chronological list
        const sortedEvents = allEvents
          .sort((a, b) => new Date(a.event.start_at).getTime() - new Date(b.event.start_at).getTime())
          .map((eventEntry, index) => {
            const event = eventEntry.event;
            return `${index + 1}. **${event.name}** (${event.api_id})
   - Start: ${new Date(event.start_at).toLocaleString()}
   - Type: ${getEventType(eventEntry)} | Visibility: ${event.visibility || "public"}
   - Location: ${event.geo_address_json?.city || "Not specified"}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `All Events Summary:

**Overview:**
- Total Events: ${allEvents.length}

**By Visibility:**
${visibilitySummary}

**By Type:**
${typeSummary}

**All Events (Chronological):**
${sortedEvents || "No events found"}`,
            },
          ],
        };
      }

      case "get_event": {
        const { api_id } = args as { api_id: string };
        const event = await lumaClient.getEvent(api_id);
        
        // Helper function to extract location info
        const getLocationText = (event: EventDetails) => {
          if (event.geo_address_json) {
            const addr = event.geo_address_json;
            return `- Address: ${addr.full_address || addr.address || "Not specified"}
- City: ${addr.city || "Not specified"}
- Country: ${addr.country || "Not specified"}`;
          }
          return "- No location information available";
        };

        // Helper function to determine event type
        const getEventType = (event: EventDetails) => {
          if (event.meeting_url || event.zoom_meeting_url) {
            return event.geo_address_json ? "hybrid" : "online";
          }
          return event.geo_address_json ? "in_person" : "unknown";
        };

        // Helper function to parse duration
        const getDuration = (event: EventDetails) => {
          if (event.duration_interval) {
            // Parse ISO 8601 duration format like "P0Y0M1DT11H0M0S"
            const match = event.duration_interval.match(/P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/);
            if (match) {
              const [, years, months, days, hours, minutes, seconds] = match;
              const parts = [];
              if (days && parseInt(days) > 0) parts.push(`${days} day${parseInt(days) > 1 ? 's' : ''}`);
              if (hours && parseInt(hours) > 0) parts.push(`${hours} hour${parseInt(hours) > 1 ? 's' : ''}`);
              if (minutes && parseInt(minutes) > 0) parts.push(`${minutes} minute${parseInt(minutes) > 1 ? 's' : ''}`);
              return parts.join(', ') || 'Unknown duration';
            }
          }
          return event.end_at ? 
            `${Math.round((new Date(event.end_at).getTime() - new Date(event.start_at).getTime()) / (1000 * 60 * 60))} hours` : 
            "Not specified";
        };
        
        return {
          content: [
            {
              type: "text",
              text: `Event Details for ${event.name}:
                
**Basic Information:**
- Event ID: ${event.api_id}
- Name: ${event.name}
- Description: ${event.description ? event.description.substring(0, 500) + (event.description.length > 500 ? '...' : '') : "No description provided"}
- Type: ${getEventType(event)}
- Timezone: ${event.timezone}
- Visibility: ${event.visibility}

**Timing:**
- Start: ${new Date(event.start_at).toLocaleString()}
- End: ${event.end_at ? new Date(event.end_at).toLocaleString() : "Not specified"}
- Duration: ${getDuration(event)}

**Location:**
${getLocationText(event)}

**Meeting Info:**
- Event URL: ${event.url || "Not available"}
- Meeting URL: ${event.meeting_url || event.zoom_meeting_url || "No online meeting"}
- Cover Image: ${event.cover_url || "Not available"}

**Additional Info:**
- Created: ${event.created_at ? new Date(event.created_at).toLocaleString() : "Not available"}
- Calendar ID: ${event.calendar_api_id || "Not available"}`,
            },
          ],
        };
      }

      case "get_event_guest": {
        const { api_id, guest_api_id, email, proxy_key } = args as {
          api_id: string;
          guest_api_id?: string;
          email?: string;
          proxy_key?: string;
        };

        const guest = await lumaClient.getEventGuest(api_id, {
          guestApiId: guest_api_id,
          email,
          proxyKey: proxy_key,
        });

        // Helper function to format registration answers
        const formatAnswers = (answers?: Array<{label: string; answer: string; question_type: string}>) => {
          if (!answers || answers.length === 0) return "None";
          return answers.map(a => `${a.label}: ${a.answer}`).join("\n  ");
        };

        return {
          content: [
            {
              type: "text",
              text: `Guest Information:
                
**Basic Details:**
- Guest ID: ${guest.api_id}
- Name: ${guest.name}
- Email: ${guest.email}
- Approval Status: ${guest.approval_status || "Not applicable"}

**Registration Details:**
- Registered: ${guest.registered_at ? new Date(guest.registered_at).toLocaleString() : "Not available"}
- Invited: ${guest.invited_at ? new Date(guest.invited_at).toLocaleString() : "Not invited"}
- Joined: ${guest.joined_at ? new Date(guest.joined_at).toLocaleString() : "Not joined"}
- Checked In: ${guest.checked_in_at ? new Date(guest.checked_in_at).toLocaleString() : "Not checked in"}

**Contact Info:**
- Phone: ${guest.phone_number || "Not provided"}
- User ID: ${guest.user_api_id || "Not available"}

**Registration Answers:**
  ${formatAnswers(guest.registration_answers)}

**Ticket Info:**
- Ticket: ${guest.event_ticket?.name || "No ticket"}
- Amount: ${guest.event_ticket ? `${guest.event_ticket.currency?.toUpperCase()} ${guest.event_ticket.amount}` : "N/A"}

**Check-in:**
- QR Code: ${guest.check_in_qr_code || "Not available"}`,
            },
          ],
        };
      }

      case "get_event_guests": {
        const { api_id, pagination_cursor, pagination_limit } = args as {
          api_id: string;
          pagination_cursor?: string;
          pagination_limit?: number;
        };

        const response = await lumaClient.getEventGuests(api_id, {
          paginationCursor: pagination_cursor,
          paginationLimit: pagination_limit,
        });

        const guestsList = response.entries
          .map((guestEntry, index) => {
            const guest = guestEntry.guest;
            return `${index + 1}. ${guest.name} (${guest.email}) - Status: ${guest.approval_status || "pending"}`;
          })
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `Event Guests (Page Results):

**Pagination Info:**
- Showing ${response.entries.length} guests
- Has more pages: ${response.has_more ? "Yes" : "No"}
- Next cursor: ${response.next_cursor || "None"}

**Guests:**
${guestsList || "No guests found"}`,
            },
          ],
        };
      }

      case "get_all_event_guests": {
        const { api_id } = args as { api_id: string };
        const allGuests = await lumaClient.getAllEventGuests(api_id);

        // Group guests by approval status
        const guestsByStatus = allGuests.reduce((acc, guest) => {
          const status = guest.approval_status || "pending";
          acc[status] = acc[status] || [];
          acc[status].push(guest);
          return acc;
        }, {} as Record<string, Guest[]>);

        const statusSummary = Object.entries(guestsByStatus)
          .map(([status, guests]) => `- ${status}: ${guests.length}`)
          .join("\n");

        const guestsList = allGuests
          .map((guest, index) => {
            const company = guest.registration_answers?.find(a => a.question_type === "company")?.answer || "Not specified";
            return `${index + 1}. ${guest.name} (${guest.email}) - ${guest.approval_status || "pending"}
   Company: ${company}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `All Event Guests:

**Summary:**
- Total Guests: ${allGuests.length}

**By Approval Status:**
${statusSummary}

**Complete Guest List:**
${guestsList || "No guests found"}`,
            },
          ],
        };
      }

      case "get_event_summary": {
        const { api_id, include_guest_details = true } = args as {
          api_id: string;
          include_guest_details?: boolean;
        };

        // Get event details
        const event = await lumaClient.getEvent(api_id);
        
        // Helper function to determine event type
        const getEventType = (event: EventDetails) => {
          if (event.meeting_url || event.zoom_meeting_url) {
            return event.geo_address_json ? "hybrid" : "online";
          }
          return event.geo_address_json ? "in_person" : "unknown";
        };

        // Helper function to parse duration
        const getDuration = (event: EventDetails) => {
          if (event.duration_interval) {
            // Parse ISO 8601 duration format like "P0Y0M1DT11H0M0S"
            const match = event.duration_interval.match(/P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/);
            if (match) {
              const [, years, months, days, hours, minutes, seconds] = match;
              const parts = [];
              if (days && parseInt(days) > 0) parts.push(`${days} day${parseInt(days) > 1 ? 's' : ''}`);
              if (hours && parseInt(hours) > 0) parts.push(`${hours} hour${parseInt(hours) > 1 ? 's' : ''}`);
              if (minutes && parseInt(minutes) > 0) parts.push(`${minutes} minute${parseInt(minutes) > 1 ? 's' : ''}`);
              return parts.join(', ') || 'Unknown duration';
            }
          }
          return event.end_at ? 
            `${Math.round((new Date(event.end_at).getTime() - new Date(event.start_at).getTime()) / (1000 * 60 * 60))} hours` : 
            "Not specified";
        };

        // Helper function to get location
        const getLocation = (event: EventDetails) => {
          if (event.geo_address_json) {
            return event.geo_address_json.city || event.geo_address_json.address || "Not specified";
          }
          return "Not specified";
        };
        
        let guestSummary = "";
        if (include_guest_details) {
          const allGuests = await lumaClient.getAllEventGuests(api_id);
          
          // Group guests by approval status
          const guestsByStatus = allGuests.reduce((acc, guest) => {
            const status = guest.approval_status || "pending";
            acc[status] = acc[status] || [];
            acc[status].push(guest);
            return acc;
          }, {} as Record<string, Guest[]>);

          const statusBreakdown = Object.entries(guestsByStatus)
            .map(([status, guests]) => `  - ${status.charAt(0).toUpperCase() + status.slice(1)}: ${guests.length}`)
            .join("\n");

          guestSummary = `
**Guest Summary:**
- Total Registered: ${allGuests.length}
${statusBreakdown}`;
        }

        return {
          content: [
            {
              type: "text",
              text: `Complete Event Summary for "${event.name}":

**Event Details:**
- Event ID: ${event.api_id}
- Type: ${getEventType(event)}
- Start: ${new Date(event.start_at).toLocaleString()}
- Duration: ${getDuration(event)}
- Location: ${getLocation(event)}
- Visibility: ${event.visibility || "Public"}
- Event URL: ${event.url || "Not available"}${guestSummary}`,
            },
          ],
        };
      }

      case "update_event": {
        const { api_id, require_approval = true, ...updates } = args as {
          api_id: string;
          require_approval?: boolean;
          name?: string;
          description?: string;
          start_at?: string;
          end_at?: string;
          timezone?: string;
          event_type?: "in_person" | "online" | "hybrid";
          geo_address_json?: any;
          geo_latitude?: string;
          geo_longitude?: string;
          visibility?: "public" | "private" | "unlisted";
          meeting_url?: string;
          zoom_meeting_url?: string;
          cover_url?: string;
        };

        // First, get the current event details
        const currentEvent = await lumaClient.getEvent(api_id);
        
        // Format the changes for display
        const changes: string[] = [];
        
        if (updates.name && updates.name !== currentEvent.name) {
          changes.push(`- Name: "${currentEvent.name}" → "${updates.name}"`);
        }
        if (updates.description !== undefined && updates.description !== currentEvent.description) {
          const currentDesc = currentEvent.description ? `"${currentEvent.description.substring(0, 50)}${currentEvent.description.length > 50 ? '...' : ''}"` : "(empty)";
          const newDesc = updates.description ? `"${updates.description.substring(0, 50)}${updates.description.length > 50 ? '...' : ''}"` : "(empty)";
          changes.push(`- Description: ${currentDesc} → ${newDesc}`);
        }
        if (updates.start_at && updates.start_at !== currentEvent.start_at) {
          changes.push(`- Start: ${new Date(currentEvent.start_at).toLocaleString()} → ${new Date(updates.start_at).toLocaleString()}`);
        }
        if (updates.end_at !== undefined && updates.end_at !== currentEvent.end_at) {
          const currentEnd = currentEvent.end_at ? new Date(currentEvent.end_at).toLocaleString() : "Not set";
          const newEnd = updates.end_at ? new Date(updates.end_at).toLocaleString() : "Not set";
          changes.push(`- End: ${currentEnd} → ${newEnd}`);
        }
        if (updates.timezone && updates.timezone !== currentEvent.timezone) {
          changes.push(`- Timezone: ${currentEvent.timezone} → ${updates.timezone}`);
        }
        if (updates.visibility && updates.visibility !== currentEvent.visibility) {
          changes.push(`- Visibility: ${currentEvent.visibility || "public"} → ${updates.visibility}`);
        }
        if (updates.event_type) {
          const currentType = currentEvent.meeting_url || currentEvent.zoom_meeting_url ? 
            (currentEvent.geo_address_json ? "hybrid" : "online") : 
            (currentEvent.geo_address_json ? "in_person" : "unknown");
          if (updates.event_type !== currentType) {
            changes.push(`- Type: ${currentType} → ${updates.event_type}`);
          }
        }
        if (updates.meeting_url !== undefined && updates.meeting_url !== currentEvent.meeting_url) {
          const currentUrl = currentEvent.meeting_url || "Not set";
          const newUrl = updates.meeting_url || "Not set";
          changes.push(`- Meeting URL: ${currentUrl} → ${newUrl}`);
        }
        if (updates.geo_address_json) {
          changes.push(`- Location updated`);
        }
        
        if (changes.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No changes to apply. All provided values match the current event details.",
              },
            ],
          };
        }

        // Build the approval message
        const approvalMessage = `**Update Event: ${currentEvent.name}**

Proposed changes:
${changes.join('\n')}

**Do you want to proceed with these updates?**`;
        
        if (require_approval) {
          // Return the approval request without making changes
          return {
            content: [
              {
                type: "text",
                text: approvalMessage + "\n\n⚠️ **No changes have been made yet.** To apply these updates, run the command again with `require_approval: false`.",
              },
            ],
          };
        } else {
          // Actually update the event
          try {
            const updatedEvent = await lumaClient.updateEvent(api_id, updates);
            
            return {
              content: [
                {
                  type: "text",
                  text: `✅ **Event Updated Successfully!**

Applied changes:
${changes.join('\n')}

**Updated Event Details:**
- Event ID: ${updatedEvent.api_id}
- Name: ${updatedEvent.name}
- Start: ${new Date(updatedEvent.start_at).toLocaleString()}
- Timezone: ${updatedEvent.timezone}
- Visibility: ${updatedEvent.visibility || "public"}
- URL: ${updatedEvent.url || "Not available"}`,
                },
              ],
            };
          } catch (error) {
            throw new McpError(
              ErrorCode.InternalError,
              `Failed to update event: ${error instanceof Error ? error.message : "Unknown error"}`
            );
          }
        }
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Lu.ma MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});