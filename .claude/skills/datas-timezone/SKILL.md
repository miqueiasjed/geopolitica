---
name: datas-timezone
description: Regras e padrões para manipulação de datas e fuso horário (America/Sao_Paulo) no frontend e backend.
---
# Skill: Datas e Timezone – Geopolitica para Investidores

Você está trabalhando em uma aplicação que deve ser **100% consistente em datas e horários** entre frontend e backend.

## 1. Timezone padrão

- O timezone **oficial do sistema** é: `America/Sao_Paulo`.
- Toda formatação e manipulação de datas deve considerar esse timezone.
- Nunca confiar no timezone padrão do navegador ou do servidor sem ajustar para `America/Sao_Paulo`.

## 2. Frontend (JavaScript / TypeScript)

### 2.1. Proibições

- **NUNCA usar**:
  - `new Date().toLocaleDateString()`
  - `new Date().toLocaleString()`
  - `new Date().toLocaleTimeString()`
- Esses métodos usam o timezone local do navegador e podem gerar inconsistências com o backend.

### 2.2. Funções utilitárias obrigatórias

Sempre que precisar formatar datas no frontend, use as funções em  
`src/utils/formatDate.ts`:

- `formatarData()`  
  → formato `dd/MM/yyyy`.

- `formatarDataHora()`  
  → formato `dd/MM/yyyy HH:mm`.

- `formatarDataExtensa()`  
  → formato extenso, ex:  
  `"segunda-feira, 23 de dezembro de 2025"`.

- `formatarHora()`  
  → formato `HH:mm`.

- `formatarDataCustomizada()`  
  → formatos customizados, sempre respeitando `America/Sao_Paulo`.

### 2.3. Criando novas funções de formatação

Se precisar criar uma nova função de formatação:

- Sempre usar `date-fns-tz`.
- Converter para o timezone correto com `toZonedTime()`.
- Formatar com `format()` especificando:

```ts
format(toZonedTime(dateUtc, 'America/Sao_Paulo'), 'FORMATO', {
  timeZone: 'America/Sao_Paulo',
});
```
