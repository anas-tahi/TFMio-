import { create } from "zustand";
import api from "../lib/api";
import type { User, AuthResponse } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  loadMe: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role: "student" | "tutor" | "coordinator";
  degree?: string;
  year?: number;
  department?: string;
  scope?: "TFM" | "TFG";
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("tfmio_token"),
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
      localStorage.setItem("tfmio_token", data.token);
      set({ user: data.user, token: data.token, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (payload) => {
    set({ loading: true });
    try {
      const { data } = await api.post<AuthResponse>("/auth/register", payload);
      localStorage.setItem("tfmio_token", data.token);
      set({ user: data.user, token: data.token, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("tfmio_token");
    set({ user: null, token: null });
  },

  loadMe: async () => {
    const token = localStorage.getItem("tfmio_token");
    if (!token) return;
    set({ loading: true });
    try {
      const { data } = await api.get<{ user: User }>("/auth/me");
      set({ user: data.user, token, loading: false });
    } catch {
      localStorage.removeItem("tfmio_token");
      set({ user: null, token: null, loading: false });
    }
  },
}));
