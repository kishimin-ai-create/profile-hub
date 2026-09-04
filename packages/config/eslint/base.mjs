import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import unusedImports from "eslint-plugin-unused-imports";

/**
 * Rules every workspace shares regardless of framework.
 *
 * `require-description` is the load-bearing one: a suppression without a reason
 * is indistinguishable from a suppression nobody remembers the reason for, and
 * those never get removed.
 */
export const baseConfig = [
  {
    plugins: {
      "unused-imports": unusedImports,
      "@eslint-community/eslint-comments": eslintComments,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "@eslint-community/eslint-comments/require-description": "error",
    },
  },
];

export default baseConfig;
