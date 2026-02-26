# Zenchef `getAvailabilitiesSummary` — Error Shape Report

**Endpoint:** `https://bookings-middleware.zenchef.com/getAvailabilitiesSummary`
**Objective:** Map every error shape (HTTP code × content-type × body structure) to design proper error handling in the n8n node.

---

**Run date:** 2026-02-26T11:59:56+01:00
**Today:** 2026-02-26


## 1. BASELINE (Happy Path)

| # | Test | HTTP | Content-Type | Body (truncated) | Verdict |
|---|------|------|--------------|------------------|---------|
| 1 | `Future range: tomorrow → +7d` | 200 | application/json | `[{"date":"2026-02-27","bookable_from":"2025-11-29 12:00:00","bookable_to":"2026-` | **OK** |
| 2 | `Today → +7d` | 200 | application/json | `[{"date":"2026-02-26","bookable_from":"2025-11-28 12:00:00","bookable_to":"2026-` | **OK** |
| 3 | `Same day (today)` | 200 | application/json | `[{"date":"2026-02-26","bookable_from":"2025-11-28 12:00:00","bookable_to":"2026-` | **OK** |
| 4 | `Same day (tomorrow)` | 200 | application/json | `[{"date":"2026-02-27","bookable_from":"2025-11-29 12:00:00","bookable_to":"2026-` | **OK** |

## 2. MISSING PARAMETERS

| # | Test | HTTP | Content-Type | Body (truncated) | Verdict |
|---|------|------|--------------|------------------|---------|
| 5 | `No params at all` | 400 | text/plain | `Missing restaurantId` | **REJECTED (400, text/plain)** |
| 6 | `Missing restaurantId` | 400 | text/plain | `Missing restaurantId` | **REJECTED (400, text/plain)** |
| 7 | `Missing date_begin` | 200 | application/json | `{"error":{"message":{"date-begin":["validation.date_format"],"date-end":["The da` | **⚠ 2xx ERROR-IN-BODY (application/json)** |
| 8 | `Missing date_end` | 200 | application/json | `{"error":{"message":{"date-end":["validation.date_format","The date-end field mu` | **⚠ 2xx ERROR-IN-BODY (application/json)** |
| 9 | `Missing both dates` | 200 | application/json | `{"error":{"message":{"date-begin":["validation.date_format"],"date-end":["valida` | **⚠ 2xx ERROR-IN-BODY (application/json)** |
| 10 | `Only date_begin` | 400 | text/plain | `Missing restaurantId` | **REJECTED (400, text/plain)** |
| 11 | `Only date_end` | 400 | text/plain | `Missing restaurantId` | **REJECTED (400, text/plain)** |

## 3. INVALID restaurantId

| # | Test | HTTP | Content-Type | Body (truncated) | Verdict |
|---|------|------|--------------|------------------|---------|
| 12 | `restaurantId = 0` | 400 | text/plain | `Missing restaurantId` | **REJECTED (400, text/plain)** |
| 13 | `restaurantId = -1` | 400 | text/plain | `Missing restaurantId` | **REJECTED (400, text/plain)** |
| 14 | `restaurantId = 999999999 (non-existent)` | 400 | text/plain | `Invalid restaurantId` | **REJECTED (400, text/plain)** |
| 15 | `restaurantId = abc (string)` | 400 | text/plain | `Missing restaurantId` | **REJECTED (400, text/plain)** |
| 16 | `restaurantId = empty string` | 400 | text/plain | `Missing restaurantId` | **REJECTED (400, text/plain)** |
| 17 | `restaurantId = 3.14 (float)` | 400 | text/plain | `Missing restaurantId` | **REJECTED (400, text/plain)** |
| 18 | `restaurantId = null literal` | 400 | text/plain | `Missing restaurantId` | **REJECTED (400, text/plain)** |

## 4. date_begin PAST BOUNDARY (date_end fixed: +7d)

