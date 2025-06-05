import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { type AuthState } from "../interfaces/auth.interface";
import { type IUser } from "../interfaces/user.interface";
import {
  LOCAL_STORAGE_TOKEN_KEY,
  LOCAL_STORAGE_USER_KEY,
} from "../utils/constants";

interface AuthActions {
  setLogin: (token: string, user: IUser) => void;
  logout: () => void;
  updateUser: (user: Partial<IUser>) => void;
}

export const authStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      token: localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY) || null,
      user: localStorage.getItem(LOCAL_STORAGE_USER_KEY)
        ? JSON.parse(localStorage.getItem(LOCAL_STORAGE_USER_KEY)!)
        : null,
      isAuthenticated: !!localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY),
      loading: false,
      error: null,

      setLogin: (token: string, user: IUser) => {
        localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, token);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
        set({
          token,
          user,
          isAuthenticated: true,
          loading: false,
          error: null,
        });
      },
      logout: () => {
        localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        });
      },
      updateUser: (updatedUserData: Partial<IUser>) => {
        set((state) => {
          if (state.user) {
            const newUser = { ...state.user, ...updatedUserData };
            localStorage.setItem(
              LOCAL_STORAGE_USER_KEY,
              JSON.stringify(newUser)
            );
            return { user: newUser };
          }
          return state;
        });
      },
    }),
    {
      name: "auth-storage", // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
