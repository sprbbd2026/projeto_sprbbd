import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-neutral-50 to-slate-100 p-8">
      <h1 className="m-0 text-[clamp(1.75rem,5vw,2.25rem)] font-extrabold tracking-tight text-slate-900">
        Landing page
      </h1>
      <p className="m-0">
        <Link
          to="/login"
          className="font-semibold text-blue-600 no-underline hover:underline"
        >
          Ir para login
        </Link>
      </p>
    </div>
  )
}
