# Lu.ma MCP Server

A Model Context Protocol (MCP) server that provides AI agents with the ability to interact with the Lu.ma API for event and guest management.

## Features

This MCP server enables AI agents to:

- **Get Event Information**: Retrieve detailed information about Lu.ma events
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
git clone https://github.com/Trust-Square/luma-mcp-server.git
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

### Environment Variables

Set your Lu.ma API key as an environment variable:

```bash
export LUMA_API_KEY="your-luma-api-key-here"
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

#### 1. `get_event`
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

#### 2. `get_event_guest`
Get information about a specific guest.

**Parameters:**
- `event_api_id` (string, required): The API ID of the event
- `guest_api_id` (string, optional): The API ID of the guest
- `email` (string, optional): Email address of the guest
- `proxy_key` (string, optional): Proxy key of the guest

*Note: Provide one of guest_api_id, email, or proxy_key to identify the guest.*

#### 3. `get_event_guests`
Get a paginated list of guests for an event.

**Parameters:**
- `event_api_id` (string, required): The API ID of the event
- `pagination_cursor` (string, optional): Cursor for pagination
- `pagination_limit` (number, optional): Number of guests to return (1-100)

#### 4. `get_all_event_guests`
Get all guests for an event (automatically handles pagination).

**Parameters:**
- `event_api_id` (string, required): The API ID of the event

#### 5. `get_event_summary`
Get a comprehensive summary including event details and guest analytics.

**Parameters:**
- `event_api_id` (string, required): The API ID of the event
- `include_guest_details` (boolean, optional): Include guest information (default: true)

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
