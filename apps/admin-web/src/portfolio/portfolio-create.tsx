import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { z } from "zod";

const sectionSchema = z.enum(["engineering", "hobby"]);
type PortfolioInput = {
  section: "engineering" | "hobby";
  name: string;
  summary: string;
  technologies: string[];
  displayOrder: number;
};
type Props = { save: (value: PortfolioInput) => Promise<void>; onSuccess: () => void };

export const PortfolioCreate = ({ save, onSuccess }: Props) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const submitting = useRef(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    const data = new FormData(event.currentTarget);
    const text = (key: string) => {
      const value = data.get(key);
      return typeof value === "string" ? value.trim() : "";
    };
    const section = sectionSchema.safeParse(text("section"));
    const technologies = text("technologies")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const order = text("displayOrder");
    if (
      !section.success ||
      !text("name") ||
      !text("summary") ||
      !technologies.length ||
      !order ||
      !Number.isInteger(Number(order))
    ) {
      setError(true);
      return;
    }
    submitting.current = true;
    setPending(true);
    setError(false);
    try {
      await save({
        section: section.data,
        name: text("name"),
        summary: text("summary"),
        technologies,
        displayOrder: Number(order),
      });
      onSuccess();
    } catch {
      setError(true);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  };
  return (
    <>
      <h1>{"作品を作成"}</h1>
      <form
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <label htmlFor={"section"}>{"セクション"}</label>

        <select id={"section"} name={"section"} defaultValue={""} required>
          <option value={""}>{"選択してください"}</option>
          <option value={"engineering"}>{"engineering"}</option>
          <option value={"hobby"}>{"hobby"}</option>
        </select>

        <label htmlFor={"name"}>{"作品名"}</label>

        <input id={"name"} name={"name"} maxLength={200} required />

        <label htmlFor={"summary"}>{"概要"}</label>

        <textarea id={"summary"} name={"summary"} maxLength={4000} required />

        <label htmlFor={"technologies"}>{"技術（カンマ区切り）"}</label>

        <input id={"technologies"} name={"technologies"} required />

        <label htmlFor={"displayOrder"}>{"表示順"}</label>

        <input
          id={"displayOrder"}
          name={"displayOrder"}
          type={"number"}
          min={-2147483648}
          max={2147483647}
          required
        />

        {error && <p role={"alert"}>{"作品を保存できませんでした"}</p>}

        <button type={"submit"} disabled={pending}>
          {"作成"}
        </button>
      </form>
    </>
  );
};
