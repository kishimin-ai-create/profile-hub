import { SECTIONS, type Section } from "@profile-hub/types";

/**
 * Narrows an arbitrary string to a known section.
 *
 * A section arrives as untrusted input on both sides — a route segment on the
 * public site, a stored value on a link in the admin console — and both have to
 * reject an unknown one rather than render an empty page, so the check lives
 * here instead of being written twice.
 */
export const isSection = (value: string): value is Section => Object.hasOwn(SECTIONS, value);
