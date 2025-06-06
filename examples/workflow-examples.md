# Lu.ma MCP Server - AI Workflow Examples

This document demonstrates typical workflows when using the Lu.ma MCP server through an AI interface.

## Initial Setup

### First-time Configuration

```
Human: I have a Lu.ma Plus account. Can you help me set it up? My personal calendar API key is luma_api_personal_abc123

AI: I'll configure your personal Lu.ma calendar with the provided API key.

[Calls configure_calendar tool with name="personal", api_key="luma_api_personal_abc123"]

Response:
🔧 Calendar Added: personal
- Calendar name: personal
- Description: (none)
- Configuration saved to: /Users/username/luma-mcp-server/luma-config.json
- Default calendar: Yes
✅ API key validated successfully!
- Found 12 event(s) in this calendar

You can now use this calendar for all Lu.ma operations (active by default).
```

### Adding Additional Calendars

```
Human: I also manage our company events. Add my work calendar with key luma_api_work_xyz789

AI: I'll add your work calendar to the configuration.

[Calls configure_calendar with name="work", api_key="luma_api_work_xyz789", description="Company events and meetings"]

Response:
🔧 Calendar Added: work
- Calendar name: work
- Description: Company events and meetings
- Configuration saved to: /Users/username/luma-mcp-server/luma-config.json
- Default calendar: No
✅ API key validated successfully!
- Found 25 event(s) in this calendar

You now have 2 calendars configured. Use 'switch_calendar' to change between them.
```

### Switching Between Calendars

```
Human: Show me which calendars I have configured

AI: I'll list all your configured calendars.

[Calls list_calendars]

Response:
📋 **Configured Calendars** (2 total)

1. **personal** (default) ⬅ active
   - Description: (none)
   - API key: luma_api_pe...c123

2. **work**
   - Description: Company events and meetings
   - API key: luma_api_wo...x789

Current active calendar: **personal**

Human: Switch to my work calendar

AI: I'll switch to your work calendar.

[Calls switch_calendar with name="work"]

Response:
🔄 **Switched to calendar: work**

All subsequent operations will use this calendar.
Description: Company events and meetings
```

## Common Workflows

### 1. Checking Upcoming Events

```
Human: What events do I have scheduled for next week?

AI: I'll check your events for next week.

[Calls list_events with after="2025-06-09T00:00:00Z" and before="2025-06-16T23:59:59Z"]

Here are your events for next week:

1. **Tech Meetup June** (evt-abc123)
   - Type: in_person
   - Start: 6/10/2025, 6:00:00 PM
   - Location: Innovation Hub, San Francisco
   - Visibility: public

2. **Webinar: AI Best Practices** (evt-def456)
   - Type: online
   - Start: 6/12/2025, 2:00:00 PM
   - Visibility: private
   
3. **Community Lunch** (evt-ghi789)
   - Type: hybrid
   - Start: 6/14/2025, 12:00:00 PM
   - Location: Community Center
   - Has online component

You have 3 events scheduled next week.
```

### 2. Getting Event Details with Guest Count

```
Human: Can you give me details about the Tech Meetup including how many people have registered?

AI: I'll get the complete details for your Tech Meetup event including guest information.

[Calls get_event_summary with api_id="evt-abc123"]

Complete Event Summary for "Tech Meetup June":

**Event Details:**
- Event ID: evt-abc123
- Type: in_person
- Start: 6/10/2025, 6:00:00 PM
- Duration: 2 hours
- Location: Innovation Hub, San Francisco
- Visibility: public
- Event URL: https://lu.ma/tech-meetup-june

**Guest Summary:**
- Total Registered: 47
  - Approved: 42
  - Pending: 5
```

### 3. Updating an Event

