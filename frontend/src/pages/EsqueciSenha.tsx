import { useMutation } from '@tanstack/react-query'
import { Box, Button, Card, Flex, Heading, Text, TextField } from '@radix-ui/themes'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { solicitarResetSenha } from '../services/auth'

export function EsqueciSenha() {
  const [email, setEmail] = useState('')

  const mutacao = useMutation({
    mutationFn: () => solicitarResetSenha({ email }),
  })

  return (
    <main className="min-h-screen bg-[#0a0a0b] px-6 py-10 text-cyan-50">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <Card size="5" className="w-full max-w-xl border border-cyan-400/10 bg-slate-950/80 backdrop-blur">
          <Flex direction="column" gap="5">
            <Box className="space-y-3">
              <Text size="2" className="uppercase tracking-[0.3em] text-cyan-300/70">
                Recuperacao de acesso
              </Text>
              <Heading size="8">Esqueci minha senha</Heading>
              <Text size="4" className="text-cyan-100/65">
                Informe o e-mail da sua conta para receber o link de redefinicao.
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
                  E-mail
                </Text>
                <TextField.Root
                  size="3"
                  type="email"
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                  placeholder="voce@empresa.com"
                  required
                />
              </label>

              {mutacao.isError ? (
                <Text size="2" color="ruby">
                  Nao foi possivel enviar o link. Confira o e-mail informado.
                </Text>
              ) : null}

              {mutacao.isSuccess ? (
                <Text size="2" color="green">
                  Se o e-mail existir, o link de redefinicao foi enviado.
                </Text>
              ) : null}

              <Button size="3" type="submit" loading={mutacao.isPending}>
                Enviar link
              </Button>
            </form>

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
