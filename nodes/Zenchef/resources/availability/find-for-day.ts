import type { INodeProperties } from 'n8n-workflow'
import { buildExpressionToFormatDate } from './expression'

export const findForDayProperties: INodeProperties[] = [
  {
    displayName: 'Date',
    name: 'date',
    type: 'dateTime',
    required: true,
    default: null,
    description: 'The day to check. Must be within the last month up to about 2 years in the future.',
    displayOptions: {
      show: {
        operation: ['findForDay'],
      },
    },
    routing: {
      send: {
        type: 'query',
        property: 'date_begin',
        value: buildExpressionToFormatDate('date'),
      },
    },
  },
  {
    displayName: 'Date (End)',
    name: 'dateEnd',
    type: 'hidden',
    default: buildExpressionToFormatDate('date'),
    displayOptions: {
      show: {
        operation: ['findForDay'],
      },
    },
    routing: {
      send: {
        type: 'query',
        property: 'date_end',
        value: buildExpressionToFormatDate('date'),
      },
    },
  },
]
