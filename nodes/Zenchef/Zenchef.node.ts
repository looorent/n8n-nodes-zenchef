import { type INodeType, type INodeTypeDescription, NodeConnectionTypes } from 'n8n-workflow'
import { availability } from './resources/availability'

export class Zenchef implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Zenchef',
    name: 'zenchef',
    icon: { light: 'file:assets/zenchef.svg', dark: 'file:assets/zenchef.dark.svg' },
    group: ['output'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Check restaurant availability via the Zenchef public widget API',
    defaults: {
      name: 'Zenchef',
    },
    usableAsTool: {
      replacements: {
        description:
          'Look up restaurant availability on Zenchef. ' +
          'Use this tool when the user asks whether a restaurant has open slots, free tables, or availability for a given date or period. ' +
          'Input requires a numeric restaurantId identifying the Zenchef restaurant. ' +
          'Choose an operation: "findForDateRange" (provide fromDate and toDate in YYYY-MM-DD), "findForDay" (provide a single date), "findForMonth" (provide year and month), or "findForUpcomingDays" (provide numberOfDays). ' +
          'Optionally set options.numberOfGuests to filter shifts that accept that party size. ' +
          'Output is a list of available shifts, each containing: shift id and name (e.g. "Lunch", "Dinner"), schedule (date, dayOfWeek, isWeekend), guestCapacity (min/max party size), and bookable window (from/to timestamps). ' +
          'Only open shifts with availability are returned; closed days and fully-booked shifts are excluded.',
      },
    },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [],
    requestDefaults: {
      baseURL: 'https://bookings-middleware.zenchef.com',
      headers: {
        Accept: 'application/json',
      },
    },
    properties: [
      ...availability
    ],
  }
}
