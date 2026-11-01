import {
  LoginAdminBrowserResponse,
  RefreshAdminBrowserResponse,
} from "../gen/admin-auth/profileHubAPI.zod";

type SessionDependencies = {
  login: (email: string, password: string) => Promise<unknown>;
  refresh: () => Promise<unknown>;
  logout: () => Promise<void>;
};
type SessionState = {
  token: string | null;
  epoch: number;
  queue: Promise<void>;
  pendingRefresh: Promise<boolean> | null;
};

/** Keeps the short-lived access credential in memory and serializes session changes. */
export const createAdminSession = (dependencies: SessionDependencies) => {
  const state: SessionState = {
    token: null,
    epoch: 0,
    queue: Promise.resolve(),
    pendingRefresh: null,
  };
  const enqueue = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = state.queue.then(operation, operation);
    state.queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
  const readToken = (response: unknown, refresh: boolean) => {
    const parsed = (refresh ? RefreshAdminBrowserResponse : LoginAdminBrowserResponse).parse(
      response,
    );
    const token = parsed.data.accessToken;
    if (!token || token.length > 4096) throw new Error("Invalid session response");
    return token;
  };
  return {
    accessToken: () => state.token,
    login: (email: string, password: string) => {
      state.epoch += 1;
      state.token = null;
      const epoch = state.epoch;
      return enqueue(async () => {
        const token = readToken(await dependencies.login(email, password), false);
        if (state.epoch !== epoch) return false;
        state.token = token;
        return true;
      });
    },
    restore: () => {
      if (state.pendingRefresh) return state.pendingRefresh;
      const epoch = state.epoch;
      const pending = enqueue(async () => {
        const response = await dependencies.refresh();
        if (state.epoch !== epoch) return false;
        state.token = response === null ? null : readToken(response, true);
        return state.token !== null;
      });
      state.pendingRefresh = pending;
      void pending.then(
        () => {
          if (state.pendingRefresh === pending) state.pendingRefresh = null;
        },
        () => {
          if (state.pendingRefresh === pending) state.pendingRefresh = null;
        },
      );
      return pending;
    },
    logout: () => {
      state.epoch += 1;
      state.token = null;
      return enqueue(dependencies.logout);
    },
  };
};
