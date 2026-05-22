export type UserResponse = {
  id: number
  uuid: string
  nome: string
  sobrenome: string
  email: string
  data_nascimento: string
  documento: string
  device_uid: string | null
}

export type UserCreate = {
  nome: string
  sobrenome: string
  email: string
  senha: string
  data_nascimento: string
  documento: string
}