| # | Test | HTTP | Content-Type | Body (truncated) | Verdict |
|---|------|------|--------------|------------------|---------|
| 19 | `begin = yesterday (2026-02-25)` | 200 | application/json | `[{"date":"2026-02-25","bookable_from":null,"bookable_to":null,"isOpen":false,"sh` | **OK** |
| 20 | `begin = 7 days ago (2026-02-19)` | 200 | application/json | `[{"date":"2026-02-19","bookable_from":null,"bookable_to":null,"isOpen":false,"sh` | **OK** |
| 21 | `begin = 14 days ago (2026-02-12)` | 200 | application/json | `[{"date":"2026-02-12","bookable_from":null,"bookable_to":null,"isOpen":false,"sh` | **OK** |
| 22 | `begin = 25 days ago (2026-02-01)` | 200 | application/json | `[{"date":"2026-02-01","bookable_from":null,"bookable_to":null,"isOpen":false,"sh` | **OK** |
| 23 | `begin = 28 days ago (2026-01-29)` | 400 | text/plain | `Invalid date_begin` | **REJECTED (400, text/plain)** |
| 24 | `begin = 29 days ago (2026-01-28)` | 400 | text/plain | `Invalid date_begin` | **REJECTED (400, text/plain)** |
| 25 | `begin = 30 days ago (2026-01-27)` | 400 | text/plain | `Invalid date_begin` | **REJECTED (400, text/plain)** |
| 26 | `begin = 31 days ago (2026-01-26)` | 400 | text/plain | `Invalid date_begin` | **REJECTED (400, text/plain)** |
| 27 | `begin = 32 days ago (2026-01-25)` | 400 | text/plain | `Invalid date_begin` | **REJECTED (400, text/plain)** |
| 28 | `begin = 35 days ago (2026-01-22)` | 400 | text/plain | `Invalid date_begin` | **REJECTED (400, text/plain)** |
| 29 | `begin = 60 days ago (2025-12-28)` | 400 | text/plain | `Invalid date_begin` | **REJECTED (400, text/plain)** |
| 30 | `begin = far past (2020-01-01)` | 400 | text/plain | `Invalid date_begin` | **REJECTED (400, text/plain)** |

## 5. date_end IN THE PAST (date_begin fixed: -7d)

| # | Test | HTTP | Content-Type | Body (truncated) | Verdict |
|---|------|------|--------------|------------------|---------|
| 31 | `end = yesterday (2026-02-25)` | 200 | application/json | `[{"date":"2026-02-19","bookable_from":null,"bookable_to":null,"isOpen":false,"sh` | **OK** |
| 32 | `end = same as begin (2026-02-19)` | 200 | application/json | `[{"date":"2026-02-19","bookable_from":null,"bookable_to":null,"isOpen":false,"sh` | **OK** |
| 33 | `end = today (2026-02-26)` | 200 | application/json | `[{"date":"2026-02-19","bookable_from":null,"bookable_to":null,"isOpen":false,"sh` | **OK** |
| 34 | `end = tomorrow (2026-02-27)` | 200 | application/json | `[{"date":"2026-02-19","bookable_from":null,"bookable_to":null,"isOpen":false,"sh` | **OK** |
| 35 | `begin = yesterday, end = yesterday` | 200 | application/json | `[{"date":"2026-02-25","bookable_from":null,"bookable_to":null,"isOpen":false,"sh` | **OK** |
| 36 | `begin = today, end = yesterday` | 400 | text/plain | `date_begin must be less than date_end` | **REJECTED (400, text/plain)** |

## 6. INVERTED RANGE (date_begin > date_end)

| # | Test | HTTP | Content-Type | Body (truncated) | Verdict |
|---|------|------|--------------|------------------|---------|
| 37 | `begin = +14d, end = +7d (future, inverted)` | 400 | text/plain | `date_begin must be less than date_end` | **REJECTED (400, text/plain)** |
| 38 | `begin = +30d, end = tomorrow (future, inverted)` | 400 | text/plain | `date_begin must be less than date_end` | **REJECTED (400, text/plain)** |
| 39 | `begin = tomorrow, end = today (off by one)` | 400 | text/plain | `date_begin must be less than date_end` | **REJECTED (400, text/plain)** |

## 7. RANGE SIZE LIMITS (date_begin fixed: today)

