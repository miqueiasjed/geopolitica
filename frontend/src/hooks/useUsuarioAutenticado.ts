import { useQuery } from '@tanstack/react-query'
import { buscarUsuarioAutenticado } from '../services/api'

export function useUsuarioAutenticado() {
  return useQuery({
    queryKey: ['auth', 'usuario'],
    queryFn: buscarUsuarioAutenticado,
    retry: false,
  })
}
