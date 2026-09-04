## Title

Remove fullwidth characters from tracked text files

## Summary

Remove all Unicode characters classified with East Asian Width `W` or `F` from tracked UTF-8 text
files, excluding the protected `README.md` and `agents/` paths.

## Related Tasks

TBD

## What was done

- Removed 2,854 fullwidth or wide characters from 56 tracked text files.
- Removed trailing whitespace left behind by character deletion.
- Kept protected paths unchanged.
- Restored the binary favicon after excluding binary files from text processing.

## What is not included

- `README.md`
- Files under `agents/`
- Binary files

## Impact

Japanese text, wide symbols, and emoji were removed from affected agent definitions, skills, issue
templates, documentation, reviews, and templates.

## Testing

- Confirmed that no tracked UTF-8 text file outside protected paths contains Unicode East Asian
  Width `W` or `F` characters.
- Confirmed `git diff --check` succeeds.
- Parsed all changed GitHub Issue template YAML files successfully.

## Notes

The removal intentionally leaves some formerly Japanese-only fields empty.
