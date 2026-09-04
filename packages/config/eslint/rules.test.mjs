import { describe, it } from "node:test";
import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";

import limitPropsKeys from "./rules/limit-props-keys.mjs";
import preferNamedExportsInUtils from "./rules/prefer-named-exports-in-utils.mjs";
import preferObjectDerivedUnion from "./rules/prefer-object-derived-union.mjs";
import requireBlankLineBetweenFormFields from "./rules/require-blank-line-between-form-fields.mjs";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("prefer-object-derived-union", preferObjectDerivedUnion, {
  valid: [
    // Derived from an `as const` object, which is the shape the rule steers to.
    {
      code: "type Status = (typeof STATUS)[keyof typeof STATUS];",
    },
    // Mixed unions are outside the rule: only all-string unions are reported.
    { code: 'type Mixed = "draft" | number;' },
  ],
  invalid: [
    {
      code: 'type Status = "draft" | "published";',
      errors: [{ messageId: "preferObjectDerivedUnion" }],
    },
  ],
});

ruleTester.run("limit-props-keys", limitPropsKeys, {
  valid: [
    { code: "type ButtonProps = { a: string; b: string; c: string; d: string; e: string };" },
    // The cap only applies to names ending in `Props`.
    {
      code: "type Config = { a: string; b: string; c: string; d: string; e: string; f: string };",
    },
  ],
  invalid: [
    {
      code: "type ButtonProps = { a: string; b: string; c: string; d: string; e: string; f: string };",
      errors: [{ messageId: "tooManyKeys" }],
    },
    {
      code: "interface CardProps { a: string; b: string; c: string; d: string; e: string; f: string }",
      errors: [{ messageId: "tooManyKeys" }],
    },
  ],
});

ruleTester.run("prefer-named-exports-in-utils", preferNamedExportsInUtils, {
  valid: [
    {
      code: "export const formatDate = () => {};",
      filename: "src/utils/format-date.ts",
    },
    // Outside `utils/` a default export is the caller's choice.
    {
      code: "export default function Page() {}",
      filename: "src/app/page.tsx",
    },
  ],
  invalid: [
    {
      code: "export default () => {};",
      filename: "src/utils/format-date.ts",
      errors: [{ messageId: "namedExport" }],
    },
  ],
});

ruleTester.run("require-blank-line-between-form-fields", requireBlankLineBetweenFormFields, {
  valid: [
    {
      code: [
        "const Form = () => (",
        "  <form>",
        "    <input />",
        "",
        "    <input />",
        "  </form>",
        ");",
      ].join("\n"),
    },
    // Non-form elements are untouched.
    {
      code: [
        "const List = () => (",
        "  <div>",
        "    <span />",
        "    <span />",
        "  </div>",
        ");",
      ].join("\n"),
    },
  ],
  invalid: [
    {
      code: [
        "const Form = () => (",
        "  <form>",
        "    <input />",
        "    <input />",
        "  </form>",
        ");",
      ].join("\n"),
      errors: [{ messageId: "blankLine" }],
    },
  ],
});
