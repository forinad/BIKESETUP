import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Bike, Rider, Setup, SharedPayload } from '../types'
import { bikeSignature, calcSetup } from './calc'
import { uid } from './id'

interface AppState {
  riders: Rider[]
  activeRiderId: string
  bikes: Bike[]
  setups: Setup[]
  addRider: (rider?: Partial<Rider>) => string
  updateRider: (id: string, patch: Partial<Rider>) => void
  deleteRider: (id: string) => void
  setActiveRider: (id: string) => void
  addBike: (bike: Bike) => void
  updateBike: (id: string, patch: Partial<Bike>) => void
  deleteBike: (id: string) => void
  duplicateBike: (id: string) => string | null
  addSetup: (setup: Setup) => void
  deleteSetup: (id: string) => void
  deleteSetupsForBike: (bikeId: string) => void
  findBikeBySignature: (signature: string) => Bike | undefined
  importShared: (payload: SharedPayload, targetBikeId?: string) => { bikeId: string; setupId: string }
  replaceAll: (data: { riders: Rider[]; bikes: Bike[]; setups: Setup[]; activeRiderId?: string }) => void
  clearGarage: () => void
}

function seed() {
  const rider: Rider = {
    id: 'rider_default',
    name: 'Райдер',
    heightCm: 175,
    weightKg: 75,
    gearKg: 3,
    createdAt: Date.now(),
  }

  return {
    riders: [rider],
    activeRiderId: rider.id,
    bikes: [] as Bike[],
    setups: [] as Setup[],
  }
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...seed(),

      addRider: (patch) => {
        const id = uid('rider')
        const rider: Rider = {
          id,
          name: patch?.name?.trim() || `Райдер ${get().riders.length + 1}`,
          heightCm: patch?.heightCm ?? 175,
          weightKg: patch?.weightKg ?? 75,
          gearKg: patch?.gearKg ?? 3,
          createdAt: Date.now(),
        }
        set((s) => ({ riders: [...s.riders, rider], activeRiderId: id }))
        return id
      },

      updateRider: (id, patch) =>
        set((s) => ({
          riders: s.riders.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      deleteRider: (id) =>
        set((s) => {
          if (s.riders.length <= 1) return s
          const riders = s.riders.filter((r) => r.id !== id)
          return {
            riders,
            activeRiderId: s.activeRiderId === id ? riders[0].id : s.activeRiderId,
          }
        }),

      setActiveRider: (id) => set({ activeRiderId: id }),

      addBike: (bike) => set((s) => ({ bikes: [...s.bikes, bike] })),

      updateBike: (id, patch) =>
        set((s) => ({
          bikes: s.bikes.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: Date.now() } : b)),
        })),

      deleteBike: (id) =>
        set((s) => ({
          bikes: s.bikes.filter((b) => b.id !== id),
          setups: s.setups.filter((st) => st.bikeId !== id),
        })),

      duplicateBike: (id) => {
        const src = get().bikes.find((b) => b.id === id)
        if (!src) return null
        const copy: Bike = {
          ...structuredClone(src),
          id: uid('bike'),
          name: `${src.name} (копия)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((s) => ({ bikes: [...s.bikes, copy] }))
        return copy.id
      },

      addSetup: (setup) => set((s) => ({ setups: [setup, ...s.setups] })),

      deleteSetup: (id) => set((s) => ({ setups: s.setups.filter((st) => st.id !== id) })),

      deleteSetupsForBike: (bikeId) =>
        set((s) => ({ setups: s.setups.filter((st) => st.bikeId !== bikeId) })),

      findBikeBySignature: (signature) => get().bikes.find((b) => bikeSignature(b) === signature),

      importShared: (payload, targetBikeId) => {
        const state = get()
        const existing =
          (targetBikeId ? state.bikes.find((b) => b.id === targetBikeId) : undefined) ??
          state.findBikeBySignature(bikeSignature(payload.bike))

        const now = Date.now()
        const bike: Bike = existing ?? {
          ...structuredClone(payload.bike),
          id: uid('bike'),
          createdAt: now,
          updatedAt: now,
        }
        if (!existing) {
          set((s) => ({ bikes: [...s.bikes, bike] }))
        }

        const rider: Rider = {
          id: uid('rider_shared'),
          name: payload.rider.name || 'Райдер (по ссылке)',
          heightCm: payload.rider.heightCm,
          weightKg: payload.rider.weightKg,
          gearKg: payload.rider.gearKg,
          createdAt: now,
        }
        const result = calcSetup(bike, rider, payload.params, payload.weather)
        const setup: Setup = {
          id: uid('setup'),
          bikeId: bike.id,
          riderId: rider.id,
          name: payload.name,
          notes: payload.notes,
          createdAt: now,
          params: payload.params,
          weather: payload.weather,
          riderSnapshot: {
            name: rider.name,
            heightCm: rider.heightCm,
            weightKg: rider.weightKg,
            gearKg: rider.gearKg,
          },
          bikeSignature: bikeSignature(bike),
          result,
        }
        set((s) => ({ setups: [setup, ...s.setups] }))
        return { bikeId: bike.id, setupId: setup.id }
      },

      replaceAll: (data) =>
        set((s) => ({
          riders: data.riders.length ? data.riders : s.riders,
          bikes: data.bikes,
          setups: data.setups,
          activeRiderId:
            data.activeRiderId && data.riders.some((r) => r.id === data.activeRiderId)
              ? data.activeRiderId
              : (data.riders[0]?.id ?? s.activeRiderId),
        })),

      clearGarage: () =>
        set((s) => {
          const riders = s.riders.length ? s.riders : seed().riders
          return {
            riders,
            bikes: [],
            setups: [],
            activeRiderId: riders.some((r) => r.id === s.activeRiderId)
              ? s.activeRiderId
              : riders[0].id,
          }
        }),
    }),
    {
      name: 'bikesetup-v1',
      version: 3,
      // v2: убираем демо-байк Norco у тех, кто открывал приложение раньше.
      // v3: не трогаем профиль райдера. Миграция v2 принудительно ставила
      // rider_demo и rider_default значения 175 см / 75 кг / 3 кг, из-за чего
      // у существующих пользователей слетали имя, рост, вес и экипировка.
      migrate: (persisted, version) => {
        if (!persisted || typeof persisted !== 'object') return persisted as AppState
        const s = persisted as AppState
        if (version < 2) {
          const bikes = (s.bikes ?? []).filter((b) => b.id !== 'bike_demo')
          const setups = (s.setups ?? []).filter(
            (st) => st.bikeId !== 'bike_demo' && st.id !== 'setup_demo',
          )
          const riders = s.riders?.length ? s.riders : seed().riders
          return {
            ...s,
            riders,
            bikes,
            setups,
            activeRiderId: riders.some((r) => r.id === s.activeRiderId)
              ? s.activeRiderId
              : riders[0].id,
          }
        }
        return s
      },
    },
  ),
)

// Первый визит: сохраняем стартовое состояние сразу, чтобы оно пережило
// перезагрузку даже без единого действия пользователя.
if (typeof window !== 'undefined' && !window.localStorage.getItem('bikesetup-v1')) {
  useApp.setState({})
}

export function backupJson(): string {
  const s = useApp.getState()
  return JSON.stringify(
    {
      app: 'bikesetup',
      version: 1,
      exportedAt: new Date().toISOString(),
      riders: s.riders,
      bikes: s.bikes,
      setups: s.setups,
      activeRiderId: s.activeRiderId,
    },
    null,
    2,
  )
}
