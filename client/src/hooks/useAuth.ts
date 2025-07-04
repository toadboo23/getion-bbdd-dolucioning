import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@shared/schema';

// Use relative URLs for Docker/production, absolute URLs only for local development
const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:5173' : '';

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

export function useAuth () {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      try {
        const authUrl = `${API_BASE_URL}/api/auth/user`;
        console.log('Auth URL:', authUrl);

        const response = await fetch(authUrl, {
          credentials: 'include',
        });

        if (response.status === 401) {
          return null; // Usuario no autenticado
        }

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const logoutUrl = `${API_BASE_URL}/api/auth/logout`;
      console.log('Logout URL:', logoutUrl);

      const response = await fetch(logoutUrl, {
        method: 'POST',
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
    onSuccess: () => {
      // Invalidar la query del usuario y redirigir
      queryClient.setQueryData(['/api/auth/user'], null);
      queryClient.clear();
      window.location.href = '/';
    },
    onError: (error) => {
      console.error('Error during logout:', error);
      // Aunque haya error, intentamos limpiar y redirigir
      queryClient.setQueryData(['/api/auth/user'], null);
      queryClient.clear();
      window.location.href = '/';
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    logout,
    isLoggingOut: logoutMutation.isPending,
  };
}

// Hook para obtener el contador de notificaciones
export function useNotificationCount () {
  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        credentials: 'include',
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
