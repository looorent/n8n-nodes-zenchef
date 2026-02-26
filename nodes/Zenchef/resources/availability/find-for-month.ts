import type { INodeProperties } from 'n8n-workflow'
import { buildExpressionToFormatEndOfMonth, buildExpressionToFormatStartOfMonth } from './expression'

export const findForMonthDescription: INodeProperties[] = [
  {
    displayName: 'Year',
    name: 'year',
    type: 'number',
    required: true,
    default: new Date().getFullYear(),
    description: 'The year to query. Dates more than ~2 years in the future are rejected.',
    displayOptions: {
      show: {
        operation: ['findForMonth'],
      },
    },
  },
  {
    displayName: 'Month',
    name: 'month',
    type: 'options',
    required: true,
    default: 1,
    options: [
      { name: 'January', value: 1 },
      { name: 'February', value: 2 },
      { name: 'March', value: 3 },
      { name: 'April', value: 4 },
      { name: 'May', value: 5 },
      { name: 'June', value: 6 },
      { name: 'July', value: 7 },
      { name: 'August', value: 8 },
      { name: 'September', value: 9 },
      { name: 'October', value: 10 },
      { name: 'November', value: 11 },
      { name: 'December', value: 12 },
    ],
    displayOptions: {
      show: {
        operation: ['findForMonth'],
      },
    },
  },
  {
    displayName: 'Month Start',
    name: 'monthStart',
    type: 'hidden',
    default: '',
    displayOptions: {
      show: {
        operation: ['findForMonth'],
      },
    },
    routing: {
      send: {
        type: 'query',
        property: 'date_begin',
        value: buildExpressionToFormatStartOfMonth('year', 'month')
      },
    },
  },
  {
    displayName: 'Month End',
    name: 'monthEnd',
    type: 'hidden',
    default: '',
    displayOptions: {
      show: {
        operation: ['findForMonth'],
      },
    },
    routing: {
      send: {
        type: 'query',
        property: 'date_end',
        value: buildExpressionToFormatEndOfMonth('year', 'month'),
      },
    },
  },
]
