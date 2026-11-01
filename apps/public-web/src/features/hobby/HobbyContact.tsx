import { useQuery } from "@tanstack/react-query";
import { customInstance } from "../../api/mutator/custom-instance";
import { QueryState } from "../../components/QueryState";

const readHobbyContact = async (): Promise<string | null> => {
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
    !("hobby" in data.links) ||
    !Array.isArray(data.links.hobby)
  )
    throw new Error("Invalid links");
  const links: unknown[] = data.links.hobby;
  const link = links.find(
    (entry) =>
      typeof entry === "object" &&
      entry !== null &&
      "kind" in entry &&
      typeof entry.kind === "string" &&
      entry.kind.toLowerCase() === "x",
  );
  if (!link) return null;
  if (
    typeof link !== "object" ||
    !("url" in link) ||
    typeof link.url !== "string" ||
    !/^https?:\/\//i.test(link.url)
  )
    throw new Error("Invalid URL");
  const url = new URL(link.url);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Invalid URL");
  return url.href;
};

export const HobbyContact = () => {
  const query = useQuery({ queryKey: ["hobby-contact"], queryFn: readHobbyContact });
  return (
    <>
      <h1>{"Hobby Contact"}</h1>
      <QueryState query={query}>
        {query.data ? (
          <a href={query.data} target={"_blank"} rel={"noopener noreferrer"}>
            {"X"}
          </a>
        ) : (
          <p>{"連絡先はまだありません。"}</p>
        )}
      </QueryState>
    </>
  );
};
