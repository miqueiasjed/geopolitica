import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Box, Button, Card, Flex, Heading, Separator, Text, TextField } from '@radix-ui/themes'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { perfilKeys, atualizarPerfil, buscarPerfil } from '../services/perfil'

export function Perfil() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { logout, user: usuarioContexto } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const perfilQuery = useQuery({
    queryKey: perfilKeys.me,
    queryFn: buscarPerfil,
  })

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!perfilQuery.data) {
      return
    }

    setName(perfilQuery.data.name)
    setEmail(perfilQuery.data.email)
  }, [perfilQuery.data])
  /* eslint-enable react-hooks/set-state-in-effect */

  const atualizacao = useMutation({
    mutationFn: atualizarPerfil,
    onSuccess: async (usuarioAtualizado) => {
      setMensagem('Perfil atualizado com sucesso.')
      setErro(null)
      setPassword('')
      setPasswordConfirmation('')
      await queryClient.invalidateQueries({ queryKey: perfilKeys.me })
      queryClient.setQueryData(perfilKeys.me, usuarioAtualizado)
    },
    onError: () => {
      setMensagem(null)
      setErro('Nao foi possivel atualizar o perfil. Revise os dados e tente novamente.')
    },
  })

  const usuario = perfilQuery.data ?? usuarioContexto

  return (
    <main className="min-h-screen bg-[#0a0a0b] px-6 py-10 text-cyan-50">
      <div className="mx-auto max-w-5xl space-y-6">
        <Flex justify="between" align="center" wrap="wrap" gap="4">
          <Box className="space-y-2">
            <Text size="2" className="uppercase tracking-[0.3em] text-cyan-300/70">
              Area autenticada
            </Text>
            <Heading size="8">Perfil</Heading>
          </Box>

          <Flex gap="3" wrap="wrap">
            {usuario?.role ? (
              <Badge size="3" color="cyan" variant="soft">
                Role: {usuario.role}
              </Badge>
            ) : null}
            {usuario?.assinante?.plano ? (
              <Badge size="3" color={usuario.assinante.ativo ? 'green' : 'amber'} variant="soft">
                Plano: {usuario.assinante.plano}
              </Badge>
            ) : null}
            <Button
              size="3"
              variant="soft"
              color="gray"
              onClick={async () => {
                await logout()
                navigate('/login', { replace: true })
              }}
            >
              Sair
            </Button>
          </Flex>
        </Flex>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card size="5" className="border border-cyan-400/10 bg-slate-950/80 backdrop-blur">
            <form
              className="space-y-5"
              onSubmit={(evento) => {
                evento.preventDefault()
                setMensagem(null)
                setErro(null)

                atualizacao.mutate({
                  name,
                  email,
                  ...(password ? { password, password_confirmation: passwordConfirmation } : {}),
                })
              }}
            >
              <Heading size="6">Dados da conta</Heading>

              <label className="block space-y-2">
                <Text size="2" weight="medium">
                  Nome
                </Text>
                <TextField.Root size="3" value={name} onChange={(evento) => setName(evento.target.value)} required />
              </label>

              <label className="block space-y-2">
                <Text size="2" weight="medium">
                  E-mail
                </Text>
                <TextField.Root
                  size="3"
                  type="email"
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                  required
                />
              </label>

              <Separator size="4" />

              <label className="block space-y-2">
                <Text size="2" weight="medium">
                  Nova senha
                </Text>
                <TextField.Root
                  size="3"
                  type="password"
                  value={password}
                  onChange={(evento) => setPassword(evento.target.value)}
                  placeholder="Deixe em branco para manter"
                />
              </label>

              <label className="block space-y-2">
                <Text size="2" weight="medium">
                  Confirmar nova senha
                </Text>
                <TextField.Root
                  size="3"
                  type="password"
                  value={passwordConfirmation}
                  onChange={(evento) => setPasswordConfirmation(evento.target.value)}
                />
              </label>

              {mensagem ? (
                <Text size="2" color="green">
                  {mensagem}
                </Text>
              ) : null}

              {erro ? (
                <Text size="2" color="ruby">
                  {erro}
                </Text>
              ) : null}

              <Button size="3" type="submit" loading={atualizacao.isPending || perfilQuery.isLoading}>
                Salvar alteracoes
              </Button>
            </form>
          </Card>

          <Card size="4" className="border border-cyan-400/10 bg-cyan-400/5">
            <Flex direction="column" gap="4">
              <Heading size="5">Status de acesso</Heading>
              <Text size="3" className="text-cyan-100/65">
                Use esta area para manter seus dados atualizados e conferir o plano vinculado a sua assinatura.
              </Text>

              <div className="space-y-3">
                <Box>
                  <Text size="2" className="text-cyan-100/50">
                    Assinatura
                  </Text>
                  <Text size="3">{usuario?.assinante?.status ?? 'Sem assinatura vinculada'}</Text>
                </Box>

                <Box>
                  <Text size="2" className="text-cyan-100/50">
                    Acesso
                  </Text>
                  <Text size="3">{usuario?.assinante?.ativo ? 'Ativo' : 'Restrito'}</Text>
                </Box>
              </div>
            </Flex>
          </Card>
        </div>
      </div>
    </main>
  )
}
