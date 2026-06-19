import { Loader2, RefreshCw, Table2 } from 'lucide-react'
import type { UserResponse } from '../../types/user'
import { Button } from './Button'

const columns: { key: keyof UserResponse; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'nome', label: 'Nome' },
  { key: 'sobrenome', label: 'Sobrenome' },
  { key: 'email', label: 'E-mail' },
  { key: 'data_nascimento', label: 'Nascimento' },
  { key: 'documento', label: 'Documento' },
  { key: 'uuid', label: 'UUID' },
]

type Props = {
  users: UserResponse[]
  loading: boolean
  error: string | null
  onRefresh: () => void
  onClearError: () => void
}

export function UsersTable({ users, loading, error, onRefresh, onClearError }: Props) {
  return (
    <section
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgb(0_0_0/0.04)]"
      aria-labelledby="users-table-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
        <h2
          id="users-table-heading"
          className="m-0 flex items-center gap-2 text-base font-bold text-slate-900"
        >
          <Table2 className="h-5 w-5 text-blue-600" aria-hidden />
          Usuários (GET /users)
        </h2>
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={() => void onRefresh()}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw width={18} height={18} aria-hidden />
          )}
          Atualizar
        </Button>
      </div>
      {error ? (
        <p className="px-5 py-8 text-center text-sm font-medium text-red-600">
          {error}{' '}
          <button type="button" className="font-medium text-red-600 underline" onClick={onClearError}>
            Dispensar
          </button>
        </p>
      ) : null}
      {loading && users.length === 0 ? (
        <p className="flex items-center gap-2 px-5 py-4 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Carregando lista…
        </p>
      ) : null}
      <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <table className="w-full border-collapse text-[0.8125rem]">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={String(c.key)}
                  className="whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-500"
                  scope="col"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child_td]:border-b-0">
            {users.map((u) => (
              <tr key={u.id} className="group">
                {columns.map((c) => (
                  <td
                    key={String(c.key)}
                    className="max-w-[12rem] overflow-hidden text-ellipsis border-b border-slate-200 px-4 py-2.5 align-top text-slate-900 group-hover:bg-slate-50/80"
                    title={String(u[c.key])}
                  >
                    {u[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!loading && users.length === 0 && !error ? (
        <p className="px-5 py-8 text-center text-sm text-slate-500">
          Nenhum usuário retornado pela API.
        </p>
      ) : null}
    </section>
  )
}
