import { useEffect, useRef } from 'react';

/**
 * Executa `callback` imediatamente e, em seguida, a cada `intervalMs`.
 *
 * Usa uma ref para sempre chamar a versão mais recente do callback (evita
 * "stale closures") e limpa o intervalo automaticamente ao desmontar.
 */
export function usePolling(callback: () => void, intervalMs: number, enabled = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => savedCallback.current();
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
