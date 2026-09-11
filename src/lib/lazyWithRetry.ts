import { lazy, ComponentType } from "react";

const KEY = "tgz_chunk_reloaded";

/**
 * React.lazy con reintento: si el navegador tiene en caché una versión
 * antigua de la app, el import dinámico falla ("Importing a module script
 * failed"). Reintentamos una vez y, si sigue fallando, recargamos la página
 * una sola vez para obtener los archivos nuevos.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      sessionStorage.removeItem(KEY);
      return mod;
    } catch (err) {
      try {
        const mod = await factory();
        sessionStorage.removeItem(KEY);
        return mod;
      } catch (err2) {
        if (!sessionStorage.getItem(KEY)) {
          sessionStorage.setItem(KEY, "1");
          window.location.reload();
          return new Promise<{ default: T }>(() => {});
        }
        throw err2;
      }
    }
  });
}
