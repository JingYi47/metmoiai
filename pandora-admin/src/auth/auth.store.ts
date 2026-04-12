import { create } from "zustand";
import { clearToken, setToken, getToken } from "../utils/storage";

export type Role = "user" | "admin" | "staff";

type User = {
  _id: string;
  username?: string;
  email: string;
  role: Role;
};

type AuthState = {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
};

// Khôi phục session từ localStorage
const savedToken = getToken();
const savedUser = (() => {
  try {
    const u = localStorage.getItem("admin_user_v1");
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
})();

export const useAuthStore = create<AuthState>((set) => ({
  token: savedToken ?? null,
  user: savedUser,
  setAuth: (token, user) => {
    setToken(token);
    localStorage.setItem("admin_user_v1", JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    clearToken();
    localStorage.removeItem("admin_user_v1");
    set({ token: null, user: null });
  },
}));
