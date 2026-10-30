import { useState } from "react";

type Props = { logout: () => Promise<void>; onSuccess: () => void };
export const Dashboard = ({ logout, onSuccess }: Props) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const signOut = async () => {
    if (pending) return;
    setPending(true);
    setError(false);
    try {
      await logout();
      onSuccess();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      <h1>{"ダッシュボード"}</h1>
      {error && (
        <p role={"alert"}>
          {"ログアウトを確認できませんでした。通信状態を確認して再試行してください。"}
        </p>
      )}
      <button
        type={"button"}
        disabled={pending}
        onClick={() => {
          void signOut();
        }}
      >
        {"ログアウト"}
      </button>
    </>
  );
};
