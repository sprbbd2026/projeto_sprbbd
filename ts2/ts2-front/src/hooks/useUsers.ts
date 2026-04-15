import { useUserStore } from '../store/userStore'

export function useUsers() {
  const users = useUserStore((s) => s.users)
  const loading = useUserStore((s) => s.loading)
  const error = useUserStore((s) => s.error)
  const fetchUsers = useUserStore((s) => s.fetchUsers)
  const createUser = useUserStore((s) => s.createUser)
  const clearError = useUserStore((s) => s.clearError)

  return { users, loading, error, fetchUsers, createUser, clearError }
}