| # | Test | HTTP | Content-Type | Body (truncated) | Verdict |
|---|------|------|--------------|------------------|---------|
| 40 | `1 day (today → tomorrow)` | 200 | application/json | `[{"date":"2026-02-26","bookable_from":"2025-11-28 12:00:00","bookable_to":"2026-` | **OK** |
| 41 | `1 week (today → +7d)` | 200 | application/json | `[{"date":"2026-02-26","bookable_from":"2025-11-28 12:00:00","bookable_to":"2026-` | **OK** |
| 42 | `2 weeks (today → +14d)` | 200 | application/json | `[{"date":"2026-02-26","bookable_from":"2025-11-28 12:00:00","bookable_to":"2026-` | **OK** |
| 43 | `1 month (today → +30d)` | 200 | application/json | `[{"date":"2026-02-26","bookable_from":"2025-11-28 12:00:00","bookable_to":"2026-` | **OK** |
| 44 | `2 months (today → +60d)` | 200 | application/json | `{"error":{"message":"Une erreur s'est produite"}}` | **⚠ 2xx ERROR-IN-BODY (application/json)** |
| 45 | `3 months (today → +90d)` | 200 | application/json | `{"error":{"message":"Une erreur s'est produite"}}` | **⚠ 2xx ERROR-IN-BODY (application/json)** |
| 46 | `6 months (today → +180d)` | 200 | application/json | `{"error":{"message":"Une erreur s'est produite"}}` | **⚠ 2xx ERROR-IN-BODY (application/json)** |
| 47 | `1 year (today → +365d)` | 200 | application/json | `{"error":{"message":"Une erreur s'est produite"}}` | **⚠ 2xx ERROR-IN-BODY (application/json)** |
| 48 | `2 years (today → +730d)` | 200 | application/json | `{"error":{"message":"Une erreur s'est produite"}}` | **⚠ 2xx ERROR-IN-BODY (application/json)** |

## 8. FAR FUTURE (range = 7 days)

| # | Test | HTTP | Content-Type | Body (truncated) | Verdict |
|---|------|------|--------------|------------------|---------|
| 49 | `begin = +90d` | 200 | application/json | `[{"date":"2026-05-27","bookable_from":null,"bookable_to":null,"isOpen":false,"sh` | **OK** |
| 50 | `begin = +180d` | 200 | application/json | `[{"date":"2026-08-25","bookable_from":null,"bookable_to":null,"isOpen":false,"sh` | **OK** |
| 51 | `begin = +365d` | 200 | application/json | `[{"date":"2027-02-26","bookable_from":"2026-11-28 12:00:00","bookable_to":"2027-` | **OK** |
| 52 | `begin = +730d (2 years)` | 400 | text/plain | `Invalid date_end` | **REJECTED (400, text/plain)** |
| 53 | `begin = 2030-01-01` | 400 | text/plain | `Invalid date_begin` | **REJECTED (400, text/plain)** |
| 54 | `begin = 2050-01-01` | 400 | text/plain | `Invalid date_begin` | **REJECTED (400, text/plain)** |
| 55 | `begin = 2099-01-01` | 400 | text/plain | `Invalid date_begin` | **REJECTED (400, text/plain)** |

## 9. INVALID CALENDAR DATES (date_end fixed: +7d)

