import { useState } from "react";
import type { ReactNode } from "react";

type Props = { logout: () => Promise<void>; onSuccess: () => void; quickActions?: ReactNode };
export const Dashboard = ({ logout, onSuccess, quickActions }: Props) => {
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
      {quickActions}
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
