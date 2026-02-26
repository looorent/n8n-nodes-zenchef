export function buildExpressionToFormatDate(parameterName: string): string {
  return `={{(() => { const d = new Date($parameter.${parameterName}); return String(d.getFullYear()).padStart(4,"0") + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0") })()}}`
}

export function buildExpressionToFormatStartOfMonth(yearParameterName: string, monthParameterName: string): string {
  return `={{String($parameter.${yearParameterName}).padStart(4,"0") + "-" + String($parameter.${monthParameterName}).padStart(2,"0") + "-01"}}`
}

export function buildExpressionToFormatEndOfMonth(yearParameterName: string, monthParameterName: string): string {
  return `={{(() => { const d = new Date($parameter.${yearParameterName}, $parameter.${monthParameterName}, 0); return String(d.getFullYear()).padStart(4,"0") + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0") })()}}`
}

export function buildExpressionForUpcomingDays(numberOfDaysParameterName: string): string {
  return `={{(() => { const d = new Date(); d.setDate(d.getDate() + $parameter.${numberOfDaysParameterName} - 1); return String(d.getFullYear()).padStart(4,"0") + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0") })()}}`
}

export const expressionForToday = '={{(() => { const d = new Date(); return String(d.getFullYear()).padStart(4,"0") + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0") })()}}'