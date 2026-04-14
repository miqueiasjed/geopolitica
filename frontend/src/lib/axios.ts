import axios from 'axios'
import { obterTokenAutenticacao, removerTokenAutenticacao } from '../utils/storage'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((configuracao) => {
  const token = obterTokenAutenticacao()

  if (token) {
    configuracao.headers.Authorization = `Bearer ${token}`
  }

  return configuracao
})

api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    if (erro.response?.status === 401) {
      removerTokenAutenticacao()

      if (!['/login', '/esqueci-senha', '/redefinir-senha'].includes(window.location.pathname)) {
        window.location.assign('/login')
      }
    }

    return Promise.reject(erro)
  },
)

export default api
