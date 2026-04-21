import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from '../components/DashboardLayout'
import { RotaProtegida } from '../components/RotaProtegida'
import { useAuth } from '../hooks/useAuth'
import { Feed } from '../pages/Feed'
import { Mapa } from '../pages/Mapa'
import { EsqueciSenha } from '../pages/EsqueciSenha'
import { Login } from '../pages/Login'
import { Perfil } from '../pages/Perfil'
import { AdminAssinantes } from '../pages/admin/AdminAssinantes'
import { AdminWebhookEventos } from '../pages/admin/AdminWebhookEventos'
import { AdminNovoConteudo } from '../pages/admin/AdminNovoConteudo'
import { AdminBiblioteca } from '../pages/admin/AdminBiblioteca'
import { RedefinirSenha } from '../pages/RedefinirSenha'
import { Biblioteca } from '../pages/dashboard/Biblioteca'
import { ConteudoLeitura } from '../pages/dashboard/ConteudoLeitura'
import { Equipe } from '../pages/dashboard/Equipe'
import { Timeline } from '../pages/Timeline'
import { RadarEleicoes } from '../pages/RadarEleicoes'
import { AdminEleicoes } from '../pages/admin/AdminEleicoes'
import { AdminB2BPage } from '../pages/admin/AdminB2BPage'
import { AdminLayout } from '../components/AdminLayout'
import { AceitarConvitePage } from '../pages/AceitarConvitePage'
import { MeusPaisesPage } from '../pages/MeusPaisesPage'
import { PerfilPaisPage } from '../pages/PerfilPaisPage'
import { ChatBriefings } from '../pages/ChatBriefings'

function RedirecionamentoInicial() {
  const { isAuthenticated } = useAuth()

  return <Navigate to={isAuthenticated ? '/dashboard/feed' : '/login'} replace />
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RedirecionamentoInicial />} />
      <Route path="/login" element={<Login />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
      <Route path="/convite/:token" element={<AceitarConvitePage />} />
      <Route element={<RotaProtegida />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard/feed" element={<Feed />} />
          <Route path="/dashboard/mapa" element={<Mapa />} />
          <Route path="/dashboard/biblioteca" element={<Biblioteca />} />
          <Route path="/dashboard/biblioteca/:slug" element={<ConteudoLeitura />} />
          <Route path="/dashboard/timeline" element={<Timeline />} />
          <Route path="/dashboard/eleicoes" element={<RadarEleicoes />} />
          <Route path="/dashboard/chat" element={<ChatBriefings />} />
          <Route path="/paises" element={<MeusPaisesPage />} />
          <Route path="/paises/:codigo" element={<PerfilPaisPage />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route element={<RotaProtegida requiredRole="company_admin" />}>
            <Route path="/dashboard/equipe" element={<Equipe />} />
          </Route>
        </Route>
      </Route>
      <Route element={<RotaProtegida requiredRole="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/assinantes" replace />} />
          <Route path="assinantes" element={<AdminAssinantes />} />
          <Route path="webhook-eventos" element={<AdminWebhookEventos />} />
          <Route path="novo-conteudo" element={<AdminNovoConteudo />} />
          <Route path="biblioteca" element={<AdminBiblioteca />} />
          <Route path="eleicoes" element={<AdminEleicoes />} />
          <Route path="b2b" element={<AdminB2BPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
