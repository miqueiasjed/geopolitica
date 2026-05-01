import { useMutation } from '@tanstack/react-query'
import { Box, Button, Card, Flex, Heading, Text, TextField } from '@radix-ui/themes'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    <main className="min-h-screen bg-[#0a0a0b] px-6 py-10 text-cyan-50">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <Card size="5" className="w-full max-w-xl border border-cyan-400/10 bg-slate-950/80 backdrop-blur">
          <Flex direction="column" gap="5">
            <Box className="space-y-3">
              <Text size="2" className="uppercase tracking-[0.3em] text-cyan-300/70">
                Primeiro acesso
              </Text>
              <Heading size="8">Crie sua senha</Heading>
              <Text size="4" className="text-cyan-100/65">
                Para continuar, defina uma senha pessoal para a sua conta.
              </Text>
            </Box>

            <form
              className="space-y-4"
              onSubmit={(evento) => {
                evento.preventDefault()
                mutacao.reset()
                mutacao.mutate()
              }}
            >
              <label className="block space-y-2">
                <Text size="2" weight="medium">
                  Nova senha
                </Text>
                <TextField.Root
                  size="3"
                  type="password"
                  value={password}
                  onChange={(evento) => setPassword(evento.target.value)}
                  required
                  minLength={8}
                />
              </label>

              <label className="block space-y-2">
                <Text size="2" weight="medium">
                  Confirmar senha
                </Text>
                <TextField.Root
                  size="3"
                  type="password"
                  value={passwordConfirmation}
                  onChange={(evento) => setPasswordConfirmation(evento.target.value)}
                  required
                  minLength={8}
                />
              </label>

              {mutacao.isError ? (
                <Text size="2" color="ruby">
                  Nao foi possivel alterar a senha. Verifique se as senhas coincidem e tente novamente.
                </Text>
              ) : null}

              <Button size="3" type="submit" loading={mutacao.isPending}>
                Definir senha e entrar
              </Button>
            </form>
          </Flex>
        </Card>
      </div>
    </main>
  )
}
