/**
 * Languages the public site and the API both serve.
 *
 * Declared as an object rather than a bare union so the values are usable at
 * runtime (locale negotiation, route parsing) and the type stays derived from
 * a single source.
 */
export const LOCALES = {
  ja: "ja",
  en: "en",
} as const;

export type Locale = (typeof LOCALES)[keyof typeof LOCALES];
