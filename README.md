# n8n-nodes-zenchef

This is an n8n community node that lets you query restaurant **availability** from [Zenchef](https://www.zenchef.com) in your n8n workflows.

Zenchef is a restaurant management platform widely used across Europe for reservations, guest management, and marketing. This node interacts with the **public widget API** that powers Zenchef's online booking widgets — the same endpoint any visitor hits when checking availability on a restaurant's website.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation) | [Operations](#operations) | [Credentials](#credentials) | [Usage](#usage) | [Important notice](#important-notice-regarding-the-public-api) | [Publishing](#publishing) | [Resources](#resources)

## Important notice regarding the public API

This node queries the **public, unauthenticated** Zenchef bookings-middleware API (`bookings-middleware.zenchef.com`). This is the same API that Zenchef exposes through its reservation widgets embedded on restaurant websites. Please keep the following in mind:

- **This is not the private Zenchef API.** This node does not access any private, authenticated, or partner-level endpoint. It only reads publicly available availability data — the exact same data any website visitor can see.
- **No authentication is required or used.** Because the endpoint is public, no API key or credentials are needed. This also means there is no official rate-limiting contract or SLA.
- **Use this node responsibly.** The absence of authentication does not mean the API is intended for heavy or automated use. Do not use this node to poll aggressively, scrape data at scale, or build services that place unreasonable load on Zenchef's infrastructure.
- **Respect reasonable request rates.** Avoid running workflows on tight cron schedules (e.g. every few seconds). A request every few minutes for a handful of restaurants is a sensible baseline. If you need high-frequency data, contact Zenchef directly about their official integrations.
- **This project is not affiliated with Zenchef.** It is an independent community node. Zenchef may change, restrict, or shut down this public endpoint at any time without notice. The authors of this node bear no responsibility for disruptions caused by API changes.
- **Do not use this node for any activity that violates Zenchef's terms of service.**

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

All operations query restaurant availability through the `/getAvailabilitiesSummary` endpoint.

| Operation | Description |
|---|---|
| **Find for Date Range** | Pick two dates and get availability for each day in between (max ~30 days) |
| **Find for Day** | Check a single day |
| **Find for Month** | Get the full calendar for a given month (year + month dropdown) |
| **Find for Upcoming Days** | Check the next N days starting from today |

Every operation requires a **Restaurant ID** — the numeric identifier Zenchef assigns to each restaurant (see [Finding the Restaurant ID](#finding-the-restaurant-id)).

## Output format

The node filters the raw API response and produces **one item per available shift per day**. Closed days and shifts without availability are excluded. Each item has this shape:

```json
{
  "id": 1001,
  "name": "Lunch",
  "schedule": {
    "date": "2026-03-01",
    "dayOfWeek": 0,
    "isWeekend": true
  },
  "guestCapacity": {
    "min": 1,
    "max": 6
  },
  "bookable": {
    "from": "2025-12-01 19:00:00",
    "to": "2026-02-28 19:00:00"
  }
}
```

### Fields

| Field | Type | Description |
|---|---|---|
| `id` | `number \| null` | Unique identifier of the shift. `null` when the API omits it |
| `name` | `string \| null` | Display name of the shift (e.g. `"Lunch"`, `"Dinner"`). `null` when the API omits it or returns an empty string |
| `schedule.date` | `string` | The calendar date in `YYYY-MM-DD` format |
| `schedule.dayOfWeek` | `number` | Day of the week as a number (`0` = Sunday, `6` = Saturday) |
| `schedule.isWeekend` | `boolean` | `true` for Saturday and Sunday |
| `guestCapacity.min` | `number` | Smallest party size accepted for this shift |
| `guestCapacity.max` | `number` | Largest party size accepted for this shift |
| `bookable.from` | `string \| undefined` | Start of the booking window (`YYYY-MM-DD HH:mm:ss`) |
| `bookable.to` | `string \| undefined` | End of the booking window (`YYYY-MM-DD HH:mm:ss`) |

### Filtering logic

The node applies the following filters before producing items:

1. **Closed days** are excluded — only days with `isOpen === true` and a valid `shifts` array are kept.
2. **Unavailable shifts** are excluded — a shift must have `closed !== true` and at least one entry in `possible_guests`.
3. **Number of Guests** (optional) — when set via **Options > Number of Guests**, only shifts whose `possible_guests` list includes that exact party size are kept.
4. Each remaining shift becomes its own output item.

If no shifts pass these filters, the node throws a "No availability data returned" error.

## Credentials

No credentials are required. This node uses the public Zenchef widget API, which does not require authentication.

## Usage

### Finding the Restaurant ID

Every Zenchef restaurant has a numeric ID. To find it:

1. Go to the restaurant's website and open the Zenchef booking widget (the "Reserve" button).
2. Open your browser's Developer Tools (F12) and switch to the **Network** tab.
3. Click on a date in the widget and look for a request to `bookings-middleware.zenchef.com`.
4. The `restaurantId` query parameter in the request URL is the ID you need (e.g. `123456`).

### Quick start

1. Add the **Zenchef** node to your workflow.
2. Enter the **Restaurant ID**.
3. Pick the operation that matches your use case (see examples below).

### Example workflows

**Daily availability check** — Run on a schedule every morning to check if a restaurant has open slots this week:
- Trigger: Schedule (every day at 8:00)
- Zenchef: **Find for Upcoming Days**, Number of Days = `7`
- IF: Check `{{ $json.schedule.date }}` is not empty (the node only outputs available shifts, so any output means availability exists)
- Slack / Email: Notify with `{{ $json.schedule.date }}` and `{{ $json.name }}`

**Check availability for a party size** — Find out which dates can seat 6 guests:
- Zenchef: **Find for Date Range**, From = `2026-03-15`, To = `2026-03-22`, Options > Number of Guests = `6`
- The node only outputs shifts that accept exactly 6 guests — no extra filtering needed

**Monthly calendar overview** — Fetch the full month to build a calendar view:
- Zenchef: **Find for Month**, Year = `2026`, Month = `March`
- Each item is a shift with availability — group by `schedule.date` downstream to reconstruct the calendar

**Filter by shift name** — Only keep dinner availability:
- Zenchef: any operation
- IF: `{{ $json.name === "Dinner" }}`

**AI agent tool** — This node is marked as **usable as a tool** with a rich LLM-optimized description, so an n8n AI agent can call it to answer questions like "Is restaurant X available next Saturday?". To use it:
1. Open the **AI Agent** node and click **+ Tool**.
2. Search for **Zenchef** in the tool picker (it appears under the AI > Tools subcategory).
3. Configure the **Restaurant ID** — the agent will fill in dates and operations automatically based on the user's question.
No extra prompt engineering is needed; the tool description tells the LLM about every parameter, operation, and output field.

## Publishing

This package is published to npm with [provenance statements](https://docs.npmjs.com/generating-provenance-statements), which lets you verify that a published version was built from this repository's source code using GitHub Actions — not from a developer's local machine.

Provenance is generated automatically by the `publish.yml` workflow. To publish a new version:

1. Run locally `npm run release`, this will use `release-it` to update the version, generate the changelog and push a tag. Pushing a tag triggers a Github Actions workflow.
2. The GitHub Actions workflow will lint, build, and publish the package to npm with a signed provenance attestation.

### Prerequisites

- An npm **granular access token** with publish permissions, stored as a repository secret named `NPM_TOKEN` in your GitHub repo settings.
- The publish workflow requires `id-token: write` permission (already configured) so GitHub can mint the OIDC token used by [Sigstore](https://www.sigstore.dev/) to sign the provenance statement.

Once published, the provenance badge will appear on the package's [npm page](https://www.npmjs.com/package/n8n-nodes-zenchef), allowing anyone to trace the published artifact back to the exact source commit and workflow run that produced it.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Zenchef website](https://www.zenchef.com)

## Error management

The Zenchef API does not return errors in a consistent format. The same logical error can surface as a `400` plain-text response or a `200` with a JSON `"error"` key. The node's `postReceive` error handler (`handle-errors.ts`) detects each shape and throws a `NodeApiError` with a clear, actionable message so the n8n user immediately understands what went wrong.

Note: if the API returns data but every day is closed or every shift lacks availability, the node throws a "No availability data returned" error rather than returning an empty result silently.

The full catalogue of error shapes — along with the test suite used to discover them, the decision tree, and the translation table — is documented in [`ERROR.md`](ERROR.md).
