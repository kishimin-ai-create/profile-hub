import { useEffect, useState } from "react";

export type PortfolioRow = { id: string; name: string; section: "engineering" | "hobby" };
type Props = { load: () => Promise<PortfolioRow[]> };
type State =
  | { status: "loading" }
  | { status: "error"; source: Props["load"] }
  | { status: "ready"; source: Props["load"]; rows: PortfolioRow[] };

export const PortfolioList = ({ load }: Props) => {
  const [state, setState] = useState<State>({ status: "loading" });
  const [section, setSection] = useState("all");
  useEffect(() => {
    const lifecycle = { active: true };
    void load().then(
      (rows) => {
        if (lifecycle.active) setState({ status: "ready", source: load, rows });
      },
      () => {
        if (lifecycle.active) setState({ status: "error", source: load });
      },
    );
    return () => {
      lifecycle.active = false;
    };
  }, [load]);
  const current: State =
    state.status !== "loading" && state.source === load ? state : { status: "loading" };
  const rows =
    current.status === "ready"
      ? current.rows.filter((row) => section === "all" || row.section === section)
      : [];
  return (
    <>
      <h1>{"作品一覧"}</h1>
      <label htmlFor={"section"}>{"セクション"}</label>
      <select id={"section"} value={section} onChange={(event) => setSection(event.target.value)}>
        <option value={"all"}>{"すべて"}</option>
        <option value={"engineering"}>{"engineering"}</option>
        <option value={"hobby"}>{"hobby"}</option>
      </select>
      {current.status === "loading" && <p>{"読み込み中"}</p>}
      {current.status === "error" && <p role={"alert"}>{"作品を取得できませんでした"}</p>}
      {current.status === "ready" &&
        (rows.length === 0 ? (
          <p>{"作品がありません"}</p>
        ) : (
          <ul aria-label={"作品一覧"}>
            {rows.map((row) => (
              <li key={row.id}>
                <span>{row.name}</span> <span>{row.section}</span>
              </li>
            ))}
          </ul>
        ))}
    </>
  );
};
