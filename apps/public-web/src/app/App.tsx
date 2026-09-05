import { SECTIONS } from "@profile-hub/types";
import { isSection } from "@profile-hub/utils";

/**
 * Placeholder shell for the public site.
 *
 * Routing, the shared layout, and the pages themselves arrive with the
 * public-web foundation issue. What this renders today only demonstrates that
 * the toolchain and the shared workspace packages resolve end to end.
 */
export const App = () => {
  const sections = Object.values(SECTIONS).filter(isSection);

  return <p>{`profile-hub — sections: ${sections.join(", ")}`}</p>;
};
