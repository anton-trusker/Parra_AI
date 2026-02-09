import { create } from 'zustand';
import {
  GlassDimension,
  LocationConfig,
  VolumeOption,
  defaultGlassDimensions,
  defaultLocations,
  defaultVolumes,
} from '@/data/referenceData';

interface SettingsState {
  glassDimensions: GlassDimension[];
  locations: LocationConfig[];
  volumes: VolumeOption[];
  // Unit preference for opened bottles
  openedBottleUnit: 'fraction' | 'litres'; // fraction = 0.3 of bottle, litres = 0.25L

  addGlassDimension: (g: GlassDimension) => void;
  removeGlassDimension: (id: string) => void;
  addLocation: (l: LocationConfig) => void;
  removeLocation: (id: string) => void;
  addVolume: (v: VolumeOption) => void;
  removeVolume: (id: string) => void;
  setOpenedBottleUnit: (unit: 'fraction' | 'litres') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  glassDimensions: defaultGlassDimensions,
  locations: defaultLocations,
  volumes: defaultVolumes,
  openedBottleUnit: 'fraction',

  addGlassDimension: (g) => set((s) => ({ glassDimensions: [...s.glassDimensions, g] })),
  removeGlassDimension: (id) => set((s) => ({ glassDimensions: s.glassDimensions.filter((g) => g.id !== id) })),
  addLocation: (l) => set((s) => ({ locations: [...s.locations, l] })),
  removeLocation: (id) => set((s) => ({ locations: s.locations.filter((l) => l.id !== id) })),
  addVolume: (v) => set((s) => ({ volumes: [...s.volumes, v] })),
  removeVolume: (id) => set((s) => ({ volumes: s.volumes.filter((v) => v.id !== id) })),
  setOpenedBottleUnit: (unit) => set({ openedBottleUnit: unit }),
}));
