import { useState } from 'react'
import { Button, Flex, Heading, Text } from '@radix-ui/themes'
import { PlusIcon } from '@radix-ui/react-icons'
import { useAuth } from '../../hooks/useAuth'
import { useEquipe, useRemoverMembro } from '../../hooks/useEquipe'
import { MembersList } from './MembersList'
import { InviteMemberModal } from './InviteMemberModal'

export function TeamPanel() {
  const { user } = useAuth()
  const [modalAberto, setModalAberto] = useState(false)
  const { membros, total, maxUsuarios, isLoading } = useEquipe()
  const { remover } = useRemoverMembro()

  const isCompanyAdmin = user?.role === 'company_admin'

  if (!isCompanyAdmin) {
    return null
  }

  return (
    <div className="space-y-6">
      <Flex align="center" justify="between" wrap="wrap" gap="4">
        <div>
          <Heading size="5" mb="1">
            Minha Equipe
          </Heading>
          <Text size="2" color="gray">
            Gerencie os membros e convites da sua organização.
          </Text>
        </div>

        <Flex align="center" gap="3">
          <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 font-mono text-xs text-zinc-400">
            {total} / {maxUsuarios} membros
          </span>

          <Button
            type="button"
            onClick={() => setModalAberto(true)}
            disabled={total >= maxUsuarios}
          >
            <PlusIcon />
            Convidar
          </Button>
        </Flex>
      </Flex>

      <MembersList
        membros={membros}
        onRemover={remover}
        isLoading={isLoading}
      />

      <InviteMemberModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSuccess={() => setModalAberto(false)}
      />
    </div>
  )
}
