import { ApiClient } from './client'

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  hromadaId: string
  email: string
  password: string
}

export interface LoginResponse {
  token: string
}

export interface HromadaProfile {
  id: string
  email: string
  name: string
  koatuu: string
  region: string
  district: string
}

export interface Hromada {
  id: string
  name: string
  koatuu: string
  region: string
  district: string
  email: string | null
  _count?: { landRecords: number }
}

export class AuthService {
  static login(data: LoginRequest): Promise<LoginResponse> {
    return ApiClient.post<LoginResponse>('/auth/login', data)
  }

  static signup(data: SignupRequest): Promise<LoginResponse> {
    return ApiClient.post<LoginResponse>('/auth/signup', data)
  }

  static getMe(): Promise<HromadaProfile> {
    return ApiClient.get<HromadaProfile>('/auth/me')
  }

  static getHromadas(): Promise<Hromada[]> {
    return ApiClient.get<Hromada[]>('/api/hromadas')
  }
}
