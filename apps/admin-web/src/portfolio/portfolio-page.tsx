import { useMemo } from "react";
import type { ReactNode } from "react";
import { z } from "zod";
import { createAuthorizedRequest } from "../api/authorized-request";
import { PortfolioList } from "./portfolio-list";
import type { PortfolioRow } from "./portfolio-list";

const portfolioResponse = z.object({
  data: z.array(
    z.object({ id: z.string(), name: z.string(), section: z.enum(["engineering", "hobby"]) }),
  ),
});
type Props = {
  session: { accessToken: () => string | null };
  renderEdit?: (row: PortfolioRow) => ReactNode;
};

export const PortfolioPage = ({ session, renderEdit }: Props) => {
  const api = useMemo(() => {
    const request = createAuthorizedRequest(session);
    return {
      load: async () =>
        portfolioResponse.parse(
          await request<unknown>({ method: "GET", url: "/api/admin/portfolio" }),
        ).data,
      remove: async (id: string) => {
        await request({ method: "DELETE", url: `/api/admin/portfolio/${id}` });
      },
    };
  }, [session]);
  return <PortfolioList load={api.load} remove={api.remove} renderEdit={renderEdit} />;
};
