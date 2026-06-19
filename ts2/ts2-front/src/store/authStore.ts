import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AuthState = {
  accessToken: string | null
  deviceUid: string | null
  setAccessToken: (token: string | null) => void
  setDeviceUid: (uid: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      deviceUid: null,
      setAccessToken: (token) => set({ accessToken: token }),
      setDeviceUid: (uid) => set({ deviceUid: uid }),
      logout: () => set({ accessToken: null, deviceUid: null }),
    }),
    { name: 'ts2-auth-storage' },
  ),
)
