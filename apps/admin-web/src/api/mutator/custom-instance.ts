import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";

export const customInstance = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const request = {
    timeout: 10000,
    withCredentials: false,
    ...config,
    ...options,
    baseURL: import.meta.env.VITE_API_URL || "",
  };
  if (
    request.method?.toUpperCase() === "POST" &&
    /^\/api\/admin\/auth\/browser\/(login|refresh|logout)$/.test(request.url ?? "")
  ) {
    request.headers = { ...request.headers, "X-Admin-Request": "1" };
    request.withCredentials = true;
  }
  const response = await axios.request<T>(request);
  return response.data;
};

export type ErrorType<Error> = AxiosError<Error>;
export type BodyType<BodyData> = BodyData;
