import { useState, useCallback } from 'react';
import axios, { AxiosRequestConfig } from 'axios';

interface UseApiOptions {
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
  url: string;
  data?: any;
  config?: AxiosRequestConfig;
}

export function useApi<T = any>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (options: UseApiOptions) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('agent_token');
      const config: AxiosRequestConfig = {
        ...options.config,
        headers: {
          ...options.config?.headers,
          Authorization: `Bearer ${token}`,
        },
      };

      let response;
      switch (options.method || 'get') {
        case 'post':
          response = await axios.post(options.url, options.data, config);
          break;
        case 'put':
          response = await axios.put(options.url, options.data, config);
          break;
        case 'patch':
          response = await axios.patch(options.url, options.data, config);
          break;
        case 'delete':
          response = await axios.delete(options.url, config);
          break;
        default:
          response = await axios.get(options.url, config);
      }

      setData(response.data.data || response.data);
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Something went wrong';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
