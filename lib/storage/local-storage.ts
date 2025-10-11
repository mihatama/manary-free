'use client'

import { useCallback, useEffect, useState } from 'react'

import type {
  Clinic,
  LocalDataShape,
  ScheduleEvent,
  ServiceType,
  StoredUser,
  UserRole,
} from '@/types/local-data'

const STORAGE_KEY = 'manary.local-data'

const defaultData: LocalDataShape = {
  clinics: [],
  serviceTypes: [],
  users: [],
  events: [],
}

const listeners = new Set<() => void>()

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function cloneData(data: LocalDataShape): LocalDataShape {
  return JSON.parse(JSON.stringify(data)) as LocalDataShape
}

function readData(): LocalDataShape {
  if (!isBrowser()) {
    return cloneData(defaultData)
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return cloneData(defaultData)
    }
    const parsed = JSON.parse(raw) as Partial<LocalDataShape>
    return cloneData({ ...defaultData, ...parsed })
  } catch (error) {
    console.error('Failed to read local data. Resetting store.', error)
    return cloneData(defaultData)
  }
}

function writeData(data: LocalDataShape) {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    listeners.forEach((listener) => listener())
  } catch (error) {
    console.error('Failed to persist local data', error)
  }
}

function generateId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 10)
}

// --- Public data helpers --------------------------------------------------

export function getClinics(): Clinic[] {
  const data = readData()
  return data.clinics.sort((a, b) => a.name.localeCompare(b.name))
}

export function saveClinic(input: Omit<Clinic, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Clinic {
  const data = readData()
  const now = new Date().toISOString()
  const clinic: Clinic = {
    id: input.id ?? generateId(),
    name: input.name,
    address: input.address?.trim() || undefined,
    phoneNumber: input.phoneNumber?.trim() || undefined,
    createdAt: input.id ? data.clinics.find((c) => c.id === input.id)?.createdAt ?? now : now,
    updatedAt: now,
  }

  const index = data.clinics.findIndex((c) => c.id === clinic.id)
  if (index >= 0) {
    data.clinics[index] = clinic
  } else {
    data.clinics.push(clinic)
  }

  writeData(data)
  return clinic
}

export function deleteClinic(id: string) {
  const data = readData()
  data.clinics = data.clinics.filter((clinic) => clinic.id !== id)
  const orphanServiceTypeIds = data.serviceTypes.filter((type) => type.clinicId === id).map((type) => type.id)
  data.serviceTypes = data.serviceTypes.filter((type) => type.clinicId !== id)
  data.events = data.events.filter((event) => event.clinicId !== id && !orphanServiceTypeIds.includes(event.serviceTypeId))
  writeData(data)
}

export function getServiceTypes(clinicId?: string): ServiceType[] {
  const data = readData()
  const items = clinicId ? data.serviceTypes.filter((type) => type.clinicId === clinicId) : data.serviceTypes
  return items.sort((a, b) => a.name.localeCompare(b.name))
}

export function saveServiceType(
  input: Omit<ServiceType, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): ServiceType {
  const data = readData()
  const now = new Date().toISOString()
  const serviceType: ServiceType = {
    id: input.id ?? generateId(),
    clinicId: input.clinicId,
    name: input.name,
    description: input.description?.trim() || undefined,
    durationMinutes: Math.max(5, Number.isFinite(input.durationMinutes) ? input.durationMinutes : 60),
    intervalMinutes: Math.max(0, Number.isFinite(input.intervalMinutes) ? input.intervalMinutes : 0),
    price: Math.max(0, Number.isFinite(input.price) ? input.price : 0),
    color: input.color || '#f8a0a0',
    createdAt: input.id ? data.serviceTypes.find((st) => st.id === input.id)?.createdAt ?? now : now,
    updatedAt: now,
  }

  const index = data.serviceTypes.findIndex((item) => item.id === serviceType.id)
  if (index >= 0) {
    data.serviceTypes[index] = serviceType
  } else {
    data.serviceTypes.push(serviceType)
  }

  writeData(data)
  return serviceType
}

export function deleteServiceType(id: string) {
  const data = readData()
  data.serviceTypes = data.serviceTypes.filter((type) => type.id !== id)
  data.events = data.events.filter((event) => event.serviceTypeId !== id)
  writeData(data)
}

export function getEventsForClinic(clinicId: string): ScheduleEvent[] {
  const data = readData()
  return data.events.filter((event) => event.clinicId === clinicId)
}

export function saveEvent(input: ScheduleEvent) {
  const data = readData()
  const index = data.events.findIndex((event) => event.id === input.id)
  if (index >= 0) {
    data.events[index] = input
  } else {
    data.events.push({ ...input, id: input.id || generateId() })
  }
  writeData(data)
}

export function getUsers(): StoredUser[] {
  const data = readData()
  return data.users.sort((a, b) => a.email.localeCompare(b.email))
}

export function saveUser(email: string, role: UserRole): StoredUser {
  const data = readData()
  const now = new Date().toISOString()
  const existing = data.users.find((user) => user.email === email)

  const user: StoredUser = existing
    ? { ...existing, role, updatedAt: now }
    : { id: generateId(), email, role, createdAt: now }

  if (existing) {
    data.users = data.users.map((item) => (item.id === existing.id ? user : item))
  } else {
    data.users.push(user)
  }

  writeData(data)
  return user
}

export function deleteUser(id: string) {
  const data = readData()
  data.users = data.users.filter((user) => user.id !== id)
  writeData(data)
}

export function subscribeToLocalData(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function resetLocalData() {
  writeData(cloneData(defaultData))
}

// React hook helpers -------------------------------------------------------

export function useLocalDataSelector<T>(selector: (data: LocalDataShape) => T) {
  const getValue = useCallback(() => selector(readData()), [selector])
  const [value, setValue] = useState<T>(getValue)

  useEffect(() => {
    const handleChange = () => setValue(getValue())
    const unsubscribe = subscribeToLocalData(handleChange)
    handleChange()
    return unsubscribe
  }, [getValue])

  return value
}
