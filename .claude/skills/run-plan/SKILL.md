---
name: run-plan
description: Executa o próximo plano disponível, processando tasks ativamente e atualizando os status e logs após testes.
---
# Skill: Run Plan

Siga os passos abaixo, passo a passo, para executar exatamente UM plano das pendências do projeto:

## 🚀 INÍCIO: CHECAGEM DE HANDOFF
1. **SEMPRE**, antes de começar um plano novo, verifique o arquivo `.claude/handoff.md`.
2. Se o status no handoff for diferente de "Concluído/Vazio" (ou seja, existir um plano em andamento pausado por limites de tokens), ignore a busca por novos planos em `/plans/INDEX.md` e **retome o trabalho exatamente a partir das definições do handoff**.

## 🛑 LIMITADOR DE CONTEXTO E PAUSA (HANDOFF)
- **Como pausar com segurança:** Se a sessão atual gastar perto de **80.000 tokens** ou você achar que o chat já alongou muito com testes:
  1. Sobrescreva o arquivo `.claude/handoff.md` registrando o seu estado atual usando a estrutura sugerida abaixo.
     ```md
     # Handoff – Último estado
     Plano: [n]
     Task: [m]
     Status: Em andamento (XX%)
     O que foi feito: [lista]
     O que falta: [lista]
     Arquivos modificados: [lista]
     Próxima ação: [O que a IA deve fazer ao iniciar uma nova conversa]
     ```
  2. Commite as alterações (se houver algo que vale salvar) com um prefixo (ex: `wip: handoff do plano X`).
  3. Peça explicitamente para o usuário **encerrar este chat, abrir uma nova janela** e digitar `run-plan` novamente, que engatará o handoff.

---

3. Se não houver handoff pendente, leia o arquivo `.claude/plans/INDEX.md` e `.claude/rules.md` para escolher e focar em **APENAS UM PLANO NOVO**.
   - *Nota Importante: Acesse o arquivo `.claude/progress.txt` **apenas se** você se deparar com algum bug recorrente e precisar entender como problemas passados semelhantes foram resolvidos. Não leia esse arquivo inteiro por padrão para poupar contexto.*
4. Uma vez que o plano (`[number]`) foi escolhido, estude o arquivo descritivo dele em `.claude/plans/[number].md` e todas as tarefas mapeadas que ficam em `.claude/tasks/[number]/`.

## ⚠️ SKILLS OBRIGATÓRIAS ANTES DE CODAR

Antes de escrever qualquer linha de código, identifique o tipo de cada task e leia a skill correspondente:

| Tipo de task | Skill obrigatória | Arquivo |
|---|---|---|
| Qualquer código Laravel (controller, service, model, migration, route) | **laravel-arquitetura** | `.claude/skills/laravel-arquitetura/SKILL.md` |
| Qualquer componente ou página React/frontend | **frontend-design-system** | `.claude/skills/frontend-design-system/SKILL.md` |
| Qualquer manipulação de data ou timezone | **datas-timezone** | `.claude/skills/datas-timezone/SKILL.md` |
| Qualquer criação ou alteração de permissão | **permissoes-e-sync** | `.claude/skills/permissoes-e-sync/SKILL.md` |

### Regras invioláveis de backend (resumo da skill laravel-arquitetura):
- **Controller DEVE ser fino:** apenas recebe request → chama service → retorna resposta.
- **NUNCA** colocar Eloquent (`::query()`, `->create()`, `->save()`, `->delete()`, `->where()`) diretamente no controller.
- **NUNCA** usar `$request->validate()` no controller — sempre usar **FormRequest**.
- **TODA** lógica de negócio, cálculos, mapeamentos e queries ficam no **Service**.
- Métodos privados de mapeamento/normalização no controller são **proibidos** — usar Resource ou Service.
- Antes de criar um novo Service, verificar se já existe um adequado em `app/Services/`.

5. **EXECUÇÃO COM SUBAGENTES (ECONOMIA DE CONTEXTO E PARALELISMO):**
   - Analise as tasks do plano selecionado. **Se existirem tasks que são independentes entre si (não dependem da conclusão de outra), você pode executar várias delas de uma vez**. Caso tenham dependência, respeite a ordem executando sequencialmente.
   - Para evitar gastar os tokens e o limite de contexto da janela principal, você usará a CLI do Claude como subagente(s).
   - **IMPORTANTE:** O subagente nasce "limpo", ou seja, ele NÃO sabe da arquitetura Laravel ou outras regras se você não pedir explicitamente no comando.
   - Sempre inclua no prompt do subagente o caminho da skill obrigatória mapeada no passo anterior. Exemplo de comando agrupando tasks:
     `claude -p --permission-mode bypassPermissions "Leia a skill obrigatória em .claude/skills/[skill-necessaria]/SKILL.md e as especificações das tasks em .claude/tasks/[number]/[task1].md e .claude/tasks/[number]/[task2].md. Execute as implementações aplicando estritamente os padrões da skill lida. Retorne quando acabar."`
   - O subagente vai rodar de forma isolada, manipulará os arquivos/testes e, quando finalizar, retornará o resultado ao terminal, poupando a memória desta sessão principal.
6. Após a conclusão bem-sucedida das tasks pelo(s) subagente(s), marque essas tasks como feitas no seu controle. Somente então inicie a execução da próxima bateria de tasks.
7. Depois de finalizar **todas** as tasks estipuladas no plano seguindo esse ciclo de subagentes, e os testes locais passarem sem erros:
   - Registre as novidades em `.claude/progress.txt` adicionando qualquer bloqueio ("gotcha"), problema contornado ou aprendizados adquiridos no desenvolver das tarefas do plano.
   - Atualize o documento de registro em `.claude/plans/INDEX.md` marcando o plano/tasks como finalizados e mantendo a visão do estado atual do projeto sempre atualizada.
8. Quando tudo estiver limpo, testado e documentado, use a skill `commit-push` (ou efetue os comandos `git add`, `git commit -m "..."`, e `git push` manualmente) para enviar o trabalho finalizado para o repositório remoto.
