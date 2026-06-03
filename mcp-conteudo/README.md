# MCP Conteúdo

Servidor MCP (Model Context Protocol) que permite ao Claude **ler** os conteúdos
existentes da biblioteca e **criar** novos, exatamente como o formulário
`admin/novo-conteudo`. Conversa com a API Laravel usando um token Sanctum de admin.

## Ferramentas expostas

| Ferramenta | O que faz |
|---|---|
| `guia_de_publicacao` | Regras de como postar corretamente: campos, limites, plano por tipo, formato HTML do corpo. |
| `listar_conteudos` | Lista conteúdos existentes (filtros: `tipo`, `status`, `q`, `page`). Para aprender o padrão. |
| `obter_conteudo` | Retorna um conteúdo completo por `id`, incluindo o HTML do corpo. |
| `criar_conteudo` | Cria um novo briefing, mapa ou tese (plano mínimo é derivado do tipo). |

## Pré-requisitos

- Node 18+.
- Um usuário com role `admin`.
- A API acessível. Padrão: produção em `https://mygip.com.br/api`.

## Configuração (caminho recomendado: e-mail e senha)

O servidor MCP roda **localmente na sua máquina**. Ele só faz chamadas HTTP para
a API (produção por padrão), então não precisa instalar nada no servidor/Forge.

1. Instale dependências (já feito se você rodou `npm install` aqui):

   ```bash
   cd mcp-conteudo && npm install
   ```

2. Exporte e-mail e senha de um admin no seu shell (lidos por `.mcp.json`):

   ```bash
   export GPI_ADMIN_EMAIL="seu-email@admin.com"
   export GPI_ADMIN_PASSWORD="sua-senha"
   ```

   O servidor faz `POST /auth/login` sozinho e guarda o token durante a sessão.

   Dica: coloque essas linhas no seu `~/.zshrc` para não repetir toda vez.

### Alternativas

- Apontar para outra API (ex: backend local):
  `export GPI_API_BASE_URL="http://localhost:8000/api"`
- Usar token fixo em vez de e-mail/senha (tem prioridade se definido):
  `cd backend && php artisan conteudo:mcp-token seu-email@admin.com`
  depois `export GPI_ADMIN_TOKEN="o-token-gerado"`.

4. O arquivo `.mcp.json` na raiz do projeto já registra este servidor com o nome
   `conteudo`. Reinicie o Claude Code na raiz do projeto para que ele apareça.
   Verifique com `/mcp`.

## Fluxo sugerido para o Claude

1. `guia_de_publicacao` → entender as regras.
2. `listar_conteudos { tipo: "briefing" }` → ver exemplos recentes.
3. `obter_conteudo { id }` → estudar o corpo de um exemplo a fundo.
4. `criar_conteudo { ... }` → criar imitando tom, estrutura e tamanho.

Por padrão `criar_conteudo` salva como **rascunho** (`publicado: false`).
Passe `publicado: true` para publicar imediatamente.
