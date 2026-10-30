import { useMemo } from "react";
import { z } from "zod";
import { createAuthorizedRequest } from "../api/authorized-request";
import { PortfolioList } from "./portfolio-list";

const portfolioResponse = z.object({
  data: z.array(
    z.object({ id: z.string(), name: z.string(), section: z.enum(["engineering", "hobby"]) }),
  ),
});
type Props = { session: { accessToken: () => string | null } };

export const PortfolioPage = ({ session }: Props) => {
  const load = useMemo(() => {
    const request = createAuthorizedRequest(session);
    return async () =>
      portfolioResponse.parse(
        await request<unknown>({ method: "GET", url: "/api/admin/portfolio" }),
      ).data;
  }, [session]);
  return <PortfolioList load={load} />;
};
