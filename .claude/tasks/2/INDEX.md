# Tasks do Plano 2 – Autenticação e Controle de Acesso (M00)

> Gerado em: 2026-04-14

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|-------------|
| 2.1 | Migration e Model Assinante | backend-estrutura | ✅ | baixa |
| 2.2 | Seeder de Roles Spatie e usuário admin inicial | backend-estrutura | ✅ | baixa |
| 2.3 | AuthController (login, logout, me) com Sanctum | backend-endpoint | ✅ | média |
| 2.4 | SenhaController, PerfilController e middleware EnsureAssinanteAtivo | backend-endpoint | ✅ | média |
| 2.5 | Frontend: AuthContext, useAuth e RotaProtegida | frontend-componente | ✅ | média |
| 2.6 | Páginas React: Login, EsqueciSenha, RedefinirSenha e Perfil | frontend-pagina | ✅ | alta |

## Ordem de execução
2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6

## Dependências internas
- 2.2 depende de 2.1 (precisa da tabela `assinantes` e `users` para seeders)
- 2.3 depende de 2.1 e 2.2 (precisa dos Models e roles criados)
- 2.4 depende de 2.3 (mesmo controller base, usa padrão estabelecido)
- 2.5 é independente do backend (pode rodar em paralelo com 2.3)
- 2.6 depende de 2.5 (precisa do AuthContext e RotaProtegida)
