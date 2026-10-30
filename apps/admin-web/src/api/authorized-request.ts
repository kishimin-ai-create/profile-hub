import { customInstance } from "./mutator/custom-instance";

type Session = { accessToken: () => string | null };
type AdminRequest = {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  data?: unknown;
  params?: Record<string, string>;
};

export const createAuthorizedRequest =
  (session: Session) =>
  async <T>(request: AdminRequest): Promise<T> => {
    if (!/^\/api\/admin\/portfolio(?:\/(?:[1-9][0-9]{0,18}|order))?$/.test(request.url)) {
      throw new Error("Invalid administrator request");
    }
    const token = session.accessToken();
    if (!token) throw new Error("Authentication required");
    return customInstance<T>({ ...request, headers: { Authorization: `Bearer ${token}` } });
  };
