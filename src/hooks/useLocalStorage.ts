import { useState, useEffect, useRef, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const valueRef = useRef<T>(initialValue);

  // On mount: read from localStorage + subscribe to changes
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        const parsed = JSON.parse(item) as T;
        setStoredValue(parsed);
        valueRef.current = parsed;
      }
    } catch {
      // Silently ignore parse errors
    }

    const handleChange = (e: Event) => {
      // Native storage event = cross-tab change
      if (e instanceof StorageEvent) {
        if (e.key !== key) return;
        try {
          const parsed = e.newValue ? (JSON.parse(e.newValue) as T) : initialValue;
          setStoredValue(parsed);
          valueRef.current = parsed;
        } catch { /* ignore */ }
        return;
      }
      // Custom event = same-tab change from another component
      if (e instanceof CustomEvent && e.detail?.key === key) {
        const val = e.detail.value as T;
        setStoredValue(val);
        valueRef.current = val;
      }
    };

    window.addEventListener("storage", handleChange);
    window.addEventListener("aetheris-storage", handleChange);
    return () => {
      window.removeEventListener("storage", handleChange);
      window.removeEventListener("aetheris-storage", handleChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const next =
          value instanceof Function ? value(valueRef.current) : value;
        valueRef.current = next;
        setStoredValue(next);
        window.localStorage.setItem(key, JSON.stringify(next));

        // Notify other hooks using the same key in this tab
        // Dispatched via setTimeout to stay outside any render cycle
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("aetheris-storage", { detail: { key, value: next } })
          );
        }, 0);
      } catch {
        // Silently ignore write errors
      }
    },
    [key]
  );

  return [storedValue, setValue] as const;
}
