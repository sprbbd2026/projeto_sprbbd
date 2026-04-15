import { create } from 'zustand'
import type { UserCreate, UserResponse } from '../types/user'
import { createUser as postUser, fetchUsers as getUsers } from '../services/userService'
import { getRequestErrorMessage } from '../utils/error'

type UserState = {
  users: UserResponse[]
  loading: boolean
  error: string | null
  fetchUsers: () => Promise<void>
  createUser: (payload: UserCreate) => Promise<void>
  clearError: () => void
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchUsers: async () => {
    set({ loading: true, error: null })
    try {
      const users = await getUsers()
      set({ users, loading: false })
    } catch (e) {
      set({ error: getRequestErrorMessage(e), loading: false })
    }
  },

  createUser: async (payload) => {
    set({ loading: true, error: null })
    try {
      const created = await postUser(payload)
      set((s) => ({
        users: [...s.users, created],
        loading: false,
      }))
    } catch (e) {
      set({ error: getRequestErrorMessage(e), loading: false })
    }
  },
}))
