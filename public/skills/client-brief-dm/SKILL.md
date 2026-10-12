---
name: client-brief-dm
description: Look at tomorrow's calendar, find meetings with people outside Navina, generate the Insights Hub client brief for each client, and DM each brief to the user in Slack. Use when the user asks for "client briefs for tomorrow", "prep for my external meetings", "brief me on tomorrow's clients", or runs this on a daily schedule.
---

# Client briefs for tomorrow's external meetings

Sends the user one Slack DM per client they are meeting tomorrow, each containing
the Insights Hub client brief. Briefs go ONLY to the user's own DM. They contain
candid churn and risk notes and must never be posted to a channel.

## Before you start: check the three connections

You need all three. If one is missing, stop and tell the user which one and how
to fix it. Do not improvise a substitute.

1. **Google Calendar** connector (claude.ai connector settings).
2. **Slack** connector (claude.ai connector settings).
3. **navina-hub** MCP: the user creates a personal token at
   https://product-feedback-hub-topaz.vercel.app/connect-claude and follows the
   setup shown there. The tool you need is `generate_client_brief`.

## Steps

### 1. Get tomorrow's events
List the user's events for tomorrow (their calendar's time zone, midnight to
midnight). Ignore events the user declined, cancelled events, all-day events,
and events with no other attendees.

### 2. Keep external meetings
An event is external if at least one attendee has an email NOT ending in
`@navina.ai`. Ignore room/resource addresses (for example
`resource.calendar.google.com`) and group/list addresses; they are not people.
Also ignore meeting-recorder and note-taker bots (for example `@assistant.gong.io`,
Fireflies, Otter, Zoom or Read.ai assistants). A meeting whose only outside
attendee is a bot is an internal meeting.

### 3. Work out the client for each external event
Use, in this order:
1. The external attendees' email domains (for example `@agilonhealth.com` -> agilon health).
2. The event title (for example "Navina <> CareMore sync").
3. If the domain is generic (gmail.com, outlook.com, yahoo.com), use the title only.

Pass your best client name to `generate_client_brief`. The Hub matches it to a
real account using its own matcher, so a rough name is fine ("Harbor Health"
finds "The Harbor Health Team"). Do NOT guess an account name that is not
supported by the domain or title.

### 4. One brief per client, not per meeting
If two meetings are with the same client, generate one brief and mention both
meeting times in the DM.

### 5. Generate the briefs
Call `generate_client_brief` once per client. Each call takes 20 to 60 seconds
and spends the Hub's Claude quota, so:
- Never loop over every account, only the clients found in step 3.
- Cap at **10 clients per run**. If there are more, brief the first 10 by meeting
  time and tell the user how many were left out and which.
- Run them one after another if the tool is slow or errors; do not retry a failed
  call more than once.

If the tool returns `error: No hub account matches ...`, the client is not in the
Hub (often a prospect or partner). Do not generate a brief. Add it to the
"couldn't match" line in step 7.

### 6. Send one Slack DM per client
Send to the user themselves (look up their Slack user from their email, then DM
that user). Format each message in Slack formatting, not Markdown:
- First line: `*<Client> brief for tomorrow*` then the meeting time(s) and title(s).
- Then the brief body. Convert `##` headings to `*bold*` lines, `**bold**` to
  `*bold*`, and keep the `[n]` citations as they are.
- Slack truncates long messages; if a brief is over about 3,000 characters,
  split it at section boundaries into consecutive messages in the same DM.

### 7. Unmatched and skipped meetings
Send ONE short extra DM, only if needed, listing:
- External meetings that could not be matched to a Hub client (title and time).
- Clients left out by the 10-client cap.

### 8. Quiet days
If there are no external meetings tomorrow, send nothing and finish silently.

## Report back
Tell the user (in the chat, not Slack) how many external meetings you found, how
many briefs you sent, and anything you could not match.

## Rules
- Never post to a channel. DM to the user only.
- Never invent client facts. The brief text comes from the Hub, unedited, apart
  from Slack formatting.
- Never send the same client's brief twice in one run.
