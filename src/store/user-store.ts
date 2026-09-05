import { IUser } from "@/interfaces";
import { create } from "zustand";

export interface UserStore {
  user: IUser | null;
  isLoading: boolean;
  setUser: (user: IUser) => void;
  clearUser: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoading: false,
  setUser: (user: IUser) => set({ user, isLoading: false }),
  clearUser: () => set({ user: null, isLoading: false }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
}));