import type { UserResponse } from '../types/user'

const AGE_BUCKETS = [
  { label: '0–17', min: 0, max: 17 },
  { label: '18–29', min: 18, max: 29 },
  { label: '30–44', min: 30, max: 44 },
  { label: '45–59', min: 45, max: 59 },
  { label: '60+', min: 60, max: 200 },
] as const

export function parseBirthDate(value: string): Date | null {
  if (!value) return null
  const d = new Date(value.includes('T') ? value : `${value}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function ageFromBirthDate(birth: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }
  return age
}

export function computeAgeDistribution(users: UserResponse[]) {
  const counts = new Map(AGE_BUCKETS.map((b) => [b.label, 0]))

  for (const user of users) {
    const birth = parseBirthDate(user.data_nascimento)
    if (!birth) continue
    const age = ageFromBirthDate(birth)
    const bucket = AGE_BUCKETS.find((b) => age >= b.min && age <= b.max)
    if (bucket) counts.set(bucket.label, (counts.get(bucket.label) ?? 0) + 1)
  }

  return AGE_BUCKETS.map((b) => ({
    name: b.label,
    quantidade: counts.get(b.label) ?? 0,
  })).filter((item) => item.quantidade > 0)
}

export function exportUsersCsv(users: UserResponse[]): void {
  const headers = ['ID', 'Nome', 'Sobrenome', 'E-mail', 'Documento', 'UUID', 'Dispositivo']
  const rows = users.map((u) => [
    u.id,
    u.nome,
    u.sobrenome,
    u.email,
    u.documento,
    u.uuid,
    u.device_uid ?? '',
  ])

  const csvContent =
    '\uFEFF' +
    [headers.join(';'), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'))].join(
      '\n',
    )

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `usuarios_exportados_${Date.now()}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
