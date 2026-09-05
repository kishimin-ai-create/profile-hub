import { LOCALES } from "@profile-hub/types";
import { isSupportedLocale } from "@profile-hub/utils";

/**
 * Placeholder shell for the administrator console.
 *
 * The auth guard, routing, and the management screens arrive with the
 * admin-web foundation issue. What this renders today only demonstrates that
 * the toolchain and the shared workspace packages resolve end to end.
 */
export const App = () => {
  const locales = Object.values(LOCALES).filter(isSupportedLocale);

  return <p>{`profile-hub admin — locales: ${locales.join(", ")}`}</p>;
};
