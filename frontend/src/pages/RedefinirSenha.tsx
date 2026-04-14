import { useMutation } from '@tanstack/react-query'
import { Box, Button, Card, Flex, Heading, Text, TextField } from '@radix-ui/themes'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { redefinirSenha } from '../services/auth'

export function RedefinirSenha() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''

  const mutacao = useMutation({
    mutationFn: () =>
      redefinirSenha({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      }),
    onSuccess: () => {
      navigate('/login', { replace: true })
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
              <Heading size="8">Redefinir senha</Heading>
              <Text size="4" className="text-cyan-100/65">
                Defina uma nova senha para concluir seu acesso.
              </Text>
            </Box>

            {!email || !token ? (
              <Text size="2" color="ruby">
                Link invalido. Solicite um novo e-mail de redefinicao.
              </Text>
            ) : (
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
                  />
                </label>

                {mutacao.isError ? (
                  <Text size="2" color="ruby">
                    Nao foi possivel redefinir a senha. Verifique se o link ainda e valido.
                  </Text>
                ) : null}

                <Button size="3" type="submit" loading={mutacao.isPending}>
                  Redefinir senha
                </Button>
              </form>
            )}

            <Text size="2" className="text-cyan-100/55">
              <Link to="/login" className="text-cyan-300">
                Voltar para login
              </Link>
            </Text>
          </Flex>
        </Card>
      </div>
    </main>
  )
}
