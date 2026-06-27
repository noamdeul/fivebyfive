import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Wraps vite-plugin-pwa's update hook. Returns whether a new version is waiting
 * and a function to activate it (reloading the page).
 */
export function usePwaUpdate() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  return {
    needRefresh,
    update: () => updateServiceWorker(true),
    dismiss: () => setNeedRefresh(false),
  };
}
