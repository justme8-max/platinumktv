import { useState, useCallback, useRef } from "react";

interface UseOptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error, rollback: () => void) => void;
  onSettled?: () => void;
}

export function useOptimisticUpdate<T>(
  asyncFn: (data: T) => Promise<any>,
  options: UseOptimisticUpdateOptions<T> = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const rollbackRef = useRef<(() => void) | null>(null);

  const execute = useCallback(
    async (data: T, optimisticUpdate?: () => void, rollbackFn?: () => void) => {
      setIsLoading(true);
      setError(null);

      // Apply optimistic update immediately
      if (optimisticUpdate) {
        optimisticUpdate();
      }

      // Store rollback function
      rollbackRef.current = rollbackFn || null;

      try {
        const result = await asyncFn(data);
        options.onSuccess?.(data);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);

        // Rollback on error
        if (rollbackRef.current) {
          options.onError?.(error, rollbackRef.current);
          rollbackRef.current();
        } else {
          options.onError?.(error, () => {});
        }

        throw error;
      } finally {
        setIsLoading(false);
        options.onSettled?.();
      }
    },
    [asyncFn, options]
  );

  return { execute, isLoading, error };
}

// Hook for debounced search/filter
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
  }

  timeoutRef.current = setTimeout(() => {
    setDebouncedValue(value);
  }, delay);

  return debouncedValue;
}

// Hook for stable callback
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
}