```
Human: I need to change the Tech Meetup to start at 7 PM instead of 6 PM

AI: I'll update the start time for your Tech Meetup. Let me show you the proposed changes first.

[Calls update_event with api_id="evt-abc123", start_at="2025-06-10T19:00:00-07:00"]

**Update Event: Tech Meetup June**

Proposed changes:
- Start: 6/10/2025, 6:00:00 PM → 6/10/2025, 7:00:00 PM

**Do you want to proceed with these updates?**

⚠️ **No changes have been made yet.**

Human: Yes, please go ahead

AI: I'll apply the time change now.

[Calls update_event with api_id="evt-abc123", start_at="2025-06-10T19:00:00-07:00", require_approval=false]

✅ **Event Updated Successfully!**

Applied changes:
- Start: 6/10/2025, 6:00:00 PM → 6/10/2025, 7:00:00 PM

**Updated Event Details:**
- Event ID: evt-abc123
- Name: Tech Meetup June
- Start: 6/10/2025, 7:00:00 PM
- Timezone: America/Los_Angeles
- Visibility: public
- URL: https://lu.ma/tech-meetup-june

The start time has been successfully changed to 7:00 PM.
```

### 4. Finding a Specific Guest

```
Human: Is john.doe@example.com registered for the Tech Meetup?

AI: I'll check if john.doe@example.com is registered for the Tech Meetup.

[Calls get_event_guest with api_id="evt-abc123", email="john.doe@example.com"]

Yes, I found their registration:

**Guest Information:**
- Name: John Doe
- Email: john.doe@example.com
- Approval Status: approved
- Registered: 5/28/2025, 3:45:00 PM
- Company: Acme Corp (from registration form)

John is confirmed to attend the event.
```

### 5. Getting a Quick Overview of All Events

```
Human: Can you give me a quick overview of all my events?

AI: I'll get an overview of all your events.

[Calls get_all_events]

All Events Summary:

**Overview:**
- Total Events: 15

**By Visibility:**
- Public: 8
- Private: 5
- Unlisted: 2

**By Type:**
- In-person: 9
- Online: 4
- Hybrid: 2

**Upcoming Events (Next 5):**
1. **Tech Meetup June** (evt-abc123)
   - Start: 6/10/2025, 7:00:00 PM
   - Type: in_person | Visibility: public
   - Location: San Francisco

2. **Webinar: AI Best Practices** (evt-def456)
   - Start: 6/12/2025, 2:00:00 PM
   - Type: online | Visibility: private
   - Location: Not specified

[... and 3 more]

You have 15 total events, with 8 public events and a good mix of in-person and online formats.
```

## Error Handling

### Invalid API Key

```
Human: Add a test calendar with key "invalid_key_123"

AI: I'll configure a test calendar with the provided API key.

[Calls configure_calendar with name="test", api_key="invalid_key_123"]

🔧 **Calendar Added: test**

- Calendar name: test
- Description: (none)
- Configuration saved to: /Users/username/luma-mcp-server/luma-config.json
- Default calendar: No

⚠️ **Warning:** API key validation failed. This might be an invalid key or insufficient permissions.
The calendar has been saved, but you may encounter errors when using it.

Please double-check your API key from the Lu.ma dashboard.
```

### No Calendars Configured

```
Human: What events do I have?

AI: I'll check your events.

[Attempts to call list_events]

Error: No calendars configured. Please use the 'configure_calendar' tool to add a calendar first.

To get started, you'll need to add at least one Lu.ma calendar with its API key. You can get API keys from your Lu.ma dashboard if you have a Lu.ma Plus subscription.
```

## Tips for AI Agents

1. **Calendar Context**: Always be aware of which calendar is active. Include the calendar name in responses when showing events or guests.

2. **Smart Calendar Switching**: If a user mentions "work events" or "personal calendar", consider switching to the appropriate calendar automatically.

3. **Always validate first**: The configure_calendar tool validates by default, helping catch issues early.

4. **Use natural language**: Convert technical parameters into user-friendly language:
   - "next week" → calculate actual date ranges
   - "7 PM" → convert to proper ISO 8601 format with timezone

5. **Provide context**: When showing results, add helpful context like event counts, types, and summaries.

6. **Handle pagination gracefully**: Use get_all_* tools for complete data, or mention when there are more results available.

7. **Two-step updates**: Always show proposed changes before applying them, giving users a chance to review.

