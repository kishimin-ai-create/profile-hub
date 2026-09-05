import { LOCALES } from "@profile-hub/types";
import { isSupportedLocale } from "@profile-hub/utils";

/**
 * Placeholder shell for the public site.
 *
 * Routing, the shared layout, and the pages themselves arrive with the
 * public-web foundation issue. What this renders today only demonstrates that
 * the toolchain and the shared workspace packages resolve end to end.
 */
export const App = () => {
  const locales = Object.values(LOCALES).filter(isSupportedLocale);

  return <p>{`profile-hub — locales: ${locales.join(", ")}`}</p>;
};
