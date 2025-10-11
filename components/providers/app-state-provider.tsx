"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { v4 as uuidv4 } from "uuid"

type ReservationStatus = "pending" | "confirmed" | "cancelled"

type Reservation = {
  id: string
  patientName: string
  patientEmail: string
  patientPhone: string
  serviceTypeId: string
  serviceTypeName: string
  appointmentDate: string
  appointmentTime: string
  notes?: string
  status: ReservationStatus
  createdAt: string
}

type ServiceType = {
  id: string
  name: string
  durationMinutes: number
}

type AdminUser = {
  id: string
  email: string
  password: string
  name: string
  createdAt: string
}

type AppState = {
  adminUsers: AdminUser[]
  currentUserId?: string
  reservations: Reservation[]
  serviceTypes: ServiceType[]
}

type AuthResult =
  | { success: true }
  | { success: false; error: string }

type AppStateContextValue = {
  isReady: boolean
  currentUser?: AdminUser
  reservations: Reservation[]
  serviceTypes: ServiceType[]
  login: (email: string, password: string) => AuthResult
  logout: () => void
  registerAdmin: (user: Omit<AdminUser, "id" | "createdAt"> & { password: string }) => AdminUser
  createReservation: (reservation: Omit<Reservation, "id" | "status" | "createdAt">) => Reservation
  updateReservationStatus: (id: string, status: ReservationStatus) => void
  deleteReservation: (id: string) => void
  resetState: () => void
}

const STORAGE_KEY = "manary-local-app-state"

const defaultServiceTypes: ServiceType[] = [
  { id: "prenatal", name: "妊婦健診", durationMinutes: 60 },
  { id: "postnatal", name: "産後ケア", durationMinutes: 90 },
  { id: "breast", name: "乳房ケア", durationMinutes: 45 },
]

const defaultAdmin: AdminUser = {
  id: "default-admin",
  email: "admin@manary.local",
  password: "password123",
  name: "Default Admin",
  createdAt: new Date().toISOString(),
}

const defaultState: AppState = {
  adminUsers: [defaultAdmin],
  currentUserId: undefined,
  reservations: [],
  serviceTypes: defaultServiceTypes,
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined)

function loadState(): AppState {
  if (typeof window === "undefined") {
    return defaultState
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return defaultState
    }

    const parsed = JSON.parse(stored) as AppState

    if (!parsed.serviceTypes || parsed.serviceTypes.length === 0) {
      parsed.serviceTypes = defaultServiceTypes
    }

    if (!parsed.adminUsers || parsed.adminUsers.length === 0) {
      parsed.adminUsers = [defaultAdmin]
    }

    return parsed
  } catch (error) {
    console.error("Failed to load local state", error)
    return defaultState
  }
}

function persistState(state: AppState) {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error("Failed to persist local state", error)
  }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const initialState = loadState()
    setState(initialState)
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (isReady) {
      persistState(state)
    }
  }, [state, isReady])

  const login = useCallback<AppStateContextValue["login"]>((email, password) => {
    const user = state.adminUsers.find((admin) => admin.email === email.trim().toLowerCase())
    if (!user || user.password !== password) {
      return { success: false, error: "メールアドレスまたはパスワードが正しくありません。" }
    }

    setState((prev) => ({ ...prev, currentUserId: user.id }))
    return { success: true }
  }, [state.adminUsers])

  const logout = useCallback(() => {
    setState((prev) => ({ ...prev, currentUserId: undefined }))
  }, [])

  const registerAdmin = useCallback<AppStateContextValue["registerAdmin"]>(({ email, name, password }) => {
    const normalizedEmail = email.trim().toLowerCase()

    const existingUser = state.adminUsers.find((admin) => admin.email === normalizedEmail)
    if (existingUser) {
      throw new Error("同じメールアドレスの管理者が既に存在します。")
    }

    const newAdmin: AdminUser = {
      id: uuidv4(),
      email: normalizedEmail,
      password,
      name,
      createdAt: new Date().toISOString(),
    }

    setState((prev) => ({
      ...prev,
      adminUsers: [...prev.adminUsers, newAdmin],
    }))

    return newAdmin
  }, [state.adminUsers])

  const createReservation = useCallback<AppStateContextValue["createReservation"]>((reservation) => {
    const newReservation: Reservation = {
      ...reservation,
      id: uuidv4(),
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    setState((prev) => ({
      ...prev,
      reservations: [...prev.reservations, newReservation],
    }))

    return newReservation
  }, [])

  const updateReservationStatus = useCallback<AppStateContextValue["updateReservationStatus"]>((id, status) => {
    setState((prev) => ({
      ...prev,
      reservations: prev.reservations.map((reservation) =>
        reservation.id === id ? { ...reservation, status } : reservation,
      ),
    }))
  }, [])

  const deleteReservation = useCallback<AppStateContextValue["deleteReservation"]>((id) => {
    setState((prev) => ({
      ...prev,
      reservations: prev.reservations.filter((reservation) => reservation.id !== id),
    }))
  }, [])

  const resetState = useCallback(() => {
    setState(defaultState)
  }, [])

  const contextValue = useMemo<AppStateContextValue>(() => {
    const currentUser = state.currentUserId
      ? state.adminUsers.find((admin) => admin.id === state.currentUserId)
      : undefined

    return {
      isReady,
      currentUser,
      reservations: state.reservations,
      serviceTypes: state.serviceTypes,
      login,
      logout,
      registerAdmin,
      createReservation,
      updateReservationStatus,
      deleteReservation,
      resetState,
    }
  }, [isReady, state, login, logout, registerAdmin, createReservation, updateReservationStatus, deleteReservation, resetState])

  return <AppStateContext.Provider value={contextValue}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider")
  }
  return context
}

export type { Reservation, ReservationStatus, ServiceType }