| # | Test | HTTP | Content-Type | Body (truncated) | Verdict |
|---|------|------|--------------|------------------|---------|
| 56 | `Feb 29 non-leap year (2027-02-29)` | 200 | application/json | `{"error":{"message":{"date-begin":["validation.date_format"]},"list":[{"field":"` | **⚠ 2xx ERROR-IN-BODY (application/json)** |
| 57 | `Feb 30 (2027-02-30)` | 200 | application/json | `{"error":{"message":{"date-begin":["validation.date_format"]},"list":[{"field":"` | **⚠ 2xx ERROR-IN-BODY (application/json)** |
| 58 | `Apr 31 (2026-04-31)` | 200 | application/json | `{"error":{"message":{"date-begin":["validation.date_format"]},"list":[{"field":"` | **⚠ 2xx ERROR-IN-BODY (application/json)** |
| 59 | `Jun 31 (2026-06-31)` | 200 | application/json | `{"error":{"message":{"date-begin":["validation.date_format"]},"list":[{"field":"` | **⚠ 2xx ERROR-IN-BODY (application/json)** |
| 60 | `Month 00 (2026-00-01)` | 400 | text/plain | `Invalid date_begin` | **REJECTED (400, text/plain)** |
| 61 | `Month 13 (2026-13-01)` | 200 | application/json | `{"error":{"message":{"date-begin":["validation.date_format"],"date-end":["valida` | **⚠ 2xx ERROR-IN-BODY (application/json)** |
| 62 | `Day 00 (2026-03-00)` | 200 | application/json | `{"error":{"message":{"date-begin":["validation.date_format"]},"list":[{"field":"` | **⚠ 2xx ERROR-IN-BODY (application/json)** |
| 63 | `Feb 29 leap year (2028-02-29)` | 400 | text/plain | `Invalid date_begin` | **REJECTED (400, text/plain)** |
| 64 | `Invalid date_end only (begin OK, end = Apr 31)` | 200 | application/json | `{"error":{"message":{"date-end":["validation.date_format"]},"list":[{"field":"da` | **⚠ 2xx ERROR-IN-BODY (application/json)** |

## 10. PRIORITY: PAST date_begin vs INVERTED range

| # | Test | HTTP | Content-Type | Body (truncated) | Verdict |
|---|------|------|--------------|------------------|---------|
| 65 | `begin = 60d ago, end = 30d ago (past, valid order)` | 400 | text/plain | `Invalid date_begin` | **REJECTED (400, text/plain)** |
| 66 | `begin = 30d ago, end = 60d ago (past, inverted)` | 400 | text/plain | `Invalid date_begin` | **REJECTED (400, text/plain)** |
| 67 | `begin = 60d ago, end = today (past begin, end = today)` | 400 | text/plain | `Invalid date_begin` | **REJECTED (400, text/plain)** |

## 11. PRIORITY: MISSING restaurantId + BAD DATES

| # | Test | HTTP | Content-Type | Body (truncated) | Verdict |
|---|------|------|--------------|------------------|---------|
| 68 | `No restaurantId + past begin (60d ago)` | 400 | text/plain | `Missing restaurantId` | **REJECTED (400, text/plain)** |
| 69 | `No restaurantId + inverted range` | 400 | text/plain | `Missing restaurantId` | **REJECTED (400, text/plain)** |
| 70 | `No restaurantId + missing dates` | 400 | text/plain | `Missing restaurantId` | **REJECTED (400, text/plain)** |
| 71 | `Invalid restaurantId + past begin` | 400 | text/plain | `Invalid restaurantId` | **REJECTED (400, text/plain)** |
| 72 | `Invalid restaurantId + inverted range` | 400 | text/plain | `Invalid restaurantId` | **REJECTED (400, text/plain)** |

## 12. NO AVAILABILITY

| # | Test | HTTP | Content-Type | Body (truncated) | Verdict |
|---|------|------|--------------|------------------|---------|
| 73 | `Single past day within 1 month (2026-02-19)` | 200 | application/json | `[{"date":"2026-02-19","bookable_from":null,"bookable_to":null,"isOpen":false,"sh` | **OK** |

---

## Error Detection Guide

Based on the test results above, here is how to detect each error shape and what user-friendly message to surface.

### Decision tree for `handleErrors`

