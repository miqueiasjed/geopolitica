import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Select,
  Separator,
  Spinner,
  Switch,
  Text,
  TextArea,
  TextField,
} from '@radix-ui/themes'
import { ChevronLeftIcon } from '@radix-ui/react-icons'
import { AdminEditor } from '../../components/biblioteca/AdminEditor'
import { criarConteudo } from '../../services/admin'
import type { TipoConteudo, PlanoMinimo, VerticalConteudo } from '../../types/biblioteca'

interface FormErros {
  titulo?: string
  tese_manchete?: string
  corpo?: string
}

export function AdminNovoConteudo() {
  const navigate = useNavigate()

  const [tipo, setTipo] = useState<TipoConteudo>('briefing')
  const [titulo, setTitulo] = useState('')
  const [teseManchete, setTeseManchete] = useState('')
  const [regiao, setRegiao] = useState('')
  const [tags, setTags] = useState('')
  const [resumo, setResumo] = useState('')
  const [planoMinimo, setPlanoMinimo] = useState<PlanoMinimo>('essencial')
  const [verticalConteudo, setVerticalConteudo] = useState<VerticalConteudo | ''>('')
  const [corpo, setCorpo] = useState('')
  const [publicado, setPublicado] = useState(false)
  const [erros, setErros] = useState<FormErros>({})

  const mutation = useMutation({
    mutationFn: criarConteudo,
    onSuccess: () => {
      navigate('/admin/biblioteca')
    },
  })

  function validar(): boolean {
    const novosErros: FormErros = {}

    if (!titulo.trim()) {
      novosErros.titulo = 'O título é obrigatório.'
    }

    if (tipo === 'tese' && !teseManchete.trim()) {
      novosErros.tese_manchete = 'A manchete da tese é obrigatória.'
    }

    if (!corpo || corpo === '<p></p>') {
      novosErros.corpo = 'O conteúdo do corpo é obrigatório.'
    }

    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  function handleSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (!validar()) return

    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    mutation.mutate({
      tipo,
      titulo: titulo.trim(),
      ...(tipo === 'tese' ? { tese_manchete: teseManchete.trim() } : {}),
      regiao: regiao.trim() || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      resumo: resumo.trim() || undefined,
      plano_minimo: planoMinimo,
      vertical_conteudo: verticalConteudo || null,
      corpo,
      publicado,
    })
  }

  return (
    <main className="min-h-screen bg-[#0a0a0b] px-6 py-10 text-cyan-50">
      <div className="mx-auto max-w-4xl space-y-6">
        <Flex justify="between" align="end" wrap="wrap" gap="4">
          <Box className="space-y-2">
            <Text size="2" className="uppercase tracking-[0.3em] text-cyan-300/70">
              Painel admin
            </Text>
            <Heading size="8">Novo conteúdo</Heading>
            <Text size="3" className="max-w-2xl text-cyan-100/65">
              Crie um novo briefing, mapa ou tese para a biblioteca.
            </Text>
          </Box>

          <Button
            size="2"
            variant="soft"
            color="gray"
            onClick={() => navigate('/admin/biblioteca')}
          >
            <ChevronLeftIcon />
            Voltar
          </Button>
        </Flex>

        <Card size="4" className="border border-cyan-400/10 bg-slate-950/80 backdrop-blur">
          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="5">
              {/* Tipo */}
              <label className="space-y-2">
                <Text size="2" weight="medium">
                  Tipo de conteúdo
                </Text>
                <Select.Root
                  value={tipo}
                  onValueChange={(valor) => setTipo(valor as TipoConteudo)}
                >
                  <Select.Trigger className="w-full" />
                  <Select.Content>
                    <Select.Item value="briefing">Briefing</Select.Item>
                    <Select.Item value="mapa">Mapa</Select.Item>
                    <Select.Item value="tese">A Tese</Select.Item>
                  </Select.Content>
                </Select.Root>
              </label>

              {/* Título */}
              <label className="space-y-2">
                <Text size="2" weight="medium">
                  Título <span className="text-ruby-400">*</span>
                </Text>
                <TextField.Root
                  size="3"
                  value={titulo}
                  onChange={(e) => {
                    setTitulo(e.target.value)
                    if (erros.titulo) setErros((prev) => ({ ...prev, titulo: undefined }))
                  }}
                  placeholder="Título do conteúdo"
                  color={erros.titulo ? 'ruby' : undefined}
                />
                {erros.titulo && (
                  <Text size="1" color="ruby">
                    {erros.titulo}
                  </Text>
                )}
              </label>

              {/* Manchete da tese — apenas quando tipo = tese */}
              {tipo === 'tese' && (
                <label className="space-y-2">
                  <Text size="2" weight="medium">
                    Manchete da tese <span className="text-ruby-400">*</span>
                  </Text>
                  <TextField.Root
                    size="3"
                    value={teseManchete}
                    onChange={(e) => {
                      setTeseManchete(e.target.value)
                      if (erros.tese_manchete)
                        setErros((prev) => ({ ...prev, tese_manchete: undefined }))
                    }}
                    placeholder="Manchete de destaque para a tese"
                    color={erros.tese_manchete ? 'ruby' : undefined}
                  />
                  {erros.tese_manchete && (
                    <Text size="1" color="ruby">
                      {erros.tese_manchete}
                    </Text>
                  )}
                </label>
              )}

              <Flex gap="4" wrap="wrap">
                {/* Região */}
                <label className="min-w-[200px] flex-1 space-y-2">
                  <Text size="2" weight="medium">
                    Região
                  </Text>
                  <TextField.Root
                    size="3"
                    value={regiao}
                    onChange={(e) => setRegiao(e.target.value)}
                    placeholder="Ex: América Latina, Europa..."
                  />
                </label>

                {/* Tags */}
                <label className="min-w-[200px] flex-1 space-y-2">
                  <Text size="2" weight="medium">
                    Tags
                  </Text>
                  <TextField.Root
                    size="3"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="tag1, tag2, tag3"
                  />
                  <Text size="1" className="text-cyan-100/45">
                    Separadas por vírgula
                  </Text>
                </label>
              </Flex>

              {/* Resumo */}
              <label className="space-y-2">
                <Flex justify="between" align="center">
                  <Text size="2" weight="medium">
                    Resumo
                  </Text>
                  <Text size="1" className={resumo.length > 500 ? 'text-ruby-400' : 'text-cyan-100/45'}>
                    {resumo.length}/500
                  </Text>
                </Flex>
                <TextArea
                  size="3"
                  value={resumo}
                  onChange={(e) => setResumo(e.target.value.slice(0, 500))}
                  placeholder="Breve resumo do conteúdo (máx. 500 caracteres)"
                  rows={3}
                />
              </label>

              {/* Plano mínimo */}
              <label className="space-y-2">
                <Text size="2" weight="medium">
                  Plano mínimo para acesso
                </Text>
                <Select.Root
                  value={planoMinimo}
                  onValueChange={(valor) => setPlanoMinimo(valor as PlanoMinimo)}
                >
                  <Select.Trigger className="w-full" />
                  <Select.Content>
                    <Select.Item value="essencial">Essencial</Select.Item>
                    <Select.Item value="pro">Pro</Select.Item>
                    <Select.Item value="reservado">Reservado</Select.Item>
                  </Select.Content>
                </Select.Root>
              </label>

              {/* Vertical de conteúdo */}
              <label className="space-y-2">
                <Text size="2" weight="medium">
                  Vertical de conteúdo
                </Text>
                <Select.Root
                  value={verticalConteudo}
                  onValueChange={(valor) => setVerticalConteudo(valor as VerticalConteudo | '')}
                >
                  <Select.Trigger className="w-full" />
                  <Select.Content>
                    <Select.Item value="">GPI Core (sem vertical)</Select.Item>
                    <Select.Item value="elections">Monitor Eleitoral</Select.Item>
                    <Select.Item value="war">Monitor de Guerra</Select.Item>
                  </Select.Content>
                </Select.Root>
              </label>

              <Separator size="4" />

              {/* Corpo */}
              <Box className="space-y-2">
                <Text size="2" weight="medium">
                  Corpo do conteúdo <span className="text-ruby-400">*</span>
                </Text>
                <AdminEditor
                  value={corpo}
                  onChange={(html) => {
                    setCorpo(html)
                    if (erros.corpo) setErros((prev) => ({ ...prev, corpo: undefined }))
                  }}
                  placeholder="Digite o conteúdo completo aqui..."
                />
                {erros.corpo && (
                  <Text size="1" color="ruby">
                    {erros.corpo}
                  </Text>
                )}
              </Box>

              <Separator size="4" />

              {/* Publicar agora */}
              <Flex align="center" justify="between" gap="4">
                <Box className="space-y-1">
                  <Text size="2" weight="medium">
                    Publicar agora
                  </Text>
                  <Text size="1" className="text-cyan-100/50">
                    Quando ativado, o conteúdo ficará visível imediatamente.
                  </Text>
                </Box>
                <Switch
                  size="3"
                  checked={publicado}
                  onCheckedChange={setPublicado}
                  color="cyan"
                  aria-label="Publicar agora"
                />
              </Flex>

              {/* Erro da mutation */}
              {mutation.isError && (
                <Text size="2" color="ruby">
                  Erro ao salvar o conteúdo. Verifique os dados e tente novamente.
                </Text>
              )}

              <Flex justify="end" gap="3">
                <Button
                  type="button"
                  size="3"
                  variant="soft"
                  color="gray"
                  onClick={() => navigate('/admin/biblioteca')}
                  disabled={mutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="3"
                  color="cyan"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending && <Spinner size="1" />}
                  {mutation.isPending ? 'Salvando...' : 'Salvar conteúdo'}
                </Button>
              </Flex>
            </Flex>
          </form>
        </Card>
      </div>
    </main>
  )
}
