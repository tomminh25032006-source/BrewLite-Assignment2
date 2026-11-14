import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateLoyaltyPoints: (points: number) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Đọc từ LocalStorage nếu có
  let initialToken: string | null = null;
  let initialUser: User | null = null;

  if (typeof window !== 'undefined') {
    initialToken = localStorage.getItem('brewlite_token');
    const savedUser = localStorage.getItem('brewlite_user');
    if (savedUser) {
      try {
        initialUser = JSON.parse(savedUser);
      } catch (e) {
        // ignore
      }
    }
  }

  return {
    token: initialToken,
    user: initialUser,
    isAuthenticated: !!initialToken,

    login: (token: string, user: User) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('brewlite_token', token);
        localStorage.setItem('brewlite_user', JSON.stringify(user));
      }
      set({ token, user, isAuthenticated: true });
    },

    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('brewlite_token');
        localStorage.removeItem('brewlite_user');
      }
      set({ token: null, user: null, isAuthenticated: false });
    },

    updateLoyaltyPoints: (points: number) => {
      set((state) => {
        if (!state.user) return state;
        const updatedUser = { ...state.user, loyaltyPoints: points };
        if (typeof window !== 'undefined') {
          localStorage.setItem('brewlite_user', JSON.stringify(updatedUser));
        }
        return { user: updatedUser };
      });
    },
  };
});
