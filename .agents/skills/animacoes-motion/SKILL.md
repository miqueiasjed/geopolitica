---
name: animacoes-motion
description: Padrões de animação com Framer Motion para o projeto Geopolitica para Investidores. Cobre durações, easing, variantes, layout animations, e acessibilidade (prefers-reduced-motion).
---

# Skill: Animações e Motion Design — Geopolitica para Investidores

Stack de animação: **Framer Motion** (projeto usa React 19 + Vite).

---

## Regra de Ouro

> **Toda animação deve ter uma função.** Se remover a animação e a UI continuar compreensível, questione se ela deve existir. Animação para impressionar ≠ animação para comunicar.

**Hierarquia de decisão antes de animar:**
1. É feedback de ação do usuário? → Animar (obrigatório)
2. É transição de estado importante? → Animar (recomendado)
3. É elemento decorativo? → Não animar
4. O usuário pediu para reduzir movimento? → Respeitar `prefers-reduced-motion` (obrigatório)

---

## 1. Escala de Duração

| Token | Duração | Uso |
|-------|---------|-----|
| instant | 0.1s | Hover states, tooltips |
| fast | 0.2s | Botões, badges, toggles |
| normal | 0.3s | Cards entrando, dropdowns, modais pequenos |
| moderate | 0.4s | Modais grandes, painéis laterais |
| slow | 0.5s | Transições de página, celebrações |
| xslow | 0.7s | Onboarding, marcos visuais |

**Regra:** nunca usar `duration > 0.7` para animações de UI.

---

## 2. Easing Functions

| Função | Quando usar |
|--------|-------------|
| `easeOut` | **Entradas** — elemento chega rápido e desacelera |
| `easeIn` | **Saídas** — elemento sai acelerando |
| `easeInOut` | **Transições de estado** — muda de uma posição para outra |
| `linear` | **Loops contínuos** — spin, pulse, progresso |
| `[0.34, 1.56, 0.64, 1]` (spring) | **Celebrações** — overshoots levemente |

---

## 3. Acessibilidade — prefers-reduced-motion (OBRIGATÓRIO)

Sempre usar o hook do Framer Motion para respeitar a preferência do sistema:

```tsx
import { useReducedMotion } from 'framer-motion';

function MeuComponente() {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.3, ease: 'easeOut' }}
    />
  );
}
```

**Regra:** nunca animar sem verificar `useReducedMotion()`.

---

## 4. Padrões com Framer Motion

### 4.1. Entrada de elemento (fade + slide up)

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -8 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  Conteúdo
</motion.div>
```

### 4.2. Variantes (para coordenar animações pai/filho)

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

<motion.ul variants={containerVariants} initial="hidden" animate="visible">
  {items.map((item) => (
    <motion.li key={item.id} variants={itemVariants}>
      {item.label}
    </motion.li>
  ))}
</motion.ul>
```

**Regra de stagger:** máximo 80ms (0.08s) entre itens.

### 4.3. Modal / Dialog (AnimatePresence obrigatório para saída)

```tsx
import { AnimatePresence, motion } from 'framer-motion';

<AnimatePresence>
  {aberto && (
    <>
      {/* Overlay */}
      <motion.div
        key="overlay"
        className="fixed inset-0 bg-black/50 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      {/* Conteúdo */}
      <motion.div
        key="modal"
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

### 4.4. Transição de página (React Router v7)

```tsx
// Em cada página, envolver o conteúdo:
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  {/* conteúdo da página */}
</motion.div>
```

### 4.5. Layout animation (reordenação de listas, expand/collapse)

```tsx
// Framer Motion detecta mudanças de layout automaticamente
<motion.div layout transition={{ duration: 0.3, ease: 'easeInOut' }}>
  Conteúdo que muda de tamanho/posição
</motion.div>
```

### 4.6. Barra de progresso

```tsx
<div className="h-2 rounded-full bg-slate-200 overflow-hidden">
  <motion.div
    className="h-full rounded-full bg-blue-600"
    initial={{ width: 0 }}
    animate={{ width: `${porcentagem}%` }}
    transition={{ duration: 0.7, ease: 'easeOut' }}
  />
</div>
```

### 4.7. Celebração / Marco (spring com overshoot)

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.5 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{
    duration: 0.5,
    ease: [0.34, 1.56, 0.64, 1], // spring
  }}
>
  🎯 Marco atingido!
</motion.div>
```

---

## 5. Padrões por componente (referência rápida)

| Componente | Padrão |
|-----------|--------|
| Modal/Dialog | `scale: 0.95→1` + `opacity: 0→1`, via `AnimatePresence` |
| Card entrando | `y: 12→0` + `opacity: 0→1`, `duration: 0.3` |
| Lista de itens | `staggerChildren: 0.08` com variantes |
| Dropdown/Menu | `y: -4→0` + `opacity: 0→1`, `duration: 0.2` |
| Alerta/Banner | `y: -8→0` + `opacity: 0→1`, `duration: 0.25` |
| Transição de página | `y: 8→0` + `opacity: 0→1`, `duration: 0.3` |
| Barra de progresso | `width: 0→N%`, `duration: 0.7`, `easeOut` |
| Celebração | `scale: 0.5→1` com spring `[0.34, 1.56, 0.64, 1]` |

---

## 6. O que NUNCA fazer

| ❌ Proibido | ✅ Correto |
|------------|-----------|
| `duration > 0.7` em elementos de UI | Máximo 0.7s |
| `animate-*` do Tailwind para interações complexas | Usar Framer Motion |
| Animar sem `useReducedMotion()` | Sempre verificar preferência |
| `AnimatePresence` sem `key` nos filhos | Sempre usar `key` única |
| Animar `width/height` diretamente | Usar `layout` prop ou `scaleX/scaleY` |
| Stagger > 80ms por item | Máximo `staggerChildren: 0.08` |

---

## 7. Performance

**Animar só:**
- `opacity` ✅ (GPU, sem layout reflow)
- `transform` (x, y, scale, rotate) ✅ (GPU, sem layout reflow)
- `layout` prop do Framer Motion ✅ (otimizado)

**Evitar animar:**
- `width`, `height` diretamente ❌ → usar `layout` prop
- `top`, `left`, `margin` ❌ → usar `x`/`y` transforms
