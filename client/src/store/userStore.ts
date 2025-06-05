import { create } from "zustand";
import { type IUser } from "../interfaces/user.interface";

interface UserState {
  users: IUser[];
  artists: IUser[];
  selectedUser: IUser | null;
  loading: boolean;
  error: string | null;
}

interface UserActions {
  setUsers: (users: IUser[]) => void;
  setArtists: (artists: IUser[]) => void;
  setSelectedUser: (user: IUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const userStore = create<UserState & UserActions>((set) => ({
  users: [],
  artists: [],
  selectedUser: null,
  loading: false,
  error: null,

  setUsers: (users) => set({ users }),
  setArtists: (artists) => set({ artists }),
  setSelectedUser: (user) => set({ selectedUser: user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
