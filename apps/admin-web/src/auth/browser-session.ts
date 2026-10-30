import { isAxiosError } from "axios";
import { loginAdminBrowser, logoutAdminBrowser, refreshAdminBrowser } from "../gen/admin-auth";
import { createAdminSession } from "./session";

export const createBrowserSession = () =>
  createAdminSession({
    login: (email, password) => loginAdminBrowser({ email, password }),
    refresh: async () => {
      try {
        return await refreshAdminBrowser();
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) return null;
        throw error;
      }
    },
    logout: () => logoutAdminBrowser(),
  });
