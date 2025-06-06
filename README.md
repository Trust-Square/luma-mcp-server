# Lu.ma MCP Server

A Model Context Protocol (MCP) server that provides AI agents with the ability to interact with the Lu.ma API for event and guest management.

## Features

This MCP server enables AI agents to:

- **Multi-Calendar Support**: Manage multiple Lu.ma calendars with different API keys
- **Easy Setup**: Configure API credentials through natural language commands
- **Get Event Information**: Retrieve detailed information about Lu.ma events
- **Update Events**: Modify event details with a built-in approval workflow
- **Manage Guest Data**: Access guest lists, individual guest details, and registration information
- **Handle Pagination**: Automatically manage large guest lists with built-in pagination support
- **Comprehensive Summaries**: Generate complete event summaries with guest analytics

## Prerequisites

- Node.js 18.0.0 or higher
- Lu.ma Plus subscription (required for API access)
- Lu.ma API key

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/luma-mcp-server.git
cd luma-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Configuration

### Quick Setup with AI

The easiest way to configure the server is through the AI interface. Each Lu.ma API key is valid for a single calendar, but you can manage multiple calendars:

```
You: Please add my personal Lu.ma calendar with API key "luma_api_personal123"

AI: I'll configure your personal calendar with the provided API key.
[Configures calendar and validates it]
Calendar Added: personal
- Found 5 event(s) in this calendar
- Set as default calendar

You: Now add my work calendar with key "luma_api_work456"

AI: I'll add your work calendar.
[Configures second calendar]
Calendar Added: work
- Found 12 event(s) in this calendar
```

### Manual Setup

Create a `luma-config.json` file in the project root:

```json
{
  "calendars": [
    {
      "name": "personal",
      "apiKey": "your-personal-calendar-api-key",
      "description": "Personal events calendar"
    },
    {
      "name": "work",
      "apiKey": "your-work-calendar-api-key",
      "description": "Work events and meetings"
    }
  ],
  "defaultCalendar": "personal"
}
```



### Getting Your API Key

1. Log in to your Lu.ma account
2. Ensure you have a Lu.ma Plus subscription
3. Navigate to your dashboard
4. Generate an API key in the API settings section

**⚠️ Important**: Keep your API key secure and never commit it to version control.

## Usage

### Running the Server

Start the MCP server:

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### Available Tools

The server provides the following tools for AI agents:

#### 1. `configure_calendar`
Add or update a Lu.ma calendar with API key.

**Parameters:**
- `name` (string, required): Name for this calendar (e.g., 'personal', 'work')
- `api_key` (string, required): API key for this calendar
- `description` (string, optional): Description for this calendar
- `set_as_default` (boolean, optional): Set as default calendar
- `validate` (boolean, optional): Test the API key (default: true)

#### 2. `list_calendars`
Show all configured calendars.

**Parameters:** None

#### 3. `switch_calendar`
Change the active calendar for subsequent operations.

**Parameters:**
- `name` (string, required): Name of the calendar to switch to

#### 4. `remove_calendar`
Remove a calendar configuration.

**Parameters:**
- `name` (string, required): Name of the calendar to remove
- `confirm` (boolean, optional): Confirm removal (default: false)

#### 5. `list_events`
Browse your Lu.ma events with optional date filtering and pagination.

**Parameters:**
- `pagination_cursor` (string, optional): Continue from a previous page
- `pagination_limit` (number, optional): Number of events to show (1-100, default 50)
- `after` (string, optional): Show events starting after this date (ISO 8601 format)
- `before` (string, optional): Show events starting before this date (ISO 8601 format)
- `series_mode` (string, optional): How to handle recurring events ('instances' or 'series')
- `include_cancelled` (boolean, optional): Include cancelled events (default: false)

#### 6. `get_all_events`
Get complete analytics and overview of all your events (automatically handles pagination).

**Parameters:** None

#### 7. `get_event`
Get detailed information about a specific event.

