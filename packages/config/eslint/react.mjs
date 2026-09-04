import js from "@eslint/js";
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import vitest from "@vitest/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";
import boundaries from "eslint-plugin-boundaries";
import importPlugin from "eslint-plugin-import";
import jsdocPlugin from "eslint-plugin-jsdoc";
import oxlint from "eslint-plugin-oxlint";
import react from "eslint-plugin-react";
import storybook from "eslint-plugin-storybook";
import testingLibrary from "eslint-plugin-testing-library";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tseslint from "typescript-eslint";

import limitPropsKeys from "./rules/limit-props-keys.mjs";
import preferNamedExportsInUtils from "./rules/prefer-named-exports-in-utils.mjs";
import preferObjectDerivedUnion from "./rules/prefer-object-derived-union.mjs";
import requireBlankLineBetweenFormFields from "./rules/require-blank-line-between-form-fields.mjs";

/**
 * Directories that make up the unidirectional layers. `app/` and `features/`
 * are declared separately; everything listed here is shared ground that both
 * may depend on.
 *
 * `gen/` is deliberately absent. Generated output is already ignored, and
 * leaving it unclassified keeps it importable from anywhere without a policy.
 */
const sharedDirectories = [
  "api",
  "assets",
  "components",
  "hooks",
  "i18n",
  "images",
  "lib",
  "models",
  "providers",
  "schemas",
  "styles",
  "theme",
  "types",
  "utils",
  "tests",
].join(",");

/**
 * Builds the shared React lint configuration for one application.
 *
 * @param {{ tsconfigRootDir: string, oxlintConfigPath?: string }} options
 *   `tsconfigRootDir` must be the consuming application's directory, because
 *   type-aware linting resolves the TypeScript project from it.
 */
