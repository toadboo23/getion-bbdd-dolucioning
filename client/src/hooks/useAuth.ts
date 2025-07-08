import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@shared/schema';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// URL base del backend - usar la URL relativa para que nginx haga proxy
const API_BASE_URL = '';

// Definir interfaz para notificaciones
interface Notification {
  id: number;
  status: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  logPageAccess: (page: string, action?: string) => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
      logPageAccess: async (page: string, action?: string) => {
        try {
          const { user } = get();
          if (!user) return;

          await fetch('/api/log-page-access', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ page, action }),
          });
        } catch (error) {
          console.error('Error logging page access:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
    },
  ),
);

// Hook para obtener el contador de notificaciones
export function useNotificationCount() {
  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
    retry: false,
  });

  const pendingCount = notifications?.filter((notification: Notification) =>
    notification.status === 'pending',
  ).length || 0;

  return pendingCount;
}
