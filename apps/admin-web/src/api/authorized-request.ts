import { isAxiosError } from "axios";
import { customInstance } from "./mutator/custom-instance";

export type AdminSession = { accessToken: () => string | null; restore?: () => Promise<boolean> };
type AdminRequest = {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  data?: unknown;
  params?: Record<string, string>;
};

export const createAuthorizedRequest =
  (session: AdminSession) =>
  async <T>(request: AdminRequest): Promise<T> => {
    if (!/^\/api\/admin\/portfolio(?:\/(?:[1-9][0-9]{0,18}|order))?$/.test(request.url)) {
      throw new Error("Invalid administrator request");
    }
    const token = session.accessToken();
    if (!token) throw new Error("Authentication required");
    try {
      return await customInstance<T>({ ...request, headers: { Authorization: `Bearer ${token}` } });
    } catch (error) {
      if (
        request.method !== "GET" ||
        !isAxiosError(error) ||
        error.response?.status !== 401 ||
        session.accessToken() !== token ||
        !session.restore
      )
        throw error;
      if (!(await session.restore())) throw error;
      const refreshed = session.accessToken();
      if (!refreshed || refreshed === token) throw error;
      return customInstance<T>({ ...request, headers: { Authorization: `Bearer ${refreshed}` } });
    }
  };
