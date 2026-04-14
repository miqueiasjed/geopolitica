export function formatarDataCurta(valor: string | null | undefined) {
  if (!valor) {
    return '—'
  }

  const data = new Date(valor)

  if (Number.isNaN(data.getTime())) {
    return valor
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(data)
}

export function formatarJsonPretty(valor: unknown) {
  if (valor === null || valor === undefined) {
    return 'null'
  }

  if (typeof valor === 'string') {
    try {
      return JSON.stringify(JSON.parse(valor), null, 2)
    } catch {
      return valor
    }
  }

  try {
    return JSON.stringify(valor, null, 2)
  } catch {
    return String(valor)
  }
}
