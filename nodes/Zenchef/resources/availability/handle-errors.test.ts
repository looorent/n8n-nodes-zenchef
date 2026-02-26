// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { beforeEach, describe, expect, it } from 'vitest'
import { IExecuteSingleFunctions, IN8nHttpFullResponse, IN8nHttpResponse, INodeExecutionData, NodeApiError } from 'n8n-workflow'
import { handleErrors } from './handle-errors'

describe('handleErrors', () => {
  let context: IExecuteSingleFunctions
  let items: INodeExecutionData[]

  beforeEach(() => {
    context = createContext()
    items = createItems(1)
  })

  it('returns items on a valid 200 response', async () => {
    const response = createResponse(200, [
      { date: '2026-03-01', isOpen: true, shifts: [{ name: 'Lunch' }] }
    ])
    const result = await handleErrors.call(context, items, response)
    expect(result).toBe(items)
  })

  it('returns items when all days are closed (no error)', async () => {
    const response = createResponse(200, [
      { date: '2026-03-01', isOpen: false, shifts: [] },
      { date: '2026-03-02', isOpen: false, shifts: [] },
    ])
    const result = await handleErrors.call(context, items, response)
    expect(result).toBe(items)
  })

  it('returns items when at least one day has availability', async () => {
    const response = createResponse(200, [[
      { date: '2026-03-01', isOpen: false, shifts: [] },
      { date: '2026-03-02', isOpen: true, shifts: [{ name: 'Lunch' }] },
    ]])
    const result = await handleErrors.call(context, items, response)
    expect(result).toBe(items)
  })

  it('does not inspect body for JSON errors when content-type is text/plain', async () => {
    const response = createResponse(200, items, 'text/plain')
    const result = await handleErrors.call(context, items, response)
    expect(result).toBe(items)
  })

  it('throws on 429 with a rate-limit message', async () => {
    await expectError(429, '', 'text/plain', 'Rate limited')
  })

  it('throws on 500 with a server error message', async () => {
    await expectError(500, '', 'text/plain', 'Zenchef server error')
  })

  it('throws on 502 with a server error message', async () => {
    await expectError(502, '', 'text/plain', 'Zenchef server error')
  })

  it('throws "Restaurant ID is missing" for "Missing restaurantId"', async () => {
    await expectError(400, 'Missing restaurantId', 'text/plain; charset=utf-8', 'Restaurant ID is missing')
  })

  it('throws "Restaurant ID not found" for "Invalid restaurantId"', async () => {
    await expectError(400, 'Invalid restaurantId', 'text/plain; charset=utf-8', 'Restaurant ID not found')
  })

  it('throws "start date is out of range" for "Invalid date_begin"', async () => {
    await expectError(400, 'Invalid date_begin', 'text/plain; charset=utf-8', 'start date is out of range')
  })

  it('throws "end date is out of range" for "Invalid date_end"', async () => {
    await expectError(400, 'Invalid date_end', 'text/plain; charset=utf-8', 'end date is out of range')
  })

  it('throws "Start date must be before" for inverted range', async () => {
    await expectError(
      400,
      'date_begin must be less than date_end',
      'text/plain; charset=utf-8',
      'Start date must be before',
    )
  })

  it('passes through an unrecognized plain-text error', async () => {
    await expectError(400, 'Something unexpected', 'text/plain; charset=utf-8', 'Something unexpected')
  })

  it('throws a generic error for 400 with empty body', async () => {
    await expectError(400, '', 'text/plain; charset=utf-8', 'Zenchef API error')
  })

  it('throws "date range is too large" for "Une erreur s\'est produite"', async () => {
    const body = { error: { message: "Une erreur s'est produite" } }
    await expectError(200, body, 'application/json; charset=utf-8', 'date range is too large')
  })

  it('throws with the raw message for an unknown JSON error string', async () => {
    const body = { error: { message: 'Some other server error' } }
    await expectError(200, body, 'application/json; charset=utf-8', 'Zenchef API error')
  })

  it('throws "start date is not a valid date" for date-begin format error', async () => {
    const body = {
      error: {
        message: { 'date-begin': ['validation.date_format'] },
        list: [{ field: 'date-begin', message: 'validation.date_format' }],
      },
    }
    await expectError(200, body, 'application/json; charset=utf-8', 'start date is not a valid date')
  })

  it('throws "end date is not a valid date" for date-end format error', async () => {
    const body = {
      error: {
        message: { 'date-end': ['validation.date_format'] },
        list: [{ field: 'date-end', message: 'validation.date_format' }],
      },
    }
    await expectError(200, body, 'application/json; charset=utf-8', 'end date is not a valid date')
  })

  it('throws "end date must be today or later" for date-end after-or-equal error', async () => {
    const body = {
      error: {
        message: { 'date-end': ['The date-end field must be a date after or equal to date-begin.'] },
        list: [{
          field: 'date-end',
          key: 'The date-end field must be a date after or equal to date-begin.',
          dictionary: {},
          message: 'The date-end field must be a date after or equal to date-begin.',
        }],
      },
    }
    await expectError(200, body, 'application/json; charset=utf-8', 'end date must be today or later')
  })

  it('falls back to error.message object when error.list is absent', async () => {
    const body = {
      error: {
        message: { 'date-begin': ['validation.date_format'] },
      },
    }
    await expectError(200, body, 'application/json; charset=utf-8', 'start date is not a valid date')
  })

  it('handles multiple validation errors and deduplicates', async () => {
    const body = {
      error: {
        message: {
          'date-begin': ['validation.date_format'],
          'date-end': ['validation.date_format'],
        },
        list: [
          { field: 'date-begin', message: 'validation.date_format' },
          { field: 'date-end', message: 'validation.date_format' },
        ],
      },
    }
    await expectError(200, body, 'application/json; charset=utf-8', 'start date is not a valid date')
  })

  it('throws a generic message for an unrecognized error object', async () => {
    const body = { error: {} }
    await expectError(200, body, 'application/json; charset=utf-8', 'Zenchef API error')
  })

  it('throws when items array is empty', async () => {
    try {
      await handleErrors.call(
        createContext(),
        [],
        createResponse(200, []),
      )
      expect.fail('Expected an error to be thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(NodeApiError)
      expect((error as NodeApiError).message).toContain('No availability data returned')
    }
  })
})

function createResponse(
  statusCode: number,
  body: IN8nHttpResponse = {},
  contentType = 'application/json; charset=utf-8',
): IN8nHttpFullResponse {
  return { statusCode, headers: { 'content-type': contentType }, body }
}

function createContext(): IExecuteSingleFunctions {
  return {
    getNode: () => ({
      id: "mock",
      name: 'Zenchef',
      type: 'n8n-nodes-zenchef.zenchef',
      typeVersion: 1,
      position: [0, 0],
      parameters: {},
    }),
  } as IExecuteSingleFunctions
}

function createItems(count: number): INodeExecutionData[] {
  return Array.from({ length: count }, () => ({ json: { available: true } }))
}

async function expectError(
  statusCode: number,
  body: IN8nHttpResponse,
  contentType: string,
  expectedMessage: string,
) {
  try {
    await handleErrors.call(
      createContext(),
      createItems(1),
      createResponse(statusCode, body, contentType),
    )
    expect.fail('Expected an error to be thrown')
  } catch (error) {
    expect(error).toBeInstanceOf(NodeApiError)
    expect((error as NodeApiError).message).toContain(expectedMessage)
  }
}
