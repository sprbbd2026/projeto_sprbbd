export type UserResponse = {
  id: number
  nome: string
  sobrenome: string
  email: string
  data_nascimento: string
  documento: string
  latitude: string
  longitude: string
}

export type UserCreate = {
  nome: string
  sobrenome: string
  email: string
  senha: string
  data_nascimento: string
  documento: string
  latitude: string
  longitude: string
}
