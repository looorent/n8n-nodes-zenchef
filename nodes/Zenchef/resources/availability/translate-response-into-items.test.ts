// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { describe, expect, it } from 'vitest'
import type { IExecuteSingleFunctions, IN8nHttpFullResponse, IN8nHttpResponse, INodeExecutionData } from 'n8n-workflow'
import { translateResponseIntoItems } from './translate-response-into-items'

describe('translateResponseIntoItems', () => {
  describe('non-array body', () => {
    it('returns empty array when body is null', async () => {
      const result = await callWith(null)
      expect(result).toEqual([])
    })

    it('returns empty array when body is undefined', async () => {
      const result = await callWith(undefined)
      expect(result).toEqual([])
    })

    it('returns empty array when body is a string', async () => {
      const result = await callWith('not an array')
      expect(result).toEqual([])
    })

    it('returns empty array when body is a number', async () => {
      const result = await callWith(42)
      expect(result).toEqual([])
    })

    it('returns empty array when body is an object', async () => {
      const result = await callWith({ error: 'something' })
      expect(result).toEqual([])
    })
  })

  describe('empty body', () => {
    it('returns empty array when body is an empty array', async () => {
      const result = await callWith([])
      expect(result).toEqual([])
    })
  })

  describe('closed days filtering', () => {
    it('excludes days where isOpen is false', async () => {
      const result = await callWith([
        { date: '2026-05-05', isOpen: false, shifts: [] },
        { date: '2026-05-06', isOpen: false, shifts: [] },
      ])
      expect(result).toEqual([])
    })

    it('excludes days where isOpen is missing', async () => {
      const result = await callWith([
        { date: '2026-05-05', shifts: [{ id: 1, name: 'Lunch', possible_guests: [1, 2], closed: false }] },
      ])
      expect(result).toEqual([])
    })

    it('excludes days where shifts is not an array', async () => {
      const result = await callWith([
        { date: '2026-05-05', isOpen: true, shifts: null },
      ])
      expect(result).toEqual([])
    })
  })

  describe('shift filtering (hasAvailabilities)', () => {
    it('excludes shifts where closed is true', async () => {
      const result = await callWith([
        {
          date: '2026-05-02',
          isOpen: true,
          shifts: [
            { id: 1001, name: 'Lunch', possible_guests: [1, 2], closed: true },
          ],
        },
      ])
      expect(result).toEqual([])
    })

    it('excludes shifts where possible_guests is empty', async () => {
      const result = await callWith([
        {
          date: '2026-05-02',
          isOpen: true,
          shifts: [
            { id: 1002, name: 'Diner', possible_guests: [], closed: false },
          ],
        },
      ])
      expect(result).toEqual([])
    })

    it('excludes shifts where possible_guests is missing', async () => {
      const result = await callWith([
        {
          date: '2026-05-02',
          isOpen: true,
          shifts: [
            { id: 1002, name: 'Diner', closed: false },
          ],
        },
      ])
      expect(result).toEqual([])
    })

    it('keeps shifts that are not closed and have possible_guests', async () => {
      const result = await callWith([
        {
          date: '2026-05-02',
          isOpen: true,
          shifts: [
            { id: 1001, name: 'Lunch', possible_guests: [1, 2, 3], closed: false },
          ],
        },
      ])
      expect(result).toHaveLength(1)
      expect(result[0].json).toMatchObject({
        id: 1001,
        name: 'Lunch',
      })
    })

    it('filters out unavailable shifts while keeping available ones', async () => {
      const result = await callWith([
        {
          date: '2026-05-02',
          isOpen: true,
          shifts: [
            { id: 1001, name: 'Lunch', possible_guests: [1, 2, 3], closed: false },
            { id: 1002, name: 'Diner', possible_guests: [], closed: false },
          ],
        },
      ])
      expect(result).toHaveLength(1)
      expect(result[0].json).toMatchObject({ name: 'Lunch' })
    })
  })

  describe('flattening day to shift items', () => {
    it('produces one item per available shift', async () => {
      const result = await callWith([
        {
          date: '2026-05-02',
          isOpen: true,
          shifts: [
            { id: 1001, name: 'Lunch', possible_guests: [1, 2, 3, 4, 5, 6], closed: false },
            { id: 1002, name: 'Diner', possible_guests: [1, 2], closed: false },
          ],
        },
      ])
      expect(result).toHaveLength(2)
      expect(result[0].json).toMatchObject({ name: 'Lunch' })
      expect(result[1].json).toMatchObject({ name: 'Diner' })
    })

    it('produces items across multiple days', async () => {
      const result = await callWith([
        {
          date: '2026-05-02',
          isOpen: true,
          shifts: [
            { id: 1001, name: 'Lunch', possible_guests: [1, 2], closed: false },
          ],
        },
        {
          date: '2026-05-03',
          isOpen: true,
          shifts: [
            { id: 1001, name: 'Lunch', possible_guests: [1, 2], closed: false },
            { id: 1002, name: 'Diner', possible_guests: [1], closed: false },
          ],
        },
      ])
      expect(result).toHaveLength(3)
      expect(result[0].json).toMatchObject({ schedule: { date: '2026-05-02' }, name: 'Lunch' })
      expect(result[1].json).toMatchObject({ schedule: { date: '2026-05-03' }, name: 'Lunch' })
      expect(result[2].json).toMatchObject({ schedule: { date: '2026-05-03' }, name: 'Diner' })
    })
  })

  describe('item shape', () => {
    it('includes all expected fields', async () => {
      const result = await callWith([
        {
          date: '2026-05-02',
          isOpen: true,
          shifts: [
            { id: 1001, name: 'Lunch', possible_guests: [1, 2, 3, 4, 5, 6], closed: false, bookable_from: '2026-02-01 12:00:00', bookable_to: '2026-05-01 12:00:00' },
          ],
        },
      ])
      expect(result).toHaveLength(1)
      expect(result[0].json).toEqual({
        id: 1001,
        name: 'Lunch',
        schedule: {
          date: '2026-05-02',
          dayOfWeek: 6,
          isWeekend: true,
        },
        guestCapacity: {
          min: 1,
          max: 6,
        },
        bookable: {
          from: '2026-02-01 12:00:00',
          to: '2026-05-01 12:00:00',
        },
      })
    })

    it('includes bookable as undefined when bookable_from and bookable_to are missing', async () => {
      const result = await callWith([
        {
          date: '2026-05-02',
          isOpen: true,
          shifts: [
            { id: 1001, name: 'Lunch', possible_guests: [1, 2], closed: false },
          ],
        },
      ])
      expect(result[0].json).toMatchObject({
        bookable: {
          from: undefined,
          to: undefined,
        },
      })
    })

    it('sets id to null when id is missing', async () => {
      const result = await callWith([
        {
          date: '2026-05-04',
          isOpen: true,
          shifts: [
            { name: 'Lunch', possible_guests: [1, 2], closed: false },
          ],
        },
      ])
      expect(result[0].json).toMatchObject({ id: null })
    })

    it('sets name to null when name is missing', async () => {
      const result = await callWith([
        {
          date: '2026-05-04',
          isOpen: true,
          shifts: [
            { id: 1, possible_guests: [1, 2], closed: false },
          ],
        },
      ])
      expect(result[0].json).toMatchObject({ name: null })
    })

    it('sets name to null when name is empty string', async () => {
      const result = await callWith([
        {
          date: '2026-05-04',
          isOpen: true,
          shifts: [
            { id: 1, name: '', possible_guests: [1, 2], closed: false },
          ],
        },
      ])
      expect(result[0].json).toMatchObject({ name: null })
    })
  })

  describe('guest count boundaries', () => {
    it('computes min and max from possible_guests', async () => {
      const result = await callWith([
        {
          date: '2026-05-02',
          isOpen: true,
          shifts: [
            { id: 1, name: 'Lunch', possible_guests: [2, 4, 6, 8], closed: false },
          ],
        },
      ])
      expect(result[0].json).toMatchObject({
        guestCapacity: { min: 2, max: 8 },
      })
    })

    it('handles a single guest count', async () => {
      const result = await callWith([
        {
          date: '2026-05-15',
          isOpen: true,
          shifts: [
            { id: 1002, name: 'Diner', possible_guests: [1], closed: false },
          ],
        },
      ])
      expect(result[0].json).toMatchObject({
        guestCapacity: { min: 1, max: 1 },
      })
    })
  })

  describe('day of week computation', () => {
    it('computes Saturday correctly (2026-05-02)', async () => {
      const result = await callWith([
        {
          date: '2026-05-02',
          isOpen: true,
          shifts: [{ id: 1, name: 'S', possible_guests: [1], closed: false }],
        },
      ])
      expect(result[0].json).toMatchObject({
        schedule: {
          dayOfWeek: 6,
          isWeekend: true,
        },
      })
    })

    it('computes Sunday correctly (2026-05-03)', async () => {
      const result = await callWith([
        {
          date: '2026-05-03',
          isOpen: true,
          shifts: [{ id: 1, name: 'S', possible_guests: [1], closed: false }],
        },
      ])
      expect(result[0].json).toMatchObject({
        schedule: {
          dayOfWeek: 0,
          isWeekend: true,
        },
      })
    })

    it('computes Monday correctly (2026-05-04)', async () => {
      const result = await callWith([
        {
          date: '2026-05-04',
          isOpen: true,
          shifts: [{ id: 1, name: 'S', possible_guests: [1], closed: false }],
        },
      ])
      expect(result[0].json).toMatchObject({
        schedule: {
          dayOfWeek: 1,
          isWeekend: false,
        },
      })
    })

    it('computes Wednesday correctly (2026-05-06)', async () => {
      const result = await callWith([
        {
          date: '2026-05-06',
          isOpen: true,
          shifts: [{ id: 1, name: 'S', possible_guests: [1], closed: false }],
        },
      ])
      expect(result[0].json).toMatchObject({
        schedule: {
          dayOfWeek: 3,
          isWeekend: false,
        },
      })
    })

    it('computes Friday correctly (2026-05-08)', async () => {
      const result = await callWith([
        {
          date: '2026-05-08',
          isOpen: true,
          shifts: [{ id: 1, name: 'S', possible_guests: [1], closed: false }],
        },
      ])
      expect(result[0].json).toMatchObject({
        schedule: {
          dayOfWeek: 5,
          isWeekend: false,
        },
      })
    })
  })

  describe('nested array unwrapping', () => {
    it('unwraps body when the first element is itself an array', async () => {
      const innerDays = [
        {
          date: '2026-05-02',
          isOpen: true,
          shifts: [
            { id: 1001, name: 'Lunch', possible_guests: [1, 2, 3], closed: false },
          ],
        },
      ]
      const result = await callWith([innerDays])
      expect(result).toHaveLength(1)
      expect(result[0].json).toMatchObject({ schedule: { date: '2026-05-02' }, name: 'Lunch' })
    })

    it('does not double-unwrap when body is a flat array', async () => {
      const result = await callWith([
        {
          date: '2026-05-02',
          isOpen: true,
          shifts: [
            { id: 1001, name: 'Lunch', possible_guests: [1, 2], closed: false },
          ],
        },
      ])
      expect(result).toHaveLength(1)
      expect(result[0].json).toMatchObject({ schedule: { date: '2026-05-02' } })
    })
  })

  describe('real-world payload', () => {
    it('excludes all closed days from the output', async () => {
      const result = await callWith(realPayload)

      const closedDates = ['2026-05-05', '2026-05-06', '2026-05-12']
      for (const item of result) {
        expect(closedDates).not.toContain((item.json.schedule as { date: string }).date)
      }
    })

    it('excludes shifts with empty possible_guests', async () => {
      const result = await callWith(realPayload)

      const may2Items = result.filter(item => (item.json.schedule as { date: string }).date === '2026-05-02')
      expect(may2Items).toHaveLength(1)
      expect(may2Items[0].json).toMatchObject({ name: 'Lunch' })
    })

    it('includes all three shifts when all have possible_guests', async () => {
      const result = await callWith(realPayload)

      const may3Items = result.filter(item => (item.json.schedule as { date: string }).date === '2026-05-03')
      expect(may3Items).toHaveLength(3)
      expect(may3Items[0].json).toMatchObject({ name: 'Brunch' })
      expect(may3Items[1].json).toMatchObject({ name: 'Lunch' })
      expect(may3Items[2].json).toMatchObject({ name: 'Diner' })
    })

    it('excludes days with isOpen false even if they have shifts with data', async () => {
      const result = await callWith(realPayload)

      const may12Items = result.filter(item => (item.json.schedule as { date: string }).date === '2026-05-12')
      expect(may12Items).toHaveLength(0)
    })

    it('keeps the only available shift on a day with mixed closed/open shifts', async () => {
      const result = await callWith(realPayload)

      const may7Items = result.filter(item => (item.json.schedule as { date: string }).date === '2026-05-07')
      expect(may7Items).toHaveLength(1)
      expect(may7Items[0].json).toMatchObject({ name: 'Diner', guestCapacity: { min: 2, max: 10 } })
    })

    it('handles a day with a single shift having a single guest option', async () => {
      const result = await callWith(realPayload)

      const may9Items = result.filter(item => (item.json.schedule as { date: string }).date === '2026-05-09')
      expect(may9Items).toHaveLength(1)
      expect(may9Items[0].json).toMatchObject({ name: 'Afternoon Tea', guestCapacity: { min: 2, max: 2 } })
    })

    it('computes weekend flags correctly across the payload', async () => {
      const result = await callWith(realPayload)

      const weekendItems = result.filter(item => (item.json.schedule as { isWeekend: boolean }).isWeekend === true)
      const weekendDates = [...new Set(weekendItems.map(item => (item.json.schedule as { date: string }).date))]
      expect(weekendDates).toEqual(['2026-05-02', '2026-05-03', '2026-05-09', '2026-05-10'])
    })

    it('returns the correct total number of items', async () => {
      const result = await callWith(realPayload)
      expect(result.length).toBe(12)
    })
  })
})

