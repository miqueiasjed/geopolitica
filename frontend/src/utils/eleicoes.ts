export function parseDataEleicao(data: string | null | undefined): Date | null {
  if (!data) return null

  const normalizada = data.trim()
  if (!normalizada) return null

  const dataIso = normalizada.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (dataIso) {
    const [, ano, mes, dia] = dataIso
    return new Date(Number(ano), Number(mes) - 1, Number(dia), 12)
  }

  const dataBr = normalizada.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (dataBr) {
    const [, dia, mes, ano] = dataBr
    return new Date(Number(ano), Number(mes) - 1, Number(dia), 12)
  }

  const dataParseada = new Date(normalizada)
  return Number.isNaN(dataParseada.getTime()) ? null : dataParseada
}

export function getMesEleicao(data: string | null | undefined): number | null {
  return parseDataEleicao(data)?.getMonth() ?? null
}

export function formatarDataEleicao(data: string | null | undefined): string {
  const dataParseada = parseDataEleicao(data)
  if (!dataParseada) return 'Data indefinida'

  return dataParseada.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatarDataEleicaoLonga(data: string | null | undefined): string {
  const dataParseada = parseDataEleicao(data)
  if (!dataParseada) return 'Data indefinida'

  return dataParseada.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}
