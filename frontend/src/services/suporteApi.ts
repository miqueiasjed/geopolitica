import api from '../lib/axios'
import type { SuporteTicket, AbrirTicketPayload, ResponderTicketPayload } from '../types/suporte'
import type { PaginacaoLaravel } from '../types/admin'

export const suporteKeys = {
  all: ['suporte'] as const,
  tickets: () => [...suporteKeys.all, 'tickets'] as const,
  ticket: (id: number) => [...suporteKeys.all, 'tickets', id] as const,
  adminTickets: (status?: string) => [...suporteKeys.all, 'admin', 'tickets', status] as const,
  adminTicket: (id: number) => [...suporteKeys.all, 'admin', 'tickets', id] as const,
  naoLidos: () => [...suporteKeys.all, 'admin', 'nao-lidos'] as const,
}

function buildFormData(payload: AbrirTicketPayload | ResponderTicketPayload): FormData {
  const form = new FormData()
  if ('assunto' in payload) form.append('assunto', payload.assunto)
  form.append('corpo', payload.corpo)
  payload.anexos?.forEach((file) => form.append('anexos[]', file))
  return form
}

// --- Usuário ---

export async function buscarMeusTickets(): Promise<SuporteTicket[]> {
  const res = await api.get<SuporteTicket[]>('/suporte/tickets')
  return res.data
}

export async function abrirTicket(payload: AbrirTicketPayload): Promise<SuporteTicket> {
  const hasFiles = payload.anexos && payload.anexos.length > 0
  if (hasFiles) {
    const res = await api.post<SuporteTicket>('/suporte/tickets', buildFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  }
  const res = await api.post<SuporteTicket>('/suporte/tickets', {
    assunto: payload.assunto,
    corpo: payload.corpo,
  })
  return res.data
}

export async function buscarTicket(id: number): Promise<SuporteTicket> {
  const res = await api.get<SuporteTicket>(`/suporte/tickets/${id}`)
  return res.data
}

export async function responderTicket(id: number, payload: ResponderTicketPayload): Promise<SuporteTicket> {
  const hasFiles = payload.anexos && payload.anexos.length > 0
  if (hasFiles) {
    const res = await api.post<SuporteTicket>(`/suporte/tickets/${id}/responder`, buildFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  }
  const res = await api.post<SuporteTicket>(`/suporte/tickets/${id}/responder`, { corpo: payload.corpo })
  return res.data
}

// --- Admin ---

export async function buscarAdminTickets(status?: string): Promise<PaginacaoLaravel<SuporteTicket>> {
  const res = await api.get<PaginacaoLaravel<SuporteTicket>>('/admin/suporte/tickets', {
    params: status ? { status } : {},
  })
  return res.data
}

export async function buscarAdminTicket(id: number): Promise<SuporteTicket> {
  const res = await api.get<SuporteTicket>(`/admin/suporte/tickets/${id}`)
  return res.data
}

export async function responderAdminTicket(id: number, payload: ResponderTicketPayload): Promise<SuporteTicket> {
  const hasFiles = payload.anexos && payload.anexos.length > 0
  if (hasFiles) {
    const res = await api.post<SuporteTicket>(`/admin/suporte/tickets/${id}/responder`, buildFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  }
  const res = await api.post<SuporteTicket>(`/admin/suporte/tickets/${id}/responder`, { corpo: payload.corpo })
  return res.data
}

export async function fecharTicket(id: number): Promise<SuporteTicket> {
  const res = await api.patch<SuporteTicket>(`/admin/suporte/tickets/${id}/fechar`)
  return res.data
}

export async function buscarNaoLidos(): Promise<{ total: number }> {
  const res = await api.get<{ total: number }>('/admin/suporte/tickets/nao-lidos')
  return res.data
}
