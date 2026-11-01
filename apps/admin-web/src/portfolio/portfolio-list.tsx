import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export type PortfolioRow = { id: string; name: string; section: "engineering" | "hobby" };
type Props = {
  load: () => Promise<PortfolioRow[]>;
  remove?: (id: string) => Promise<void>;
  renderEdit?: (row: PortfolioRow) => ReactNode;
  reorder?: (section: PortfolioRow["section"], ids: string[]) => Promise<void>;
};
type State =
  | { status: "loading" }
  | { status: "error"; source: Props["load"] }
  | { status: "ready"; source: Props["load"]; rows: PortfolioRow[] };

export const PortfolioList = ({ load, remove, renderEdit, reorder }: Props) => {
  const [state, setState] = useState<State>({ status: "loading" });
  const [section, setSection] = useState("all");
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [reorderError, setReorderError] = useState(false);
  const pending = useRef(false);
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
  const deleteEntry = async (row: PortfolioRow) => {
    if (!remove || pending.current || !window.confirm(`「${row.name}」を完全に削除しますか？`))
      return;
    pending.current = true;
    setBusy(true);
    setDeleteError(false);
    try {
      await remove(row.id);
      setState((previous) =>
        previous.status === "ready" && previous.source === load
          ? { ...previous, rows: previous.rows.filter((entry) => entry.id !== row.id) }
          : previous,
      );
    } catch {
      setDeleteError(true);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const moveEntry = async (row: PortfolioRow, direction: -1 | 1) => {
    if (!reorder || pending.current || current.status !== "ready") return;
    const sectionRows = current.rows.filter((entry) => entry.section === row.section);
    const from = sectionRows.findIndex((entry) => entry.id === row.id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= sectionRows.length) return;
    const next = sectionRows.map((entry, index) =>
      index === from
        ? (sectionRows[to] ?? entry)
        : index === to
          ? (sectionRows[from] ?? entry)
          : entry,
    );
    pending.current = true;
    setBusy(true);
    setReorderError(false);
    try {
      await reorder(
        row.section,
        next.map((entry) => entry.id),
      );
      setState((previous) =>
        previous.status === "ready" && previous.source === load
          ? {
              ...previous,
              rows: previous.rows.map((entry) =>
                entry.section === row.section
                  ? (next[sectionRows.findIndex((original) => original.id === entry.id)] ?? entry)
                  : entry,
              ),
            }
          : previous,
      );
    } catch {
      setReorderError(true);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
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
      {deleteError && <p role={"alert"}>{"作品を削除できませんでした"}</p>}
      {reorderError && <p role={"alert"}>{"並べ替えできませんでした"}</p>}
      {current.status === "ready" &&
        (rows.length === 0 ? (
          <p>{"作品がありません"}</p>
        ) : (
          <ul aria-label={"作品一覧"}>
            {rows.map((row) => (
              <li key={row.id}>
                <span>{row.name}</span> <span>{row.section}</span>
                {renderEdit?.(row)}
                {reorder && (
                  <>
                    <button
                      type={"button"}
                      disabled={
                        busy ||
                        (current.status === "ready" &&
                          current.rows.filter((entry) => entry.section === row.section)[0]?.id ===
                            row.id)
                      }
                      onClick={() => {
                        void moveEntry(row, -1);
                      }}
                    >{`${row.name} を上へ`}</button>
                    <button
                      type={"button"}
                      disabled={
                        busy ||
                        (current.status === "ready" &&
                          current.rows.filter((entry) => entry.section === row.section).slice(-1)[0]
                            ?.id === row.id)
                      }
                      onClick={() => {
                        void moveEntry(row, 1);
                      }}
                    >{`${row.name} を下へ`}</button>
                  </>
                )}
                {remove && (
                  <button
                    type={"button"}
                    disabled={busy}
                    onClick={() => {
                      void deleteEntry(row);
                    }}
                  >{`${row.name} を削除`}</button>
                )}
              </li>
            ))}
          </ul>
        ))}
    </>
  );
};
