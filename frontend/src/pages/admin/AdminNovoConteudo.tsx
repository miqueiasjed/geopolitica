import { useRef, useState } from 'react'
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
import { ChevronLeftIcon, UploadIcon } from '@radix-ui/react-icons'
import { AdminEditor } from '../../components/biblioteca/AdminEditor'
import { criarConteudo, enriquecerBriefing, parsearArquivoBriefing } from '../../services/admin'
import type { TipoConteudo, VerticalConteudo } from '../../types/biblioteca'

const VALOR_SEM_VERTICAL = 'core'

interface FormErros {
  titulo?: string
  tese_manchete?: string
  corpo?: string
}

export function AdminNovoConteudo() {
  const navigate = useNavigate()
  const inputDocx = useRef<HTMLInputElement>(null)

  const [tipo, setTipo] = useState<TipoConteudo>('briefing')
  const [edicao, setEdicao] = useState('')
  const [autor, setAutor] = useState('')
  const [titulo, setTitulo] = useState('')
  const [teseManchete, setTeseManchete] = useState('')
  const [regiao, setRegiao] = useState('')
  const [tags, setTags] = useState('')
  const [resumo, setResumo] = useState('')
  const PLANO_POR_TIPO: Record<TipoConteudo, string> = {
    briefing: 'Essencial',
    mapa: 'Pró',
    tese: 'Reservado',
  }
  const [verticalConteudo, setVerticalConteudo] = useState<VerticalConteudo | typeof VALOR_SEM_VERTICAL>(
    VALOR_SEM_VERTICAL,
  )
  const [corpo, setCorpo] = useState('')
  const [publicado, setPublicado] = useState(false)
  const [erros, setErros] = useState<FormErros>({})
  const [importando, setImportando] = useState(false)
  const [erroImport, setErroImport] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: criarConteudo,
    onSuccess: () => {
      navigate('/admin/biblioteca')
    },
  })

  async function handleDocxSelecionado(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return

    setImportando(true)
    setErroImport(null)

    try {
      const resultado = await parsearArquivoBriefing(arquivo)
      if (resultado.edicao) setEdicao(String(resultado.edicao))
      if (resultado.autor) setAutor(resultado.autor)
      if (resultado.corpo) {
        setCorpo(resultado.corpo)
        if (erros.corpo) setErros((prev) => ({ ...prev, corpo: undefined }))

        try {
          const enriquecido = await enriquecerBriefing(resultado.corpo)
          if (enriquecido.titulo) setTitulo(enriquecido.titulo.slice(0, 255))
          if (enriquecido.regiao) setRegiao(enriquecido.regiao.slice(0, 100))
          if (enriquecido.tags?.length) setTags(enriquecido.tags.map((t) => t.slice(0, 50)).join(', '))
          if (enriquecido.resumo) setResumo(enriquecido.resumo.slice(0, 500))
        } catch {
          // enriquecimento é best-effort — falha silenciosa
        }
      }
    } catch {
      setErroImport('Não foi possível processar o arquivo. Verifique se é um .docx válido.')
    } finally {
      setImportando(false)
      if (inputDocx.current) inputDocx.current.value = ''
    }
  }

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
      edicao: edicao ? parseInt(edicao, 10) : null,
      autor: autor.trim() || null,
      titulo: titulo.trim(),
      ...(tipo === 'tese' ? { tese_manchete: teseManchete.trim() } : {}),
      regiao: regiao.trim() || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      resumo: resumo.trim() || undefined,
      vertical_conteudo: verticalConteudo === VALOR_SEM_VERTICAL ? null : verticalConteudo,
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

        {/* Importar DOCX */}
        {tipo === 'briefing' && (
          <Card size="3" className="border border-cyan-400/10 bg-slate-950/60">
            <Flex direction={{ initial: 'column', sm: 'row' }} align={{ sm: 'center' }} justify="between" gap="4">
              <Box className="space-y-1">
                <Text size="2" weight="medium">
                  Importar briefing via DOCX
                </Text>
                <Text size="1" className="text-cyan-100/50">
                  Pré-preenche todos os campos via IA a partir do arquivo.
                </Text>
                {erroImport && (
                  <Text size="1" color="ruby">
                    {erroImport}
                  </Text>
                )}
              </Box>
              <input
                ref={inputDocx}
                type="file"
                accept=".docx,.pdf"
                className="hidden"
                onChange={handleDocxSelecionado}
              />
              <Button
                type="button"
                size="2"
                variant="soft"
                color="cyan"
                disabled={importando}
                onClick={() => inputDocx.current?.click()}
              >
                {importando ? <Spinner size="1" /> : <UploadIcon />}
                {importando ? 'Processando...' : 'Selecionar .docx ou .pdf'}
              </Button>
            </Flex>
          </Card>
        )}

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

              {/* Edição e Autor — apenas briefing */}
              {tipo === 'briefing' && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <Text size="2" weight="medium">
                      Nº edição
                    </Text>
                    <TextField.Root
                      size="3"
                      type="number"
                      min="1"
                      value={edicao}
                      onChange={(e) => setEdicao(e.target.value)}
                      placeholder="001"
                      className="w-full"
                    />
                  </label>

                  <label className="space-y-2">
                    <Text size="2" weight="medium">
                      Autor
                    </Text>
                    <TextField.Root
                      size="3"
                      value={autor}
                      onChange={(e) => setAutor(e.target.value)}
                      placeholder="Ex: Danuzio Neto"
                      className="w-full"
                    />
                  </label>
                </div>
              )}

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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Região */}
                <label className="space-y-2">
                  <Text size="2" weight="medium">
                    Região
                  </Text>
                  <TextField.Root
                    size="3"
                    value={regiao}
                    onChange={(e) => setRegiao(e.target.value)}
                    placeholder="Ex: América Latina, Europa..."
                    className="w-full"
                  />
                </label>

                {/* Tags */}
                <label className="space-y-2">
                  <Text size="2" weight="medium">
                    Tags
                  </Text>
                  <TextField.Root
                    size="3"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="tag1, tag2, tag3"
                    className="w-full"
                  />
                  <Text size="1" className="text-cyan-100/45">
                    Separadas por vírgula
                  </Text>
                </label>
              </div>

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

              {/* Plano mínimo — definido automaticamente pelo tipo */}
              <Flex direction="column" gap="1">
                <Text size="2" weight="medium">
                  Plano mínimo para acesso
                </Text>
                <Text size="2" color="gray">
                  Definido automaticamente pelo tipo:{' '}
                  <Text size="2" weight="bold" color="blue">
                    {PLANO_POR_TIPO[tipo]}
                  </Text>
                </Text>
              </Flex>

              {/* Vertical de conteúdo */}
              <label className="space-y-2">
                <Text size="2" weight="medium">
                  Vertical de conteúdo
                </Text>
                <Select.Root
                  value={verticalConteudo}
                  onValueChange={(valor) =>
                    setVerticalConteudo(valor as VerticalConteudo | typeof VALOR_SEM_VERTICAL)
                  }
                >
                  <Select.Trigger className="w-full" />
                  <Select.Content>
                    <Select.Item value={VALOR_SEM_VERTICAL}>GPI Core (sem vertical)</Select.Item>
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
                <Box className="space-y-1 rounded-lg border border-red-500/30 bg-red-950/40 p-3">
                  <Text size="2" color="ruby" weight="medium">
                    Erro ao salvar o conteúdo.
                  </Text>
                  {(() => {
                    const erroAxios = mutation.error as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }
                    const errosDados = erroAxios?.response?.data?.errors
                    const mensagem = erroAxios?.response?.data?.message
                    if (errosDados) {
                      return (
                        <ul className="list-disc pl-4 space-y-0.5">
                          {Object.entries(errosDados).map(([campo, msgs]) => (
                            <li key={campo}>
                              <Text size="1" color="ruby">{campo}: {(msgs as string[]).join(', ')}</Text>
                            </li>
                          ))}
                        </ul>
                      )
                    }
                    return <Text size="1" color="ruby">{mensagem ?? 'Verifique os dados e tente novamente.'}</Text>
                  })()}
                </Box>
              )}

              <Flex justify="end" gap="3" wrap="wrap">
                <Button
                  type="button"
                  size="3"
                  variant="soft"
                  color="gray"
                  onClick={() => navigate('/admin/biblioteca')}
                  disabled={mutation.isPending}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="3"
                  color="cyan"
                  disabled={mutation.isPending}
                  className="w-full sm:w-auto"
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
