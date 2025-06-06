# Lu.ma MCP Server - AI Workflow Examples

This document demonstrates typical workflows when using the Lu.ma MCP server through an AI interface.

## Initial Setup

### First-time Configuration

```
Human: I have a Lu.ma Plus account. Can you help me set it up? My API key is luma_api_sk_1234567890abcdef

AI: I'll configure the Lu.ma API with your credentials.

[Calls configure_luma tool with api_key="luma_api_sk_1234567890abcdef"]

Response:
🔧 Lu.ma API Configuration Complete
- API key has been saved
- Configuration file created: /Users/username/luma-mcp-server/.env
- Environment variable LUMA_API_KEY set
✅ API key validated successfully!
- Found 12 event(s) in your account

You can now use all Lu.ma tools to manage your events and guests!
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
Human: Configure lu.ma with key "invalid_key_123"

AI: I'll configure the Lu.ma API with your credentials.

[Calls configure_luma with api_key="invalid_key_123"]

🔧 **Lu.ma API Configuration Complete**

- API key has been saved
- Configuration file created: /Users/username/luma-mcp-server/.env
- Environment variable LUMA_API_KEY set

⚠️ **Warning:** API key validation failed. This might be an invalid key or insufficient permissions.
The key has been saved, but you may encounter errors when using other tools.

Please double-check your API key from the Lu.ma dashboard.
```

### No API Key Configured

```
Human: What events do I have?

AI: I'll check your events.

[Attempts to call list_events]

Error: Lu.ma API key not configured. Please use the 'configure_luma' tool to set up your API key first.

To get started, you'll need to provide your Lu.ma API key. You can get this from your Lu.ma dashboard if you have a Lu.ma Plus subscription.
```

## Tips for AI Agents

1. **Always validate first**: The configure_luma tool validates by default, helping catch issues early.

2. **Use natural language**: Convert technical parameters into user-friendly language:
   - "next week" → calculate actual date ranges
   - "7 PM" → convert to proper ISO 8601 format with timezone

3. **Provide context**: When showing results, add helpful context like event counts, types, and summaries.

4. **Handle pagination gracefully**: Use get_all_* tools for complete data, or mention when there are more results available.

5. **Two-step updates**: Always show proposed changes before applying them, giving users a chance to review.