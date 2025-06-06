# Update Event Example

This document demonstrates how to use the `update_event` tool in the Lu.ma MCP server.

## Overview

The `update_event` tool allows you to modify event details with a built-in approval workflow. By default, it shows you what changes will be made before actually applying them.

## Example Usage

### Step 1: Preview Changes

First, call the tool to see what changes will be made:

```javascript
// Request to update event name and start time
update_event({
  api_id: "evt-12345",
  name: "Updated Tech Meetup 2025",
  start_at: "2025-06-20T18:00:00Z"
});
```

**Response:**
```
**Update Event: Original Tech Meetup**

Proposed changes:
- Name: "Original Tech Meetup" → "Updated Tech Meetup 2025"
- Start: 6/15/2025, 6:00:00 PM → 6/20/2025, 6:00:00 PM

**Do you want to proceed with these updates?**

⚠️ **No changes have been made yet.** To apply these updates, run the command again with `require_approval: false`.
```

### Step 2: Apply Changes

If you're happy with the proposed changes, run the command again with `require_approval: false`:

```javascript
update_event({
  api_id: "evt-12345",
  name: "Updated Tech Meetup 2025",
  start_at: "2025-06-20T18:00:00Z",
  require_approval: false
});
```

**Response:**
```
✅ **Event Updated Successfully!**

Applied changes:
- Name: "Original Tech Meetup" → "Updated Tech Meetup 2025"
- Start: 6/15/2025, 6:00:00 PM → 6/20/2025, 6:00:00 PM

**Updated Event Details:**
- Event ID: evt-12345
- Name: Updated Tech Meetup 2025
- Start: 6/20/2025, 6:00:00 PM
- Timezone: America/New_York
- Visibility: public
- URL: https://lu.ma/updated-tech-meetup-2025
```

## Available Update Fields

You can update the following event properties:

- `name`: Event title
- `description`: Event description
- `start_at`: Start date/time (ISO 8601 format)
- `end_at`: End date/time (ISO 8601 format)
- `timezone`: Timezone (e.g., 'America/New_York', 'Europe/London')
- `event_type`: Type of event ('in_person', 'online', or 'hybrid')
- `visibility`: Event visibility ('public', 'private', or 'unlisted')
- `meeting_url`: Meeting URL for online events
- `zoom_meeting_url`: Zoom meeting URL
- `cover_url`: URL for event cover image
- `geo_address_json`: Location details object for in-person events
- `geo_latitude`: Latitude coordinate
- `geo_longitude`: Longitude coordinate

## Notes

- The tool compares current values with new values and only shows actual changes
- If no changes are detected, the tool will inform you without making any API calls
- The approval workflow helps prevent accidental modifications
- All date/times should be in ISO 8601 format (e.g., '2025-06-20T18:00:00Z')
