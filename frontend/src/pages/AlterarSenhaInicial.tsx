import { useMutation } from '@tanstack/react-query'
import { ArrowRightIcon, GlobeIcon, LockClosedIcon } from '@radix-ui/react-icons'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { alterarSenhaInicial } from '../services/auth'
import { useAuth } from '../hooks/useAuth'

export function AlterarSenhaInicial() {
  const navigate = useNavigate()
  const { checkAuth } = useAuth()
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const mutacao = useMutation({
    mutationFn: () => alterarSenhaInicial({ password, password_confirmation: passwordConfirmation }),
    onSuccess: async () => {
      await checkAuth()
      navigate('/', { replace: true })
    },
  })

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050606] text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,6,0.98)_0%,rgba(5,6,6,0.88)_35%,rgba(5,6,6,0.48)_63%,rgba(5,6,6,0.88)_100%),radial-gradient(circle_at_72%_18%,rgba(191,255,60,0.18),transparent_28%),radial-gradient(circle_at_28%_72%,rgba(191,255,60,0.10),transparent_32%),linear-gradient(180deg,#071018_0%,#050606_82%)]" />
        <div className="absolute inset-0 opacity-[0.10] bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:32px_32px]" />
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

          <span className="inline-flex h-9 items-center gap-2 rounded-md border border-[#BFFF3C]/20 bg-[#BFFF3C]/8 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#D7FF69]">
            <LockClosedIcon className="h-3 w-3" />
            Primeiro acesso
          </span>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-73px)] max-w-[1500px] items-center justify-center px-5 py-10 sm:px-8">
        <form
          className="w-full max-w-[420px] rounded-md border border-[#BFFF3C]/15 bg-[#0d0e0e]/88 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6"
          onSubmit={(evento) => {
            evento.preventDefault()
            mutacao.reset()
            mutacao.mutate()
          }}
        >
          <div className="mb-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#BFFF3C]/75">
              Configuração de acesso
            </p>
            <h1 className="mt-2 text-2xl font-black text-white">Crie sua senha</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Para continuar, defina uma senha pessoal para a sua conta.
            </p>
          </div>

          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Nova senha
            </span>
            <input
              className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-[#BFFF3C]/45 focus:ring-2 focus:ring-[#BFFF3C]/10"
              type="password"
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
            />
          </label>

          <label className="mt-4 block">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Confirmar senha
            </span>
            <input
              className="mt-2 h-12 w-full rounded-md border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-[#BFFF3C]/45 focus:ring-2 focus:ring-[#BFFF3C]/10"
              type="password"
              value={passwordConfirmation}
              onChange={(evento) => setPasswordConfirmation(evento.target.value)}
              placeholder="Repita a senha"
              required
              minLength={8}
            />
          </label>

          {mutacao.isError ? (
            <p className="mt-4 rounded-md border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
              Não foi possível definir a senha. Verifique se as senhas coincidem e tente novamente.
            </p>
          ) : null}

          <button
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#BFFF3C] font-black text-zinc-950 transition-colors hover:bg-[#D7FF69] disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={mutacao.isPending}
          >
            {mutacao.isPending ? 'Salvando...' : 'Definir senha e entrar'}
            {!mutacao.isPending && <ArrowRightIcon className="h-5 w-5" />}
          </button>
        </form>
      </section>
    </main>
  )
}