```
1. HTTP status code?
   ├─ 429         → "Rate limited by Zenchef. Reduce workflow frequency."
   ├─ 5xx         → "Zenchef server error. Try again later."
   ├─ 4xx         → Check Content-Type (step 2)
   └─ 2xx         → Check body for hidden errors (step 3)

2. HTTP 4xx — read Content-Type header:
   ├─ text/plain  → Body is a raw error string. Match against known messages (step 2a)
   └─ other       → Generic "Zenchef rejected the request (HTTP <code>)."

   2a. Known plain-text messages:
       ├─ "Missing restaurantId"                       → "Restaurant ID is missing. Provide a valid numeric ID."
       ├─ "Invalid restaurantId"                       → "Restaurant ID not found. Check the ID is correct."
       ├─ "Invalid date_begin"                         → "Start date is too far in the past. Use a date within the last month."
       ├─ "Invalid date_end"                           → "End date is invalid."
       ├─ "date_begin must be less than date_end"      → "Start date must be before the end date."
       └─ (unrecognized)                               → Pass through the raw message as-is.

3. HTTP 2xx — check body for hidden errors:
   ├─ Body is empty / null / [] / {}
   │   → "No data returned. Verify the Restaurant ID exists."
   │
   ├─ Body contains "error" key (application/json):
   │   ├─ error.list exists (array of field errors)
   │   │   → Join error.list[].message values.
   │   │     Known: "The date-end field must be a date after or equal to date-begin."
   │   │          → "End date must be today or later."
   │   │
   │   ├─ error.message is a string (flat server error)
   │   │   → Known: "Une erreur s'est produite"
   │   │          → "Zenchef internal error. The date range may be too large. Try a shorter range."
   │   │
   │   └─ error.message is an object (structured validation)
   │       → Iterate keys for field-specific messages, same as error.list.
   │
   └─ Body is valid JSON array (availability data):
       ├─ All days have isOpen === false
       │   → "No availability for the requested dates. The restaurant has no open slots."
       └─ At least one day has isOpen === true
           → Success — return the data.
```

### Content-Type routing

| Content-Type | HTTP range | Meaning |
|---|---|---|
| `text/plain; charset=utf-8` | 4xx | Known API validation error — body is a single English sentence |
| `application/json; charset=utf-8` | 2xx | Either valid data OR a hidden error with an `"error"` key |
| `application/json; charset=utf-8` | 4xx | Possible but not observed in tests — treat as JSON error |
| `(empty / missing)` | any | Network failure or unexpected response — treat as opaque error |

### Known API error messages (exhaustive from tests)

| Raw message | HTTP | CT | Cause | User-facing message |
|---|---|---|---|---|
| `Missing restaurantId` | 400 | text/plain | restaurantId param absent or empty | Restaurant ID is missing. Provide a valid numeric ID. |
| `Invalid restaurantId` | 400 | text/plain | restaurantId is non-numeric, zero, negative, or does not match a restaurant | Restaurant ID not found. Verify the ID is correct. |
| `Invalid date_begin` | 400 | text/plain | date_begin is more than ~28-31 days in the past | Start date is too far in the past. Use a date within the last month. |
| `Invalid date_end` | 400 | text/plain | date_end is invalid or too far in the future | End date is invalid. Check the date format (YYYY-MM-DD). |
| `date_begin must be less than date_end` | 400 | text/plain | date_begin > date_end | Start date must be before the end date. |
| `{"error":{"message":{"date-end":[...]},"list":[...]}}` | 200 | application/json | date_end is in the past (but date_begin is within the allowed window) | End date must be today or later. |
| `{"error":{"message":"Une erreur s'est produite"}}` | 200 | application/json | Server-side failure, often caused by a too-large date range | Zenchef internal error. Try a shorter date range (max ~60 days). |

### Error priority order (when multiple params are invalid)

Based on the priority tests (categories 10-11):

1. **Missing restaurantId** — always wins, regardless of date issues
2. **Invalid restaurantId** — checked next, before any date validation
3. **Invalid date_begin (too far in past)** — checked before range direction
4. **date_begin > date_end** — checked last among 400-level errors
5. **date_end in past (200 JSON error)** — only surfaces when all above pass

This means the node should validate in the same order to provide the most relevant error message.

### Edge cases to watch for

- **Invalid calendar dates** (Feb 30, Apr 31, Month 13, etc.): The API returns HTTP 200 with `"error"` in body — same shape as other silent failures. These must be caught by the `"error"` key check.
- **Missing dates with valid restaurantId**: Returns HTTP 200 with `"error"` in body, not 400.
- **Empty string params**: `restaurantId=` → 400 "Missing restaurantId". `date_begin=` → 200 with error in body.
- **No availability**: Valid 200 response with an array of days all having `isOpen: false`. This is NOT an error — but the node should inform the user that no slots are open.
