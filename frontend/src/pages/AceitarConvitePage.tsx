import { useMutation } from '@tanstack/react-query'
import { Box, Button, Card, Flex, Heading, Spinner, Text, TextField } from '@radix-ui/themes'
import { CheckCircledIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { aceitarConvite } from '../services/b2b'
import type { AceitarConvitePayload, AceitarConviteResponse } from '../types/b2b'

interface FormState {
  nome: string
  password: string
  password_confirmation: string
}

function ErroValidacao({ mensagem }: { mensagem: string }) {
  return (
    <Text size="1" color="ruby">
      {mensagem}
    </Text>
  )
}

export function AceitarConvitePage() {
  const { token } = useParams<{ token: string }>()
  const [form, setForm] = useState<FormState>({
    nome: '',
    password: '',
    password_confirmation: '',
  })
  const [erroLocal, setErroLocal] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<AceitarConviteResponse | null>(null)

  const mutation = useMutation({
    mutationFn: (payload: AceitarConvitePayload) => aceitarConvite(token!, payload),
    onSuccess: (data) => {
      setSucesso(data)
    },
  })

  const erroApi = mutation.isError
    ? obterMensagemErroApi(mutation.error)
    : null

  function obterMensagemErroApi(error: unknown): string {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { status?: number; data?: { message?: string } } }).response
      if (response?.status === 404 || response?.status === 410) {
        return 'Este convite não é mais válido.'
      }
      if (response?.data?.message) {
        return response.data.message
      }
    }
    return 'Ocorreu um erro ao criar sua conta. Tente novamente.'
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErroLocal(null)

    if (form.password !== form.password_confirmation) {
      setErroLocal('As senhas não coincidem.')
      return
    }

    if (form.password.length < 8) {
      setErroLocal('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    mutation.mutate({
      nome: form.nome,
      password: form.password,
      password_confirmation: form.password_confirmation,
    })
  }

  if (sucesso) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a0b] px-6">
        <Card size="4" className="w-full max-w-md border border-cyan-400/10 bg-slate-950/80 backdrop-blur">
          <Flex direction="column" gap="4" align="center" py="4">
            <CheckCircledIcon className="h-12 w-12 text-green-400" width={48} height={48} />
            <Box className="space-y-2 text-center">
              <Heading size="6" className="text-cyan-50">
                Conta criada com sucesso!
              </Heading>
              <Text size="3" className="text-cyan-100/70">
                {sucesso.message ?? 'Sua conta foi criada. Acesse o sistema pelo link abaixo.'}
              </Text>
            </Box>
            {sucesso.subdominio && (
              <a
                href={`https://${sucesso.subdominio}.geopolitica.app`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20"
              >
                Acessar {sucesso.subdominio}.geopolitica.app
              </a>
            )}
          </Flex>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0b] px-6">
      <Card size="4" className="w-full max-w-md border border-cyan-400/10 bg-slate-950/80 backdrop-blur">
        <Flex direction="column" gap="5">
          <Box className="space-y-2">
            <Text size="2" className="uppercase tracking-[0.3em] text-cyan-300/70">
              Convite corporativo
            </Text>
            <Heading size="7" className="text-cyan-50">
              Criar sua conta
            </Heading>
            <Text size="3" className="text-cyan-100/65">
              Preencha os dados abaixo para ativar seu acesso.
            </Text>
          </Box>

          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="3">
              <label className="space-y-1">
                <Text size="2" weight="medium">
                  Nome completo
                </Text>
                <TextField.Root
                  size="3"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Seu nome completo"
                  required
                  autoComplete="name"
                />
              </label>

              <label className="space-y-1">
                <Text size="2" weight="medium">
                  Senha
                </Text>
                <TextField.Root
                  size="3"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  required
                  autoComplete="new-password"
                />
              </label>

              <label className="space-y-1">
                <Text size="2" weight="medium">
                  Confirmar senha
                </Text>
                <TextField.Root
                  size="3"
                  type="password"
                  value={form.password_confirmation}
                  onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))}
                  placeholder="Repita a senha"
                  required
                  autoComplete="new-password"
                />
              </label>

              {erroLocal && <ErroValidacao mensagem={erroLocal} />}

              {erroApi && (
                <Flex gap="2" align="center" className="rounded-md bg-red-500/10 px-3 py-2">
                  <ExclamationTriangleIcon className="text-ruby-400 shrink-0" />
                  <Text size="2" color="ruby">
                    {erroApi}
                  </Text>
                </Flex>
              )}

              <Button type="submit" size="3" disabled={mutation.isPending} className="mt-1 w-full">
                {mutation.isPending && <Spinner size="1" />}
                Criar conta
              </Button>
            </Flex>
          </form>
        </Flex>
      </Card>
    </main>
  )
}