**Parameters:**
- `event_api_id` (string, required): The API ID of the event

**Example Response:**
```
Event Details for Tech Meetup:
- Event ID: evt-12345
- Name: Tech Meetup
- Type: in_person
- Start: 12/15/2024, 6:00:00 PM
- Location: Conference Center
```

#### 8. `get_event_guest`
Get information about a specific guest.

**Parameters:**
- `event_api_id` (string, required): The API ID of the event
- `guest_api_id` (string, optional): The API ID of the guest
- `email` (string, optional): Email address of the guest
- `proxy_key` (string, optional): Proxy key of the guest

*Note: Provide one of guest_api_id, email, or proxy_key to identify the guest.*

#### 9. `get_event_guests`
Get a paginated list of guests for an event.

**Parameters:**
- `event_api_id` (string, required): The API ID of the event
- `pagination_cursor` (string, optional): Cursor for pagination
- `pagination_limit` (number, optional): Number of guests to return (1-100)

#### 10. `get_all_event_guests`
Get all guests for an event (automatically handles pagination).

**Parameters:**
- `event_api_id` (string, required): The API ID of the event

#### 11. `get_event_summary`
Get a comprehensive summary including event details and guest analytics.

**Parameters:**
- `event_api_id` (string, required): The API ID of the event
- `include_guest_details` (boolean, optional): Include guest information (default: true)

#### 12. `update_event`
Update event details with approval workflow.

**Parameters:**
- `api_id` (string, required): The API ID of the event to update
- `require_approval` (boolean, optional): Ask for approval before making changes (default: true)
- `name` (string, optional): New event name
- `description` (string, optional): New event description
- `start_at` (string, optional): New start date/time (ISO 8601 format)
- `end_at` (string, optional): New end date/time (ISO 8601 format)
- `timezone` (string, optional): New timezone (e.g., 'America/New_York')
- `event_type` (string, optional): Event type ('in_person', 'online', or 'hybrid')
- `visibility` (string, optional): Event visibility ('public', 'private', or 'unlisted')
- `meeting_url` (string, optional): Meeting URL for online events
- `cover_url` (string, optional): URL for event cover image
- `geo_address_json` (object, optional): Location details for in-person events

**Example Usage:**
```
# First call - shows proposed changes and asks for approval
update_event(api_id="evt-12345", name="Updated Tech Meetup", start_at="2024-12-20T18:00:00Z")

# Second call - applies the changes
update_event(api_id="evt-12345", name="Updated Tech Meetup", start_at="2024-12-20T18:00:00Z", require_approval=false)
```

**Note:** This tool implements a two-step approval process by default. The first call shows what changes will be made without applying them. To actually update the event, call the tool again with `require_approval: false`.

### Integration with MCP Clients

To use this server with an MCP-compatible AI client, configure the client to connect to this server using stdio transport.

Example configuration for Claude Desktop:

```json
{
  "mcpServers": {
    "luma": {
      "command": "node",
      "args": ["/path/to/luma-mcp-server/dist/index.js"],
      "env": {
        "LUMA_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## API Rate Limits

Lu.ma enforces a rate limit of 300 requests per minute per calendar. The server automatically handles rate limit errors and provides appropriate error messages.

## Error Handling

The server provides detailed error messages for common issues:

- **401 Unauthorized**: Invalid API key or insufficient permissions
- **404 Not Found**: Event or resource does not exist
- **429 Rate Limited**: Too many requests (automatic retry recommended)

## Development

### Project Structure

```
src/
└── index.ts          # Main MCP server implementation

dist/                 # Compiled JavaScript output
package.json          # Project configuration
tsconfig.json         # TypeScript configuration
README.md             # This file
```

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Cleaning Build Artifacts

```bash
npm run clean
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues related to:
- **This MCP server**: Open an issue in this repository
- **Lu.ma API**: Contact Lu.ma support
- **MCP Protocol**: Refer to the [Model Context Protocol documentation](https://modelcontextprotocol.io/)
