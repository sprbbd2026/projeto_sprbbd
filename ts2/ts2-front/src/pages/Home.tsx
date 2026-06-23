import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Home() {
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-indigo-50 to-slate-50 p-8">
      <h1 className="m-0 text-[clamp(1.75rem,5vw,2.25rem)] font-extrabold tracking-tight text-slate-900">
        Home
      </h1>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/"
          className="font-semibold text-blue-600 no-underline hover:underline"
        >
          Landing
        </Link>
        <button
          type="button"
          className="cursor-pointer rounded-[0.625rem] border border-slate-200 bg-white px-4 py-2 text-[0.9375rem] font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50"
          onClick={() => logout()}
        >
          Sair
        </button>
      </div>
    </div>
  )
}
