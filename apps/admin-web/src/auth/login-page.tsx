import { useState } from "react";
import type { FormEvent } from "react";

type Props = {
  login: (email: string, password: string) => Promise<boolean>;
  onSuccess: () => void;
};

export const LoginPage = ({ login, onSuccess }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(false);
    try {
      if (await login(email, password)) onSuccess();
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      <h1>{"ログイン"}</h1>
      <form
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <label htmlFor={"email"}>{"メールアドレス"}</label>

        <input
          id={"email"}
          type={"email"}
          autoComplete={"username"}
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <label htmlFor={"password"}>{"パスワード"}</label>

        <input
          id={"password"}
          type={"password"}
          autoComplete={"current-password"}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && <p role={"alert"}>{"ログインできませんでした"}</p>}

        <button type={"submit"} disabled={pending}>
          {"ログイン"}
        </button>
      </form>
    </>
  );
};
