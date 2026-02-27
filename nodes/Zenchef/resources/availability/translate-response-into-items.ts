import type { IDataObject, IExecuteSingleFunctions, IN8nHttpFullResponse, INodeExecutionData } from 'n8n-workflow'

export async function translateResponseIntoItems(
  this: IExecuteSingleFunctions,
  _items: INodeExecutionData[],
  response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
  const body = response.body

  if (!Array.isArray(body)) {
    return []
  }

  const days: DayAvailability[] = Array.isArray(body[0]) ? body[0] : body
  const options = this.getNodeParameter('options', {}) as { numberOfGuests?: number }
  const numberOfGuests = options.numberOfGuests ?? 0

  const matchesGuestCount = (shift: Shift): boolean =>
    numberOfGuests <= 0 || (shift.possible_guests ?? []).includes(numberOfGuests)

  const result = days
    .filter(day => day.isOpen === true && Array.isArray(day.shifts))
    .map(day => ({ ...day, shifts: (day.shifts || []).filter(hasAvailabilities).filter(matchesGuestCount) }))
    .flatMap(flattenDayToShiftItems)

  return this.helpers.returnJsonArray(result)
}

function hasAvailabilities(shift: Shift): boolean {
  return shift.closed !== true
    && Array.isArray(shift.possible_guests)
    && shift.possible_guests.length > 0
}

interface Shift {
  id?: number
  name?: string
  possible_guests?: number[]
  closed?: boolean
  bookable_from?: string
  bookable_to?: string
}

interface DayAvailability {
  date: string
  isOpen?: boolean
  shifts?: Shift[]
}

const SUNDAY = 0
const SATURDAY = 6
function flattenDayToShiftItems(day: { date: string, shifts: Shift[] }): IDataObject[] {
  const dayIndex = new Date(`${day.date}T00:00:00Z`).getUTCDay()
  const guests = (shift: Shift) => shift.possible_guests || [0]
  return day.shifts.map(shift => ({
    id: shift.id ?? null,
    name: shift.name || null,
    schedule: {
      date: day.date,
      dayOfWeek: dayIndex,
      isWeekend: dayIndex === SUNDAY || dayIndex === SATURDAY,
    },
    guestCapacity: {
      min: Math.min(...guests(shift)),
      max: Math.max(...guests(shift)),
    },
    bookable: {
      from: shift.bookable_from,
      to: shift.bookable_to,
    }
  }))
}