export const createReactConfig = ({ tsconfigRootDir, oxlintConfigPath = "./.oxlintrc.json" }) =>
  defineConfig([
    globalIgnores([
      "dist",
      "coverage/**",
      "storybook-static/**",
      "playwright-report/**",
      "public/mockServiceWorker.js",
      "src/api/endpoints/**",
      "src/models/**",
      "src/gen/**",
      "reports/**",
    ]),

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

    {
      files: ["**/*.{ts,tsx}"],
      extends: [
        js.configs.recommended,
        tseslint.configs.recommended,
        tseslint.configs.recommendedTypeChecked,
        react.configs.flat.recommended,
        importPlugin.flatConfigs.recommended,
        importPlugin.flatConfigs.typescript,
      ],
      settings: {
        react: { version: "detect" },
        "import/resolver": { typescript: true, node: true },
      },
      languageOptions: {
        ecmaVersion: 2020,
        globals: globals.browser,
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
      rules: {
        "local/prefer-object-derived-union": "error",
        "local/prefer-named-exports-in-utils": "error",
        "local/limit-props-keys": "error",
        "local/require-blank-line-between-form-fields": "error",
        "max-params": ["error", 5],
        "no-console": "warn",
        "no-restricted-syntax": [
          "error",
          {
            selector: "FunctionDeclaration, FunctionExpression",
            message: "Use an arrow function instead.",
          },
          {
            selector: "MemberExpression[object.name='React']",
            message: "Import React APIs directly instead of using the React namespace.",
          },
          {
            selector: "JSXAttribute[value.type='Literal']",
            message: "Wrap JSX string attributes in braces.",
          },
          {
            selector: "JSXText[value=/\\S/]",
            message: "Wrap JSX text in braces.",
          },
          {
            selector: "VariableDeclaration[kind='let']",
            message: "Use const instead of let.",
          },
        ],
        camelcase: ["warn", { properties: "never" }],
        "@typescript-eslint/switch-exhaustiveness-check": "warn",
        "@typescript-eslint/no-explicit-any": "error",
        // Promise-returning operations must be observed so user actions and
        // asynchronous side effects cannot fail silently.
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-misused-promises": "error",
        "@typescript-eslint/no-unnecessary-type-assertion": "off",
        "import/order": [
          "error",
          {
            alphabetize: { order: "asc", caseInsensitive: true },
            "newlines-between": "never",
          },
        ],
        "react/jsx-key": ["error", { checkFragmentShorthand: true }],
        "react/react-in-jsx-scope": 0,
        "react/jsx-uses-react": 0,
      },
      plugins: {
        local: {
          rules: {
            "prefer-object-derived-union": preferObjectDerivedUnion,
            "prefer-named-exports-in-utils": preferNamedExportsInUtils,
            "limit-props-keys": limitPropsKeys,
            "require-blank-line-between-form-fields": requireBlankLineBetweenFormFields,
          },
        },
      },
    },

    // Pure utility functions stay small; React components and test bodies are
    // intentionally outside this rule's scope.
    {
      files: ["src/**/utils/**/*.{ts,tsx}"],
      ignores: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
      rules: {
        "max-lines-per-function": ["error", { max: 30, skipBlankLines: true, skipComments: true }],
      },
    },

    // Feature UI components consume UI-owned types; generated API models stay
    // at the feature boundary where request mapping is performed.
    {
      files: ["src/features/*/components/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["@/models/*"],
                message: "UI components must use UI-owned types instead of generated API models.",
              },
            ],
          },
        ],
      },
    },

    // bulletproof-react style architectural boundaries: shared/ never depends
    // on features/ or app/, features/<feature> never imports another feature,
    // and nothing depends on app/.
    {
      files: ["src/**/*.{ts,tsx}"],
      plugins: { boundaries },
      settings: {
        "boundaries/elements": [
          { type: "app", pattern: "src/app/**" },
          {
            type: "feature",
            pattern: "src/features/(*)/**",
            capture: ["featureName"],
          },
          { type: "shared", pattern: `src/{${sharedDirectories}}/**` },
        ],
      },
      rules: {
        "boundaries/dependencies": [
          "error",
          {
            default: "disallow",
            policies: [
              {
                from: { element: { type: "shared" } },
                allow: { to: { element: { type: "shared" } } },
                message:
                  "shared/ code must not depend on features/ or app/ (unidirectional architecture).",
              },
              {
                from: { element: { type: "feature" } },
                allow: {
                  to: {
                    element: [
                      { type: "shared" },
                      {
                        type: "feature",
                        captured: { featureName: "{{from.featureName}}" },
                      },
                    ],
                  },
                },
                message:
                  "features/<feature> must not import from another feature; only from shared/ or the same feature.",
              },
              {
                from: { element: { type: "app" } },
                allow: {
                  to: { element: { types: { anyOf: ["shared", "feature"] } } },
                },
                message: "app/ may import shared/ and features/, but nothing may import app/.",
              },
            ],
          },
        ],
      },
    },

    {
      files: [
        "src/**/*.{small,medium,large}.test.{ts,tsx}",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/**/__tests__/**/*.{ts,tsx}",
        "src/**/tests/**/**/*.{ts,tsx}",
      ],
      ...testingLibrary.configs["flat/react"],
      plugins: {
        ...testingLibrary.configs["flat/react"].plugins,
        vitest,
      },
      rules: {
        ...testingLibrary.configs["flat/react"].rules,
        ...vitest.configs.recommended.rules,
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "vitest/max-nested-describe": ["error", { max: 3 }],
        "vitest/consistent-test-it": ["error", { fn: "test", withinDescribe: "test" }],
        "vitest/no-focused-tests": "error",
        "vitest/no-disabled-tests": "warn",
        "vitest/require-mock-type-parameters": "error",
      },
      settings: { vitest: { typecheck: true } },
      languageOptions: { globals: { ...vitest.environments.env.globals } },
    },

    ...storybook.configs["flat/recommended"],

    jsdocPlugin.configs["flat/recommended"],
    {
      rules: {
        "jsdoc/require-param": "off",
        "jsdoc/require-returns": "off",
        "jsdoc/require-description": "off",
        "jsdoc/check-values": ["error", { allowedLicenses: ["MIT", "ISC"] }],
        "jsdoc/require-jsdoc": [
          "error",
          {
            publicOnly: true,
            require: {
              FunctionDeclaration: true,
              MethodDefinition: true,
              ClassDeclaration: true,
            },
          },
        ],
      },
      settings: {
        structuredTags: {
          see: { name: "namepath-referencing", required: ["name"] },
        },
      },
    },

    {
      files: ["*.config.{js,mjs,ts,mts}", ".storybook/main.ts", "src/tests/setup.ts"],
      extends: [tseslint.configs.disableTypeChecked],
      languageOptions: { globals: globals.node },
      rules: {
        "testing-library/prefer-screen-queries": "off",
      },
    },

    // Prettier must be last, before oxlint takes over disabling its own rules.
    prettier,

    // Turn off every rule oxlint already covers so the same violation is not
    // reported twice; `lint` runs `oxlint` before `eslint`.
    ...oxlint.buildFromOxlintConfigFile(oxlintConfigPath),
  ]);

export default createReactConfig;
