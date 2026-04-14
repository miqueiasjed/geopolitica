import { Box, Card, Flex, Spinner, Text } from '@radix-ui/themes'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface RotaProtegidaProps {
  requiredRole?: string
}

export function RotaProtegida({ requiredRole }: RotaProtegidaProps) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a0b] px-6">
        <Card size="4" className="w-full max-w-md border border-cyan-400/10 bg-cyan-400/5">
          <Flex direction="column" gap="4" align="center" py="4">
            <Spinner size="3" />
            <Box className="text-center">
              <Text size="4" weight="medium">
                Validando sessao
              </Text>
            </Box>
          </Flex>
        </Card>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
