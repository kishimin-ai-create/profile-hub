# @profile-hub/config

The lint, formatting, and TypeScript baselines shared by every workspace.

The ruleset is ported from [mojica](https://github.com/kishimin/mojica). It lives here rather than
in each application because the public site and the administrator console would otherwise drift
apart the first time one of them was relaxed to get a change through.

## What this exports

| Subpath            | Contents                                                            |
| ------------------ | ------------------------------------------------------------------- |
| `./eslint/base`    | Rules every workspace shares regardless of framework                |
| `./eslint/react`   | `createReactConfig({ tsconfigRootDir })` for the React applications |
| `./oxlint`         | The oxlint rule set each application copies into `.oxlintrc.json`   |
| `./markuplint`     | The markuplint configuration for JSX markup checks                  |
| `./prettier`       | The Prettier options mirrored by the repository root                |
| `./tsconfig/base`  | Strict TypeScript defaults                                          |
| `./tsconfig/react` | `./tsconfig/base` plus DOM libraries and the JSX runtime            |

## Custom rules

`eslint/rules/` holds four rules with no upstream equivalent. `eslint/rules.test.mjs` covers each of
them, and CI runs it, because these rules exist in one place only — a regression here weakens every
application at once.

| Rule                                     | What it enforces                                            |
| ---------------------------------------- | ----------------------------------------------------------- |
| `prefer-object-derived-union`            | String unions derive from an `as const` object              |
| `prefer-named-exports-in-utils`          | No default exports under `utils/`                           |
| `limit-props-keys`                       | A `*Props` type carries at most five keys                   |
| `require-blank-line-between-form-fields` | Direct children of a `<form>` are separated by a blank line |

mojica's fifth rule, `prefer-generated-image-msw-handler`, is not ported. It matches the literal
string `http.post("*/images"`, which is mojica's image-generation endpoint; profile-hub has no
equivalent concept for it to protect.

## Architectural boundaries

`eslint-plugin-boundaries` enforces the unidirectional layering:

- `shared/` must not depend on `features/` or `app/`
- `features/<feature>` must not import another feature
- nothing may import `app/`

The shared layer covers
`src/{api,assets,components,hooks,i18n,images,lib,models,providers,schemas,styles,theme,types,utils,tests}`.
A directory outside that list is unclassified, and an unclassified directory is not checked at all —
so adding a new top-level directory under `src/` means adding it here too.

## Changing a rule

Change it here, never by relaxing an application's own configuration. Run the rule tests afterwards:

```bash
bun run test
```
