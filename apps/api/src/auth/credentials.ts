type Account = { id: string; email: string; passwordHash: string; sessionVersion: number };
type Identity = Omit<Account, "passwordHash">;

/** Verifies credentials without disclosing whether an account exists. */
export async function authenticateCredentials(
  email: string,
  password: string,
  findAccount: (email: string) => Promise<Account | null>,
  verify: (password: string, hash: string) => Promise<boolean>,
  dummyHash: string,
): Promise<Identity | null> {
  const account = await findAccount(email);
  const valid = await verify(password, account?.passwordHash ?? dummyHash);
  if (!account || !valid) return null;
  return { id: account.id, email: account.email, sessionVersion: account.sessionVersion };
}
