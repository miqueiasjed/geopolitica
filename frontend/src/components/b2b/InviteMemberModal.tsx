import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Dialog,
  Flex,
  Select,
  Text,
  TextField,
} from '@radix-ui/themes'
import { convidarMembro, equipeKeys } from '../../services/b2b'
import type { ConvidarMembroPayload } from '../../services/b2b'

interface InviteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function InviteMemberModal({ isOpen, onClose, onSuccess }: InviteMemberModalProps) {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ConvidarMembroPayload['role_b2b']>('leitor')
  const [erro, setErro] = useState<string | null>(null)

  const { mutate: enviarConvite, isPending } = useMutation({
    mutationFn: convidarMembro,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipeKeys.membros() })
      setEmail('')
      setRole('leitor')
      setErro(null)
      onSuccess()
      onClose()
    },
    onError: () => {
      setErro('Não foi possível enviar o convite. Verifique o e-mail e tente novamente.')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!email.trim()) {
      setErro('Informe um e-mail válido.')
      return
    }

    enviarConvite({ email: email.trim(), role_b2b: role })
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setEmail('')
      setRole('leitor')
      setErro(null)
      onClose()
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Content maxWidth="440px">
        <Dialog.Title>Convidar membro</Dialog.Title>
        <Dialog.Description size="2" mb="4" color="gray">
          Envie um convite por e-mail para adicionar um novo membro à sua equipe.
        </Dialog.Description>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            <div>
              <Text as="label" size="2" weight="medium" htmlFor="invite-email">
                E-mail
              </Text>
              <TextField.Root
                id="invite-email"
                type="email"
                placeholder="colaborador@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                mt="1"
                disabled={isPending}
              />
            </div>

            <div>
              <Text as="label" size="2" weight="medium">
                Permissão
              </Text>
              <Select.Root
                value={role}
                onValueChange={(val) => setRole(val as ConvidarMembroPayload['role_b2b'])}
                disabled={isPending}
              >
                <Select.Trigger mt="1" className="w-full" />
                <Select.Content>
                  <Select.Item value="leitor">Leitor</Select.Item>
                  <Select.Item value="admin">Administrador</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>

            {erro && (
              <Text size="2" color="red">
                {erro}
              </Text>
            )}

            <Flex gap="3" mt="2" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray" type="button" disabled={isPending}>
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button type="submit" loading={isPending}>
                Enviar convite
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  )
}
