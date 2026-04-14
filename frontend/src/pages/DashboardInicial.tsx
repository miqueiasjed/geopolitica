import { Badge, Button, Card, Flex, Heading, Section, Text } from '@radix-ui/themes'

export function DashboardInicial() {
  return (
    <main className="min-h-screen bg-[#0a0a0b] px-6 py-10 text-cyan-50">
      <Section size="4" className="mx-auto max-w-6xl">
        <Flex direction="column" gap="6">
          <Badge size="3" color="cyan" variant="soft" className="w-fit">
            Infraestrutura inicial pronta
          </Badge>

          <div className="space-y-4">
            <Heading size="9" className="max-w-4xl text-balance">
              Geopolítica para Investidores
            </Heading>
            <Text size="5" className="max-w-3xl text-cyan-100/70">
              Base React 19 + Vite + TypeScript preparada com React Query,
              Radix UI, TailwindCSS 4 e proxy de API para o backend Laravel.
            </Text>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              'Rotas preparadas para autenticacao e modulos.',
              'Cliente Axios centralizado com Bearer token em localStorage.',
              'Tema visual inicial alinhado ao fundo #0a0a0b do produto.',
            ].map((texto) => (
              <Card key={texto} size="3" className="border border-cyan-400/10 bg-cyan-400/5 backdrop-blur">
                <Text size="3">{texto}</Text>
              </Card>
            ))}
          </div>

          <Flex gap="3" wrap="wrap">
            <Button size="3" color="cyan">
              Iniciar modulo
            </Button>
            <Button size="3" variant="soft" color="gray">
              Validar API
            </Button>
          </Flex>
        </Flex>
      </Section>
    </main>
  )
}
