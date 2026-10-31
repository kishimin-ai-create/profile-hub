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
  repositoryUrl?: string;
  demoUrl?: string;
  imageUrl?: string;
};
type Props = {
  save: (value: PortfolioInput) => Promise<void>;
  onSuccess: () => void;
  onDirty?: () => void;
};

export const PortfolioCreate = ({ save, onSuccess, onDirty }: Props) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
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
    const links = ["repositoryUrl", "demoUrl", "imageUrl"];
    const invalidUrl = links.find((key) => {
      const value = text(key);
      if (!value) return false;
      try {
        const url = new URL(value);
        return url.protocol !== "http:" && url.protocol !== "https:";
      } catch {
        return true;
      }
    });
    setUrlError(invalidUrl ?? null);
    if (invalidUrl) return;
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
        ...(text("repositoryUrl") ? { repositoryUrl: text("repositoryUrl") } : {}),
        ...(text("demoUrl") ? { demoUrl: text("demoUrl") } : {}),
        ...(text("imageUrl") ? { imageUrl: text("imageUrl") } : {}),
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
        onChange={onDirty}
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <fieldset disabled={pending}>
          <legend>{"作品情報"}</legend>
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

          <label htmlFor={"repositoryUrl"}>{"リポジトリ URL"}</label>

          <input
            id={"repositoryUrl"}
            name={"repositoryUrl"}
            maxLength={2048}
            aria-invalid={urlError === "repositoryUrl"}
            aria-describedby={urlError === "repositoryUrl" ? "url-error" : undefined}
          />

          <label htmlFor={"demoUrl"}>{"デモ URL"}</label>

          <input
            id={"demoUrl"}
            name={"demoUrl"}
            maxLength={2048}
            aria-invalid={urlError === "demoUrl"}
            aria-describedby={urlError === "demoUrl" ? "url-error" : undefined}
          />

          <label htmlFor={"imageUrl"}>{"画像 URL"}</label>

          <input
            id={"imageUrl"}
            name={"imageUrl"}
            maxLength={2048}
            aria-invalid={urlError === "imageUrl"}
            aria-describedby={urlError === "imageUrl" ? "url-error" : undefined}
          />

          {urlError && (
            <p id={"url-error"} role={"alert"}>
              {"http または https の URL を入力してください"}
            </p>
          )}

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
        </fieldset>
      </form>
    </>
  );
};
