import type { IExecuteSingleFunctions, INodeExecutionData, IN8nHttpFullResponse } from 'n8n-workflow'
import { NodeApiError } from 'n8n-workflow'

export async function handleErrors(
  this: IExecuteSingleFunctions,
  items: INodeExecutionData[],
  response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
  const node = this.getNode()
  const statusCode = response.statusCode

  switch (true) {
    case statusCode === 429:
      throw new NodeApiError(node, {}, {
        message: 'Rate limited by Zenchef',
        description: 'Too many requests. Reduce the frequency of your workflow executions.',
        httpCode: '429',
      })
    case statusCode >= 500:
      throw new NodeApiError(node, {}, {
        message: 'Zenchef server error',
        description: 'The Zenchef API is temporarily unavailable. Try again later.',
        httpCode: String(statusCode),
      })
    case statusCode >= 400: {
      const detail = translatePlainTextError(response.body)
      throw new NodeApiError(node, {}, {
        message: detail.message,
        description: detail.description,
        httpCode: String(statusCode),
      })
    }
    case hasContentType(response, 'application/json'): {
      const jsonError = extractJsonErrorDetail(response.body)
      if (jsonError) {
        throw new NodeApiError(node, {}, {
          message: jsonError.message,
          description: jsonError.description,
          httpCode: String(statusCode),
        })
      }
      break
    }
  }

  if (items.length === 0) {
    throw new NodeApiError(node, {}, {
      message: 'No availability data returned',
      description: 'The Zenchef API returned an empty response. Verify that the Restaurant ID exists and the date range is valid.',
    })
  } else {
    return items
  }
}

interface ErrorDetail {
  message: string
  description: string
}

interface ValidationEntry {
  field?: string
  message?: string
}

interface JsonErrorBody {
  error?: {
    message?: string | Record<string, string[]>
    list?: ValidationEntry[]
  }
}

const PLAIN_TEXT_ERRORS: Record<string, ErrorDetail> = {
  'Missing restaurantId': {
    message: 'Restaurant ID is missing',
    description: 'Provide a valid numeric Restaurant ID.',
  },
  'Invalid restaurantId': {
    message: 'Restaurant ID not found',
    description: 'No restaurant matches this ID. Verify the ID is correct.',
  },
  'Invalid date_begin': {
    message: 'The start date is out of range',
    description: 'The date must be within the last month and no more than about 2 years in the future.',
  },
  'Invalid date_end': {
    message: 'The end date is out of range',
    description: 'The date must be no more than about 2 years in the future.',
  },
  'date_begin must be less than date_end': {
    message: 'Start date must be before the end date',
    description: 'Swap the dates or adjust the range so the start date comes first.',
  },
}

function translatePlainTextError(body: unknown): ErrorDetail {
  const trimmed = typeof body === 'string' ? body.trim() : ''

  return PLAIN_TEXT_ERRORS[trimmed] || {
    message: trimmed || 'Zenchef API error',
    description: 'The API returned an unexpected error.',
  }
}

function translateValidationEntry(entry: ValidationEntry): string | null {
  const field = entry.field || 'unknown'
  const message = entry.message?.trim() || ''

  if (message.includes('validation.date_format')) {
    const fieldLabel = field === 'date-begin' ? 'start date' : 'end date'
    return `The ${fieldLabel} is not a valid date`
  } else if (message.includes('date after or equal to')) {
    return 'The end date must be today or later'
  } else {
    return message || null
  }
}

function translateValidationEntries(entries: ValidationEntry[]): ErrorDetail {
  const translated = entries
    .map(entry => translateValidationEntry(entry))
    .filter((message) => message !== null)

  const unique = [...new Set(translated)]

  return {
    message: unique[0] || 'Invalid date parameters',
    description: unique.length > 1
      ? `${unique.join('. ')}.`
      : 'Check that the dates are valid and in YYYY-MM-DD format.',
  }
}

function extractJsonErrorDetail(body: unknown): ErrorDetail | null {
  if (typeof body !== 'object' || body === null || !(body as JsonErrorBody).error) {
    return null
  }

  const payload = body as JsonErrorBody

  if (!payload.error) {
    return null
  }

  const errorMessage = payload.error.message

  if (typeof errorMessage === 'string') {
    if (errorMessage.toLowerCase().includes("une erreur s'est produite")) {
      return {
        message: 'The date range is too large',
        description: 'Zenchef supports a maximum range of about 30 days. Use a shorter date range.',
      }
    } else {
      return {
        message: 'Zenchef API error',
        description: errorMessage,
      }
    }
  }

  if (Array.isArray(payload.error.list) && payload.error.list.length > 0) {
    return translateValidationEntries(payload.error.list)
  }

  if (typeof errorMessage === 'object' && errorMessage !== null) {
    const entries = Object.entries(errorMessage).flatMap(([field, messages]) =>
      Array.isArray(messages)
        ? messages.map(message => ({ field, message }))
        : [],
    )
    if (entries.length > 0) {
      return translateValidationEntries(entries)
    }
  }

  return {
    message: 'Zenchef API error',
    description: 'The API returned an error in the response body.',
  }
}

function hasContentType(response: IN8nHttpFullResponse, type: string): boolean {
  const contentType = (response.headers as Record<string, unknown>)?.['content-type']
  return typeof contentType === 'string' && contentType.toLowerCase().includes(type)
}
