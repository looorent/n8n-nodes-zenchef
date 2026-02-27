import type { INodeProperties, INodePropertyRouting } from 'n8n-workflow'
import { findForDateRange } from './find-for-date-range'
import { findForDayProperties as findForDay } from './find-for-day'
import { findForMonthDescription as findForMonth } from './find-for-month'
import { findForUpcomingDaysDescription as findForUpcomingDays } from './find-for-upcoming-days'
import { handleErrors } from './handle-errors'
import { translateResponseIntoItems } from './translate-response-into-items'

const routing: INodePropertyRouting = {
  request: {
    method: 'GET' as const,
    url: '/getAvailabilitiesSummary',
    ignoreHttpStatusErrors: true,
  },
  output: {
    postReceive: [handleErrors, translateResponseIntoItems],
  },
}

const restaurantId: INodeProperties = {
  displayName: 'Restaurant ID',
  name: 'restaurantId',
  type: 'number',
  required: true,
  default: null,
  placeholder: 'e.g. 123456',
  description: 'The numeric ID Zenchef assigns to each restaurant. Find it by inspecting the network requests made by the restaurant\'s booking widget.',
  routing: {
    send: {
      type: 'query',
      property: 'restaurantId',
    },
  },
}

const options: INodeProperties = {
  displayName: 'Options',
  name: 'options',
  type: 'collection',
  placeholder: 'Add Option',
  default: {},
  options: [
    {
      displayName: 'Number of Guests',
      name: 'numberOfGuests',
      type: 'number',
      default: 0,
      description: 'When set, only return shifts that accept this party size. Leave at 0 to skip filtering.',
      typeOptions: {
        minValue: 0,
      },
    },
  ],
}


const operation: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  options: [
    {
      name: 'Find for Date Range',
      value: 'findForDateRange',
      action: 'Find availability for a date range',
      description: 'Pick two dates (max ~30 days apart)',
      routing: routing,
    },
    {
      name: 'Find for Day',
      value: 'findForDay',
      action: 'Find availability for a day',
      description: 'Check a single day',
      routing: routing,
    },
    {
      name: 'Find for Month',
      value: 'findForMonth',
      action: 'Find availability for a month',
      description: 'Get the full calendar for a given month',
      routing: routing,
    },
    {
      name: 'Find for Upcoming Days',
      value: 'findForUpcomingDays',
      action: 'Find availability for upcoming days',
      description: 'Check the next N days starting from today',
      routing: routing,
    },
  ],
  default: 'findForDateRange',
}

export const availability: INodeProperties[] = [
  restaurantId,
  operation,
  ...findForDateRange,
  ...findForDay,
  ...findForMonth,
  ...findForUpcomingDays,
  options,
]
