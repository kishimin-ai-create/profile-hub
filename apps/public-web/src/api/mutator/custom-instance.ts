import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";

export const customInstance = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const response = await axios.request<T>({
    baseURL: import.meta.env.VITE_API_URL || "/api",
    timeout: 10000,
    ...config,
    ...options,
    withCredentials: false,
  });
  return response.data;
};

export type ErrorType<Error> = AxiosError<Error>;
export type BodyType<BodyData> = BodyData;
