import { useQuery } from "@tanstack/react-query";
import { customInstance } from "../../api/mutator/custom-instance";
import { QueryState } from "../../components/QueryState";

type Favourite = { id: string; name: string; description: string; link: string };
const readFavourites = async (): Promise<Favourite[]> => {
  const result: unknown = await customInstance({
    url: "/api/public/favourites",
    method: "GET",
    baseURL: import.meta.env.VITE_API_URL || "",
  });
  if (
    typeof result !== "object" ||
    result === null ||
    !("data" in result) ||
    !Array.isArray(result.data)
  )
    throw new Error("Invalid response");
  const entries: unknown[] = result.data;
  return entries.map((entry) => {
    if (
      typeof entry !== "object" ||
      entry === null ||
      !("id" in entry) ||
      typeof entry.id !== "string" ||
      !("name" in entry) ||
      typeof entry.name !== "string" ||
      !("description" in entry) ||
      typeof entry.description !== "string" ||
      !("link" in entry) ||
      typeof entry.link !== "string" ||
      !/^https?:\/\//i.test(entry.link)
    )
      throw new Error("Invalid favourite");
    const url = new URL(entry.link);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Invalid URL");
    return { id: entry.id, name: entry.name, description: entry.description, link: url.href };
  });
};

export const HobbyFavourites = () => {
  const query = useQuery({ queryKey: ["public-favourites"], queryFn: readFavourites });
  return (
    <section className={"hobby-favourites"}>
      <h2>{"お気に入り"}</h2>
      <QueryState query={query}>
        {query.data?.length ? (
          <ul className={"hobby-favourites-list"}>
            {query.data.map((entry) => (
              <li key={entry.id}>
                <a href={entry.link} target={"_blank"} rel={"noopener noreferrer"}>
                  {entry.name}
                </a>
                <p>{entry.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>{"お気に入りはまだありません。"}</p>
        )}
      </QueryState>
    </section>
  );
};
