export type UserRole = "admin" | "staff"

export interface Clinic {
  id: string
  name: string
  address?: string
  phoneNumber?: string
  createdAt: string
  updatedAt: string
}

export interface ServiceType {
  id: string
  clinicId: string
  name: string
  description?: string
  durationMinutes: number
  intervalMinutes: number
  price: number
  color: string
  createdAt: string
  updatedAt: string
}

export interface StoredUser {
  id: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt?: string
}

export interface ScheduleEvent {
  id: string
  clinicId: string
  serviceTypeId: string
  start: string
  end: string
  note?: string
}

export interface LocalDataShape {
  clinics: Clinic[]
  serviceTypes: ServiceType[]
  users: StoredUser[]
  events: ScheduleEvent[]
}

export const LOCAL_DATA_VERSION = 1
