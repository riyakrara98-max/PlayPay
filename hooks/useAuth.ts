import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Reusable hook to access authentication state and action handlers.
 */
export function useAuth() {
  const context = useAuthContext();
  return {
    ...context,
    isAdmin: context.userProfile?.role === 'admin',
  };
}
