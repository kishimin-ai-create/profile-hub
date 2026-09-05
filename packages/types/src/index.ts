/**
 * The two halves of the public site.
 *
 * A contact link belongs to exactly one of these, and the API returns links
 * grouped by it so the hobby pages never receive the engineering contact
 * details. Declared as an object rather than a bare union so the values are
 * usable at runtime — route matching, form options — and the type stays derived
 * from a single source.
 *
 * Adding a section must not require a new table, endpoint, or screen, which is
 * why it is a value here rather than a shape somewhere.
 */
export const SECTIONS = {
  engineering: "engineering",
  hobby: "hobby",
} as const;

export type Section = (typeof SECTIONS)[keyof typeof SECTIONS];
