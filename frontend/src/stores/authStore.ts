import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, User } from '@/lib/api';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string, mode?: 'personal' | 'business') => Promise<void>;
    logout: () => void;
    setUser: (user: User | null) => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authApi.login(email, password);
                    set({
                        user: response.user,
                        isAuthenticated: true,
                        isLoading: false
                    });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Login failed',
                        isLoading: false
                    });
                    throw error;
                }
            },

            register: async (email: string, password: string, name: string, mode: 'personal' | 'business' = 'personal') => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authApi.register(email, password, name, mode);
                    set({
                        user: response.user,
                        isAuthenticated: true,
                        isLoading: false
                    });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Registration failed',
                        isLoading: false
                    });
                    throw error;
                }
            },

            logout: () => {
                authApi.logout();
                set({ user: null, isAuthenticated: false });
            },

            setUser: (user: User | null) => {
                set({ user, isAuthenticated: !!user });
            },

            clearError: () => {
                set({ error: null });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
