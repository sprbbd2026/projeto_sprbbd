import { Loader2, RefreshCw, Table2 } from 'lucide-react'
import type { UserResponse } from '../../types/user'
import { Button } from './Button'
import styles from './UsersTable.module.css'

const columns: { key: keyof UserResponse; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'nome', label: 'Nome' },
  { key: 'sobrenome', label: 'Sobrenome' },
  { key: 'email', label: 'E-mail' },
  { key: 'data_nascimento', label: 'Nascimento' },
  { key: 'documento', label: 'Documento' },
  { key: 'latitude', label: 'Lat.' },
  { key: 'longitude', label: 'Long.' },
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
    <section className={styles.card} aria-labelledby="users-table-heading">
      <div className={styles.toolbar}>
        <h2 id="users-table-heading" className={styles.title}>
          <Table2 className={styles.titleIcon} aria-hidden />
          Usuários (GET /users)
        </h2>
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={() => void onRefresh()}
        >
          {loading ? (
            <Loader2 className={styles.spin} aria-hidden />
          ) : (
            <RefreshCw width={18} height={18} aria-hidden />
          )}
          Atualizar
        </Button>
      </div>
      {error ? (
        <p className={`${styles.empty} ${styles.err}`}>
          {error}{' '}
          <button type="button" className={styles.err} onClick={onClearError}>
            Dispensar
          </button>
        </p>
      ) : null}
      {loading && users.length === 0 ? (
        <p className={styles.status}>
          <Loader2 className={styles.spin} aria-hidden />
          Carregando lista…
        </p>
      ) : null}
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={String(c.key)} className={styles.th} scope="col">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={styles.tr}>
                {columns.map((c) => (
                  <td key={String(c.key)} className={styles.td} title={String(u[c.key])}>
                    {u[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!loading && users.length === 0 && !error ? (
        <p className={styles.empty}>Nenhum usuário retornado pela API.</p>
      ) : null}
    </section>
  )
}
