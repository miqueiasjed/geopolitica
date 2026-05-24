import { usePlanosAtivos } from '../../hooks/usePlanosAtivos'
import type { TipoConteudo } from '../../types/biblioteca'

interface PlanGateProps {
  tipo?: TipoConteudo
}

const INFO_TIPO: Record<
  TipoConteudo,
  { titulo: string; subtitulo: string; planoMinimo: string; cor: string }
> = {
  briefing: {
    titulo: 'Briefing exclusivo',
    subtitulo:
      'Este briefing está disponível a partir do plano Essencial. Assine e tenha acesso a análises semanais de conjuntura geopolítica.',
    planoMinimo: 'essencial',
    cor: 'text-amber-300',
  },
  mapa: {
    titulo: 'Mapa estratégico',
    subtitulo:
      'Este mapa estratégico está disponível a partir do plano Pro. Visualize fluxos de poder e risco geopolítico em tempo real.',
    planoMinimo: 'pro',
    cor: 'text-cyan-300',
  },
  tese: {
    titulo: 'Tese de investimento',
    subtitulo:
      'Esta tese de investimento está disponível exclusivamente no plano Reservado, para membros com acesso total à plataforma.',
    planoMinimo: 'reservado',
    cor: 'text-purple-300',
  },
}

const subtituloPadrao = 'Este conteúdo está disponível em um plano superior.'

const COR_PLANO: Record<string, string> = {
  essencial:
    'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 shadow-amber-500/10',
  pro: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 shadow-cyan-500/10',
  reservado:
    'border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 shadow-purple-500/10',
}

const COR_PADRAO =
  'border-[#BFFF3C]/30 bg-[#BFFF3C]/10 text-[#BFFF3C] hover:bg-[#BFFF3C]/20 shadow-[#BFFF3C]/10'

const COR_GLOW: Record<string, string> = {
  essencial: 'via-amber-500/20',
  pro: 'via-cyan-500/20',
  reservado: 'via-purple-500/20',
}

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-zinc-300"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export function PlanGate({ tipo }: PlanGateProps) {
  const { data: planos } = usePlanosAtivos()

  const info = tipo ? INFO_TIPO[tipo] : null
  const subtitulo = info?.subtitulo ?? subtituloPadrao
  const cor = info ? COR_GLOW[info.planoMinimo] : 'via-zinc-500/20'

  // Exibe planos a partir do mínimo necessário, preservando ordem dos dados
  const ordemPlanos = ['essencial', 'pro', 'reservado']
  const indiceMinimo = info ? ordemPlanos.indexOf(info.planoMinimo) : 0
  const planosExibidos =
    planos?.filter(
      (p) => p.lastlink_url && ordemPlanos.indexOf(p.slug) >= indiceMinimo,
    ) ?? []

  // Fallback: todos com link
  const planosComLink =
    planosExibidos.length > 0
      ? planosExibidos
      : (planos?.filter((p) => p.lastlink_url) ?? [])

  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 px-8 py-14 text-center">
      {/* Linha de destaque no topo */}
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${cor} to-transparent`}
      />
      {/* Glow de fundo */}
      <div className="absolute -top-12 left-1/2 h-28 w-48 -translate-x-1/2 rounded-full bg-zinc-700/20 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Ícone */}
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800/80 shadow-lg">
          <LockIcon />
        </div>

        {/* Tipo de conteúdo */}
        {tipo && info && (
          <span
            className={`mb-2 font-mono text-[10px] uppercase tracking-[0.32em] ${info.cor}`}
          >
            {tipo}
          </span>
        )}

        <h3 className="mb-3 text-xl font-bold text-white">
          {info?.titulo ?? 'Conteúdo exclusivo'}
        </h3>

        <p className="mb-8 max-w-sm text-sm leading-6 text-zinc-400">{subtitulo}</p>

        {/* Botões de planos */}
        {planosComLink.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-3">
            {planosComLink.map((p) => (
              <a
                key={p.slug}
                href={p.lastlink_url!}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold shadow-lg transition-all hover:-translate-y-0.5 ${COR_PLANO[p.slug] ?? COR_PADRAO}`}
              >
                Assinar {p.nome}
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            ))}
          </div>
        ) : (
          <a
            href="mailto:contato@geopoliticaparainvestidores.com.br"
            className="inline-flex items-center gap-2 rounded-xl bg-[#BFFF3C] px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-[#D7FF69]"
          >
            Falar com o time
          </a>
        )}
      </div>
    </div>
  )
}
