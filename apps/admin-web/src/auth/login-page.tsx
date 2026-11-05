import { isAxiosError } from "axios";
import { useRef, useState } from "react";
import type { FormEvent } from "react";

type Props = {
  login: (email: string, password: string) => Promise<boolean>;
  onSuccess: () => void;
};

export const LoginPage = ({ login, onSuccess }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      if (await login(email, password)) onSuccess();
      else setError("ログインできませんでした");
    } catch (failure) {
      if (isAxiosError(failure) && !failure.response) {
        setError("ログインできませんでした。通信状態を確認してください。");
      } else if (isAxiosError(failure) && failure.response && failure.response.status >= 500) {
        setError("ログインできませんでした。時間をおいて再試行してください。");
      } else {
        setError("ログインできませんでした");
      }
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };
  return (
    <>
      <h1>{"ログイン"}</h1>
      <form
        aria-label={"ログイン"}
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
        {error && <p role={"alert"}>{error}</p>}

        <button type={"submit"} disabled={pending}>
          {"ログイン"}
        </button>
      </form>
    </>
  );
};