function createContext(): IExecuteSingleFunctions {
  return {
    getNode: () => ({
      id: 'mock',
      name: 'Zenchef',
      type: 'n8n-nodes-zenchef.zenchef',
      typeVersion: 1,
      position: [0, 0],
      parameters: {},
    }),
    helpers: {
      returnJsonArray: (data: unknown[]) =>
        data.map(item => ({ json: item })) as INodeExecutionData[],
    },
  } as unknown as IExecuteSingleFunctions
}

function createResponse(body: IN8nHttpResponse): IN8nHttpFullResponse {
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body,
  }
}

async function callWith(body: unknown): Promise<INodeExecutionData[]> {
  return translateResponseIntoItems.call(
    createContext(),
    [],
    createResponse(body as IN8nHttpResponse),
  )
}

// Diverse payload covering: weekdays/weekends, varied shift names & IDs,
// different guest ranges, closed shifts, empty guests, single-guest shifts,
// three-shift days, fully closed days (with and without shift data),
// and open days where all shifts lack availability.
const realPayload = [
  // Saturday — open, Lunch available (1-6), Diner has no guests
  {
    date: '2026-05-02',
    bookable_from: '2026-02-01 12:00:00',
    bookable_to: '2026-05-01 19:00:00',
    isOpen: true,
    shifts: [
      { id: 1001, name: 'Lunch', possible_guests: [1, 2, 3, 4, 5, 6], waitlist_possible_guests: [], is_offer_required: false, offer_required_from_pax: null, closed: false, bookable_from: '2026-02-01 12:00:00', bookable_to: '2026-05-01 12:00:00', offers: [] },
      { id: 1002, name: 'Diner', possible_guests: [], waitlist_possible_guests: [1, 2], is_offer_required: false, offer_required_from_pax: null, closed: false, bookable_from: '2026-02-01 19:00:00', bookable_to: '2026-05-01 19:00:00', offers: [] },
    ],
  },
  // Sunday — open, three shifts all available, varied guest ranges
  {
    date: '2026-05-03',
    bookable_from: '2026-02-02 10:00:00',
    bookable_to: '2026-05-02 22:00:00',
    isOpen: true,
    shifts: [
      { id: 2001, name: 'Brunch', possible_guests: [2, 4, 6, 8], waitlist_possible_guests: [], is_offer_required: false, offer_required_from_pax: null, closed: false, bookable_from: '2026-02-02 10:00:00', bookable_to: '2026-05-02 14:00:00', offers: [] },
      { id: 1001, name: 'Lunch', possible_guests: [1, 2, 3], waitlist_possible_guests: [], is_offer_required: true, offer_required_from_pax: 4, closed: false, bookable_from: '2026-02-02 12:00:00', bookable_to: '2026-05-02 16:00:00', offers: [{ id: 90, name: 'Sunday Menu' }] },
      { id: 1002, name: 'Diner', possible_guests: [1, 2, 3, 4, 5, 6, 7, 8], waitlist_possible_guests: [9, 10], is_offer_required: false, offer_required_from_pax: null, closed: false, bookable_from: '2026-02-02 19:00:00', bookable_to: '2026-05-02 22:00:00', offers: [] },
    ],
  },
  // Monday — open, both shifts available with different IDs
  {
    date: '2026-05-04',
    bookable_from: '2026-02-03 12:00:00',
    bookable_to: '2026-05-03 19:00:00',
    isOpen: true,
    shifts: [
      { id: 3001, name: 'Lunch', possible_guests: [2, 4], waitlist_possible_guests: [], is_offer_required: false, offer_required_from_pax: null, closed: false, bookable_from: '2026-02-03 12:00:00', bookable_to: '2026-05-03 15:00:00', offers: [] },
      { id: 3002, name: 'Diner', possible_guests: [2, 4, 6, 8, 10, 12], waitlist_possible_guests: [], is_offer_required: true, offer_required_from_pax: 6, closed: false, bookable_from: '2026-02-03 19:00:00', bookable_to: '2026-05-03 23:00:00', offers: [{ id: 91, name: 'Tasting Menu' }] },
    ],
  },
  // Tuesday — closed, no shifts at all
  { date: '2026-05-05', bookable_from: null, bookable_to: null, isOpen: false, shifts: [] },
  // Wednesday — closed, no shifts
  { date: '2026-05-06', bookable_from: null, bookable_to: null, isOpen: false, shifts: [] },
  // Thursday — open, Lunch is closed, only Diner available with large range
  {
    date: '2026-05-07',
    bookable_from: '2026-02-06 12:00:00',
    bookable_to: '2026-05-06 19:00:00',
    isOpen: true,
    shifts: [
      { id: 1001, name: 'Lunch', possible_guests: [1, 2, 3], waitlist_possible_guests: [], is_offer_required: false, offer_required_from_pax: null, closed: true, bookable_from: '2026-02-06 12:00:00', bookable_to: '2026-05-06 12:00:00', offers: [] },
      { id: 1002, name: 'Diner', possible_guests: [2, 4, 6, 8, 10], waitlist_possible_guests: [12], is_offer_required: false, offer_required_from_pax: null, closed: false, bookable_from: '2026-02-06 19:00:00', bookable_to: '2026-05-06 19:00:00', offers: [] },
    ],
  },
  // Friday — open, both shifts available
  {
    date: '2026-05-08',
    bookable_from: '2026-02-07 12:00:00',
    bookable_to: '2026-05-07 19:00:00',
    isOpen: true,
    shifts: [
      { id: 1001, name: 'Lunch', possible_guests: [1, 2, 3, 4, 5, 6], waitlist_possible_guests: [], is_offer_required: false, offer_required_from_pax: null, closed: false, bookable_from: '2026-02-07 12:00:00', bookable_to: '2026-05-07 12:00:00', offers: [] },
      { id: 1002, name: 'Diner', possible_guests: [1, 2, 3, 4, 5, 6], waitlist_possible_guests: [], is_offer_required: false, offer_required_from_pax: null, closed: false, bookable_from: '2026-02-07 19:00:00', bookable_to: '2026-05-07 19:00:00', offers: [] },
    ],
  },
  // Saturday — open, only a single "Afternoon Tea" shift with exactly one guest option
  {
    date: '2026-05-09',
    bookable_from: '2026-02-08 14:00:00',
    bookable_to: '2026-05-08 17:00:00',
    isOpen: true,
    shifts: [
      { id: 4001, name: 'Afternoon Tea', possible_guests: [2], waitlist_possible_guests: [], is_offer_required: false, offer_required_from_pax: null, closed: false, bookable_from: '2026-02-08 14:00:00', bookable_to: '2026-05-08 17:00:00', offers: [] },
    ],
  },
  // Sunday — open, both shifts available
  {
    date: '2026-05-10',
    bookable_from: '2026-02-09 12:00:00',
    bookable_to: '2026-05-09 19:00:00',
    isOpen: true,
    shifts: [
      { id: 1001, name: 'Lunch', possible_guests: [1, 2, 3, 4, 5, 6], waitlist_possible_guests: [], is_offer_required: false, offer_required_from_pax: null, closed: false, bookable_from: '2026-02-09 12:00:00', bookable_to: '2026-05-09 12:00:00', offers: [] },
      { id: 1002, name: 'Diner', possible_guests: [1, 2, 3, 4, 5, 6], waitlist_possible_guests: [], is_offer_required: false, offer_required_from_pax: null, closed: false, bookable_from: '2026-02-09 19:00:00', bookable_to: '2026-05-09 19:00:00', offers: [] },
    ],
  },
  // Monday — open, all shifts lack availability (both closed)
  {
    date: '2026-05-11',
    bookable_from: '2026-02-10 12:00:00',
    bookable_to: '2026-05-10 19:00:00',
    isOpen: true,
    shifts: [
      { id: 1001, name: 'Lunch', possible_guests: [], waitlist_possible_guests: [], is_offer_required: false, offer_required_from_pax: null, closed: true, bookable_from: '2026-02-10 12:00:00', bookable_to: '2026-05-10 12:00:00', offers: [] },
      { id: 1002, name: 'Diner', possible_guests: [], waitlist_possible_guests: [], is_offer_required: false, offer_required_from_pax: null, closed: true, bookable_from: '2026-02-10 19:00:00', bookable_to: '2026-05-10 19:00:00', offers: [] },
    ],
  },
  // Tuesday — closed with shift data still present (isOpen false overrides)
  {
    date: '2026-05-12',
    bookable_from: '2026-02-11 12:00:00',
    bookable_to: '2026-05-11 19:00:00',
    isOpen: false,
    shifts: [
      { id: 1001, name: 'Lunch', possible_guests: [1, 2, 3], waitlist_possible_guests: [], is_offer_required: false, offer_required_from_pax: null, closed: false, bookable_from: '2026-02-11 12:00:00', bookable_to: '2026-05-11 12:00:00', offers: [] },
      { id: 1002, name: 'Diner', possible_guests: [1, 2], waitlist_possible_guests: [], is_offer_required: false, offer_required_from_pax: null, closed: false, bookable_from: '2026-02-11 19:00:00', bookable_to: '2026-05-11 19:00:00', offers: [] },
    ],
  },
]
