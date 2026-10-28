import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";

export const customInstance = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const response = await axios.request<T>({
    timeout: 10000,
    withCredentials: false,
    ...config,
    ...options,
    baseURL: import.meta.env.VITE_API_URL || "",
  });
  return response.data;
};

export type ErrorType<Error> = AxiosError<Error>;
export type BodyType<BodyData> = BodyData;
