import type { INodeProperties } from 'n8n-workflow'
import { buildExpressionForUpcomingDays, expressionForToday } from './expression'

export const findForUpcomingDaysDescription: INodeProperties[] = [
  {
    displayName: 'Number of Days',
    name: 'numberOfDays',
    type: 'number',
    required: true,
    default: 7,
    description: 'How many days ahead to check, starting from today. The API supports up to about 30 days.',
    typeOptions: {
      minValue: 1,
    },
    displayOptions: {
      show: {
        operation: ['findForUpcomingDays'],
      },
    },
  },
  {
    displayName: 'Upcoming Start',
    name: 'upcomingStart',
    type: 'hidden',
    default: '',
    displayOptions: {
      show: {
        operation: ['findForUpcomingDays'],
      },
    },
    routing: {
      send: {
        type: 'query',
        property: 'date_begin',
        value: expressionForToday,
      },
    },
  },
  {
    displayName: 'Upcoming End',
    name: 'upcomingEnd',
    type: 'hidden',
    default: '',
    displayOptions: {
      show: {
        operation: ['findForUpcomingDays'],
      },
    },
    routing: {
      send: {
        type: 'query',
        property: 'date_end',
        value: buildExpressionForUpcomingDays('numberOfDays'),
      },
    },
  },
]
