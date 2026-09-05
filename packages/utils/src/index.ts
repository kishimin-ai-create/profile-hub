import { LOCALES, type Locale } from "@profile-hub/types";

/**
 * Narrows an arbitrary string to a supported locale.
 *
 * Both the public site (URL prefix) and the API (query parameter) take the
 * locale from untrusted input, and both must fall back rather than error, so
 * the check lives here instead of being written twice.
 */
export const isSupportedLocale = (value: string): value is Locale => Object.hasOwn(LOCALES, value);
