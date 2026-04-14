import { Button, Card, Flex, Heading, Text, TextField } from '@radix-ui/themes'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Login() {
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="min-h-screen bg-[#0a0a0b] px-6 py-10 text-cyan-50">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <Text size="2" className="uppercase tracking-[0.35em] text-cyan-300/70">
            Geopolitica para Investidores
          </Text>
          <Heading size="9" className="max-w-3xl text-balance">
            Acesso privado aos briefings e sinais geopoliticos da plataforma.
          </Heading>
          <Text size="5" className="max-w-2xl text-cyan-100/65">
            O acesso e liberado apenas para assinantes e administradores. Entre com seu e-mail e senha para continuar.
          </Text>
        </section>

        <Card size="5" className="border border-cyan-400/10 bg-slate-950/85 backdrop-blur">
          <form
            className="space-y-5"
            onSubmit={async (evento) => {
              evento.preventDefault()
              setErro(null)
              setIsSubmitting(true)

              try {
                await login(email, password)
                navigate('/', { replace: true })
              } catch {
                setErro('Credenciais invalidas. Revise o e-mail e a senha.')
              } finally {
                setIsSubmitting(false)
              }
            }}
          >
            <Flex direction="column" gap="2">
              <Heading size="7">Login</Heading>
              <Text size="3" className="text-cyan-100/60">
                Nao existe cadastro publico. Se este e seu primeiro acesso, use a redefinicao de senha enviada por e-mail.
              </Text>
            </Flex>

            <label className="block space-y-2">
              <Text size="2" weight="medium">
                E-mail
              </Text>
              <TextField.Root
                size="3"
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                placeholder="admin@geopolitica.test"
                required
              />
            </label>

            <label className="block space-y-2">
              <Text size="2" weight="medium">
                Senha
              </Text>
              <TextField.Root
                size="3"
                type="password"
                value={password}
                onChange={(evento) => setPassword(evento.target.value)}
                placeholder="Digite sua senha"
                required
              />
            </label>

            {erro ? (
              <Text size="2" color="ruby">
                {erro}
              </Text>
            ) : null}

            <Button size="3" type="submit" loading={isSubmitting}>
              Entrar
            </Button>

            <Text size="2" className="text-cyan-100/55">
              <Link to="/esqueci-senha" className="text-cyan-300">
                Esqueci minha senha
              </Link>
            </Text>
          </form>
        </Card>
      </div>
    </main>
  )
}
