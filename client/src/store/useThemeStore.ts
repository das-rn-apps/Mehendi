// src/store/useThemeStore.ts
import { create } from "zustand";

type ThemeState = {
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  backgroundColor: "#fef2f2", // default red-100
  setBackgroundColor: (color) => set({ backgroundColor: color }),
}));
