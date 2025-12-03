/**
 * Auth Store
 *
 * Zustand store for client-side authentication state.
 * Initialized with user data from Astro props (SSR).
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthStore, AuthUser } from "./types";

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // State
      user: null,
      isAuthenticated: false,
      emailVerificationDismissed: false,

      // Actions
      setUser: (user: AuthUser | null) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch (err) {
          console.error("Logout error:", err);
        }
        set({ user: null, isAuthenticated: false });
        window.location.href = "/";
      },

      dismissEmailVerification: () => set({ emailVerificationDismissed: true }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),
      // Only persist dismissal state, not user data (comes from server)
      partialize: (state) => ({
        emailVerificationDismissed: state.emailVerificationDismissed,
      }),
    }
  )
);






