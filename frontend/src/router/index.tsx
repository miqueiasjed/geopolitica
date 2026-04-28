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
import { AdminUsuarios } from '../pages/admin/AdminUsuarios'
import { AdminConfiguracoes } from '../pages/admin/AdminConfiguracoes'
import { UsoPage } from '../pages/admin/ia/UsoPage'
import { AdminLayout } from '../components/AdminLayout'
import { AdminCrises } from '../pages/admin/AdminCrises'
import { AdminFontes } from '../pages/admin/AdminFontes'
import { AdminPaises } from '../pages/admin/AdminPaises'
import { AceitarConvitePage } from '../pages/AceitarConvitePage'
import { MeusPaisesPage } from '../pages/MeusPaisesPage'
import { PerfilPaisPage } from '../pages/PerfilPaisPage'
import { ChatBriefings } from '../pages/ChatBriefings'
import { MonitorEleitoral } from '../pages/dashboard/MonitorEleitoral'
import { MonitorGuerra } from '../pages/dashboard/MonitorGuerra'
import { RelatoriosIA } from '../pages/dashboard/RelatoriosIA'
import { NovoRelatorio } from '../pages/dashboard/NovoRelatorio'

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
          <Route path="/dashboard/monitor-eleitoral" element={<MonitorEleitoral />} />
          <Route path="/dashboard/monitor-guerra" element={<MonitorGuerra />} />
          <Route path="/dashboard/chat" element={<ChatBriefings />} />
          <Route path="/dashboard/relatorios" element={<RelatoriosIA />} />
          <Route path="/dashboard/relatorios/novo" element={<NovoRelatorio />} />
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
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="webhook-eventos" element={<AdminWebhookEventos />} />
          <Route path="novo-conteudo" element={<AdminNovoConteudo />} />
          <Route path="biblioteca" element={<AdminBiblioteca />} />
          <Route path="eleicoes" element={<AdminEleicoes />} />
          <Route path="crises" element={<AdminCrises />} />
          <Route path="fontes" element={<AdminFontes />} />
          <Route path="paises" element={<AdminPaises />} />
          <Route path="b2b" element={<AdminB2BPage />} />
          <Route path="configuracoes" element={<AdminConfiguracoes />} />
          <Route path="ia/uso" element={<UsoPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
