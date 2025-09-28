import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * 管理 API 輪詢的 Hook
 */
export const usePolling = (apiCall, interval = 1000, enabled = false) => {
  const intervalRef = useRef(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (!enabled) return;

    const poll = async () => {
      try {
        setIsLoading(true);
        const result = await apiCall();
        if (result.success) {
          setData(prev => {
            // 只在數據真正變化時才更新
            if (JSON.stringify(prev) !== JSON.stringify(result.data)) {
              return result.data;
            }
            return prev;
          });
          setError(null);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    // 立即執行一次
    poll();
    
    // 設定定時輪詢
    intervalRef.current = setInterval(poll, interval);
  }, [apiCall, interval, enabled]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [enabled, startPolling, stopPolling]);

  return { data, error, isLoading, startPolling, stopPolling };
};

/**
 * 管理異步操作狀態的 Hook
 */
export const useAsyncOperation = () => {
  const [state, setState] = useState({
    isLoading: false,
    error: null,
    data: null
  });

  const execute = useCallback(async (asyncFunction) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await asyncFunction();
      setState({ isLoading: false, error: null, data: result });
      return result;
    } catch (error) {
      setState({ isLoading: false, error: error.message, data: null });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, data: null });
  }, []);

  return { ...state, execute, reset };
};

/**
 * 管理表單狀態的 Hook
 */
export const useFormState = (initialState) => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});

  const updateValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const setError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialState);
    setErrors({});
  }, [initialState]);

  return {
    values,
    errors,
    updateValue,
    setError,
    reset
  };
};