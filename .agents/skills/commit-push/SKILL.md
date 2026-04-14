---
name: commit-push
description: Realizar commit e push de todas as alterações para o repositório
---

# Skill: Commit e Push

Este workflow realiza o merge de todas as alterações, gera uma mensagem de commit adequada com base no diff e faz o push para o repositório remoto. 

## Fluxo de Execução

**Validações Pré-Commit:**
1. Verifique nos arquivos que foram alterados (dê um `git diff` se precisar antes) se há código residual de debug largado, como `dd()`, `dump()`, `print_r()`, `console.log()` ou `debugger`. Remova qualquer ocorrência deixada acidentalmente.
2. Execute a verificação de tipos do TypeScript para assegurar que não quebrou nada no frontend: rode `npx tsc --noEmit`. Se houver erros relacionados às suas modificações, corrija.
3. **Se as alterações envolverem qualquer arquivo frontend (React, TypeScript, CSS):** rode `npm run build` e confirme que o build termina **sem erros**. Erros de build bloqueiam o deploy — não comitar sem build verde.
4. Se as alterações envolverem o PHP (Backend), identifique os módulos ou locais tocados e rode os testes estritamente relacionados a eles, com algo como `php artisan test --filter=NomeDoModulo` ou via arquivo de teste específico. Garanta que passem de forma esverdeada!

**Commit e Push Automático:**
4. Verifique o status atual do git executando: `git status`
5. Antes do add total, veja as alterações (caso ainda não tenha feito) executando: `git diff` e `git diff --cached`
6. Adicione os arquivos: `git add .`
7. Baseando-se nas alterações, crie uma mensagem de commit semântica (ex: `feat: adicionado módulo X` ou `fix: corrigido erro Y`).
8. Execute o commit com a mensagem: `git commit -m "[sua mensagem gerada]"`
9. Faça o push das alterações: `git push`
10. Informe o usuário detalhadamente se tudo (testes, typer-check e git) passou com sucesso ou se algo falhou no meio do caminho.
