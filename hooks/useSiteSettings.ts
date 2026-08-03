import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';

/**
 * Reusable hook to access global site settings and maintenance mode.
 */
export function useSiteSettings() {
  return useSiteSettingsContext();
}
