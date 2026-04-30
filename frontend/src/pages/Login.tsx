import { ArrowRightIcon, CheckIcon, EnterIcon, GlobeIcon, StarFilledIcon } from '@radix-ui/react-icons'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Login() {
  const navigate = useNavigate()
  const prefersReduced = useReducedMotion()
  const { isAuthenticated, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050606] text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,6,0.98)_0%,rgba(5,6,6,0.88)_35%,rgba(5,6,6,0.48)_63%,rgba(5,6,6,0.88)_100%),radial-gradient(circle_at_72%_18%,rgba(255,91,32,0.34),transparent_24%),radial-gradient(circle_at_54%_38%,rgba(191,255,60,0.16),transparent_28%),linear-gradient(180deg,#071018_0%,#050606_82%)]" />
        <div className="absolute inset-0 opacity-[0.16] bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute inset-y-0 right-0 w-[64vw] min-w-[720px] opacity-70">
          <div className="absolute right-[2%] top-[4%] h-[48rem] w-[48rem] rounded-full border border-white/10 bg-[radial-gradient(circle_at_44%_36%,rgba(255,255,255,0.12),transparent_9%),radial-gradient(circle_at_67%_31%,rgba(191,255,60,0.12),transparent_10%),radial-gradient(circle_at_52%_58%,rgba(255,91,32,0.14),transparent_14%),linear-gradient(145deg,rgba(22,25,27,0.88),rgba(6,8,10,0.92))] shadow-[0_0_100px_rgba(0,0,0,0.75)] blur-[0.2px]" />
          <div className="absolute right-[7%] top-[10%] h-[42rem] w-[42rem] rounded-full border border-[#BFFF3C]/10" />
          <div className="absolute right-[12%] top-[16%] h-[36rem] w-[36rem] rounded-full border border-white/8" />
          <div className="absolute right-[18%] top-[22%] h-[30rem] w-[30rem] rounded-full border border-white/7" />
          <div className="absolute right-[27%] top-[18%] h-[28rem] w-[18rem] rotate-[-12deg] rounded-[48%] bg-[#11161a]/85 shadow-[inset_0_0_42px_rgba(255,255,255,0.05)]" />
          <div className="absolute right-[9%] top-[18%] h-[30rem] w-[16rem] rotate-[10deg] rounded-[48%] bg-[#17100d]/85 shadow-[inset_0_0_54px_rgba(255,91,32,0.12)]" />
          <div className="absolute right-[34%] top-[31%] h-32 w-20 rotate-[-28deg] rounded-[45%] bg-[#23313a]/90" />
          <div className="absolute right-[20%] top-[39%] h-24 w-20 rotate-[23deg] rounded-[44%] bg-[#20272c]/90" />
          <div className="absolute right-[46%] top-[50%] h-px w-72 rotate-[-18deg] bg-[#BFFF3C]/20" />
          <div className="absolute right-[18%] top-[48%] h-px w-96 rotate-[22deg] bg-white/10" />
          <div className="absolute bottom-0 right-0 h-48 w-full bg-gradient-to-t from-[#050606] to-transparent" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_26%_38%,transparent_0%,rgba(5,6,6,0.34)_46%,rgba(5,6,6,0.92)_100%)]" />
      </div>

      <header className="relative z-10 border-b border-[#BFFF3C]/10 bg-[#070808]/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/login" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#BFFF3C]/30 bg-[#BFFF3C]/10 text-[#D7FF69]">
              <GlobeIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-black sm:text-lg">
                Geopolítica <span className="text-[#D7FF69]">para Investidores</span>
              </span>
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 sm:block">
                inteligência geopolítica aplicada
              </span>
            </span>
          </Link>

          <a
            href="#acesso"
            className="inline-flex h-11 items-center gap-2 rounded-md border border-[#BFFF3C]/25 bg-[#BFFF3C]/10 px-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#D7FF69] transition-colors hover:bg-[#BFFF3C]/18"
          >
            <EnterIcon />
            Entrar
          </a>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-73px)] max-w-[1500px] items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_430px] lg:py-16">
        <motion.div
          className="max-w-5xl"
          initial={prefersReduced ? false : { opacity: 0, y: 14 }}
          animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.4, ease: 'easeOut' }}
        >
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#BFFF3C]/30 bg-[#BFFF3C]/8 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#D7FF69]">
            <StarFilledIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Plataforma de inteligência geopolítica aplicada</span>
          </div>

          <h1 className="mt-7 max-w-5xl text-[clamp(3.2rem,8vw,8.7rem)] font-black leading-[0.92] tracking-normal text-white">
            O mundo não para.
            <span className="block text-[#BFFF3C]">E você não pode</span>
            <span className="block">ficar para trás.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg font-semibold leading-8 text-zinc-300 sm:text-xl">
            Enquanto a maioria lê manchetes, uma minoria entende o que está por trás delas e age
            antes que o resto perceba. <span className="text-white">Geopolítica para Investidores</span>{' '}
            existe para quem quer estar nessa minoria.
          </p>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm font-bold text-zinc-400">
            {['Briefing diário', 'Alertas por IA', 'Cenários de risco'].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-[#BFFF3C]" />
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.form
          id="acesso"
          className="rounded-md border border-[#BFFF3C]/15 bg-[#0d0e0e]/88 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6"
          initial={prefersReduced ? false : { opacity: 0, x: 16 }}
          animate={prefersReduced ? undefined : { opacity: 1, x: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.4, ease: 'easeOut', delay: 0.08 }}
          onSubmit={async (evento) => {
            evento.preventDefault()
            setErro(null)
            setIsSubmitting(true)

            try {
              await login(email, password)
              navigate('/', { replace: true })
            } catch {
              setErro('Credenciais inválidas. Revise o e-mail e a senha.')
            } finally {
              setIsSubmitting(false)
            }
          }}
        >
          <div className="mb-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#BFFF3C]/75">
              Acesso privado
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">Entrar na plataforma</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Use o e-mail de assinante. Não existe cadastro público nesta área.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              E-mail
            </span>
            <input
              className="h-12 w-full rounded-md border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-[#BFFF3C]/45 focus:ring-2 focus:ring-[#BFFF3C]/10"
              type="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              placeholder="seu@email.com"
              required
            />
          </label>

          <label className="mt-4 block space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Senha
            </span>
            <input
              className="h-12 w-full rounded-md border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-[#BFFF3C]/45 focus:ring-2 focus:ring-[#BFFF3C]/10"
              type="password"
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              placeholder="Digite sua senha"
              required
            />
          </label>

          {erro ? (
            <p className="mt-4 rounded-md border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
              {erro}
            </p>
          ) : null}

          <button
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#BFFF3C] font-black text-zinc-950 transition-colors hover:bg-[#D7FF69] disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Validando acesso...' : 'Entrar'}
            <ArrowRightIcon className="h-5 w-5" />
          </button>

          <Link
            to="/esqueci-senha"
            className="mt-4 inline-flex text-sm font-semibold text-zinc-400 transition-colors hover:text-[#D7FF69]"
          >
            Esqueci minha senha
          </Link>
        </motion.form>
      </section>
    </main>
  )
}
