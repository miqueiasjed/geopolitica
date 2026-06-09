# Memória — Projeto Geopolítica / GPI (mygip.com.br)

## Credenciais admin mygip.com.br
As credenciais de admin da API do mygip.com.br ficam em `backend/.env`:
- `GPI_ADMIN_EMAIL`
- `GPI_ADMIN_PASSWORD`

Para publicar conteúdo (briefing/mapa/tese), usar a skill `mygip-conteudo`:
fazer login em `POST https://mygip.com.br/api/auth/login` com essas variáveis
para obter o Bearer token, e então usar `POST /api/admin/conteudos`.
Não pedir credenciais ao usuário de novo — ler do `.env`.

## Preferência: publicar briefing a partir de PDF
Quando o Miqueias enviar um PDF de briefing para o mygip:
- O corpo deve ser EXATAMENTE o texto do PDF (transcrição literal via pdftotext),
  apenas mapeando seções em <h2> e parágrafos em <p>. Nada de reescrever/resumir.
- Publicar DIRETO (publicado: true), sem rascunho e sem pedir confirmação.
Regra também adicionada à skill mygip-conteudo (Seção 0).
