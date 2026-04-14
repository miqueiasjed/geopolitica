const formatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

function formatUnit(value: number, unit: Intl.RelativeTimeFormatUnit) {
  return formatter.format(value, unit)
}

export function formatDistanceToNow(dateValue: string | number | Date, now = Date.now()) {
  const timestamp = new Date(dateValue).getTime()

  if (Number.isNaN(timestamp)) {
    return 'data indisponível'
  }

  const diffMs = timestamp - now
  const diffSeconds = Math.round(diffMs / 1000)
  const absSeconds = Math.abs(diffSeconds)

  if (absSeconds < 60) {
    return formatUnit(diffSeconds, 'second')
  }

  const diffMinutes = Math.round(diffSeconds / 60)
  if (Math.abs(diffMinutes) < 60) {
    return formatUnit(diffMinutes, 'minute')
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) {
    return formatUnit(diffHours, 'hour')
  }

  const diffDays = Math.round(diffHours / 24)
  return formatUnit(diffDays, 'day')
}
