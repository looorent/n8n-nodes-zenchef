import type { INodeProperties } from 'n8n-workflow'
import { buildExpressionToFormatDate } from './expression'

export const findForDateRange: INodeProperties[] = [
  {
    displayName: 'From Date',
    name: 'fromDate',
    type: 'dateTime',
    required: true,
    default: null,
    description: 'Start of the date range. Must be within the last month.',
    displayOptions: {
      show: {
        operation: ['findForDateRange'],
      },
    },
    routing: {
      send: {
        type: 'query',
        property: 'date_begin',
        value: buildExpressionToFormatDate('fromDate'),
      },
    },
  },
  {
    displayName: 'To Date',
    name: 'toDate',
    type: 'dateTime',
    required: true,
    default: null,
    description: 'End of the date range. The range should not exceed ~30 days.',
    displayOptions: {
      show: {
        operation: ['findForDateRange'],
      },
    },
    routing: {
      send: {
        type: 'query',
        property: 'date_end',
        value: buildExpressionToFormatDate('toDate'),
      },
    },
  },
]
