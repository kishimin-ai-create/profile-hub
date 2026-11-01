export const browserTestDatabaseUrl = (
  value: string | undefined,
  required = false,
): string | null => {
  if (value === undefined) {
    if (required) throw new Error("Public browser test database is required");
    return null;
  }
  const url = (() => {
    try {
      return new URL(value);
    } catch {
      throw new Error("Public browser database must be a dedicated local test database");
    }
  })();
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !["localhost", "127.0.0.1"].includes(url.hostname) ||
    url.pathname !== "/profile_hub_public_browser_test" ||
    url.search !== "" ||
    url.hash !== ""
  )
    throw new Error("Public browser database must be a dedicated local test database");
  return value;
};
