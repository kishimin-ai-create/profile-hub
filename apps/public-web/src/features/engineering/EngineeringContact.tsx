import { useQuery } from "@tanstack/react-query";
import { customInstance } from "../../api/mutator/custom-instance";
import { QueryState } from "../../components/QueryState";

type Contact = { id: string; label: string; description: string; url: string };
const readContacts = async (): Promise<Contact[]> => {
  const result: unknown = await customInstance({
    url: "/api/public/profile",
    method: "GET",
    baseURL: import.meta.env.VITE_API_URL || "",
  });
  if (typeof result !== "object" || result === null || !("data" in result))
    throw new Error("Invalid response");
  const data: unknown = result.data;
  if (
    typeof data !== "object" ||
    data === null ||
    !("links" in data) ||
    typeof data.links !== "object" ||
    data.links === null ||
    !("engineering" in data.links) ||
    !Array.isArray(data.links.engineering)
  )
    throw new Error("Invalid links");
  const entries: unknown[] = data.links.engineering;
  return entries.flatMap((entry) => {
    if (
      typeof entry !== "object" ||
      entry === null ||
      !("kind" in entry) ||
      typeof entry.kind !== "string"
    )
      throw new Error("Invalid link");
    const kind = entry.kind.toLowerCase();
    if (kind !== "github" && kind !== "articles") return [];
    if (
      !("id" in entry) ||
      typeof entry.id !== "string" ||
      !("url" in entry) ||
      typeof entry.url !== "string" ||
      !/^https?:\/\//i.test(entry.url)
    )
      throw new Error("Invalid URL");
    const url = new URL(entry.url);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Invalid URL");
    return [
      {
        id: entry.id,
        label: kind === "github" ? "GitHub" : "Articles",
        description:
          kind === "github" ? "コードと個人制作を紹介しています。" : "技術記事を公開しています。",
        url: url.href,
      },
    ];
  });
};

export const EngineeringContact = () => {
  const query = useQuery({ queryKey: ["engineering-contact"], queryFn: readContacts });
  return (
    <>
      <h1>{"Engineering Contact"}</h1>
      <QueryState query={query}>
        {query.data?.length ? (
          <ul>
            {query.data.map((contact) => (
              <li key={contact.id}>
                <a href={contact.url} target={"_blank"} rel={"noopener noreferrer"}>
                  {contact.label}
                </a>
                <p>{contact.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>{"連絡先はまだありません。"}</p>
        )}
      </QueryState>
    </>
  );
};
