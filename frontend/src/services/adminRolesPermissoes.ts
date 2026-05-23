import api from '../lib/axios'

export interface Role {
  id: number
  name: string
  users_count: number
  permissions: string[]
  permissions_count: number
}

export interface Permission {
  id: number
  name: string
  roles: string[]
}

export const adminRolesKeys = {
  roles: () => ['admin', 'roles'] as const,
  permissions: () => ['admin', 'permissions'] as const,
}

export const fetchRoles = async (): Promise<Role[]> => {
  const { data } = await api.get('/admin/roles')
  return data.data
}

export const criarRole = async (name: string): Promise<Role> => {
  const { data } = await api.post('/admin/roles', { name })
  return data.role
}

export const deletarRole = async (id: number): Promise<void> => {
  await api.delete(`/admin/roles/${id}`)
}

export const syncPermissoes = async (roleId: number, permissions: string[]): Promise<string[]> => {
  const { data } = await api.post(`/admin/roles/${roleId}/permissions/sync`, { permissions })
  return data.permissions
}

export const fetchPermissions = async (): Promise<Permission[]> => {
  const { data } = await api.get('/admin/permissions')
  return data.data
}

export const criarPermission = async (name: string): Promise<Permission> => {
  const { data } = await api.post('/admin/permissions', { name })
  return data.permission
}

export const deletarPermission = async (id: number): Promise<void> => {
  await api.delete(`/admin/permissions/${id}`)
}
