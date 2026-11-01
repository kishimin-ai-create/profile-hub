import { useQuery } from "@tanstack/react-query";
import { customInstance } from "../../api/mutator/custom-instance";
import { QueryState } from "../../components/QueryState";

type Profile = { name: string; title: string | null; bio: string | null };

const readProfile = async (): Promise<Profile | null> => {
  const response: unknown = await customInstance({
    url: "/api/public/profile",
    method: "GET",
    baseURL: import.meta.env.VITE_API_URL || "",
  });
  if (typeof response !== "object" || response === null || !("data" in response))
    throw new Error("Invalid response");
  const data: unknown = response.data;
  if (typeof data !== "object" || data === null || !("profile" in data))
    throw new Error("Invalid profile");
  const profile: unknown = data.profile;
  if (profile === null) return null;
  if (
    typeof profile !== "object" ||
    !("name" in profile) ||
    typeof profile.name !== "string" ||
    !("title" in profile) ||
    !("bio" in profile) ||
    (profile.title !== null && typeof profile.title !== "string") ||
    (profile.bio !== null && typeof profile.bio !== "string")
  )
    throw new Error("Invalid profile");
  return { name: profile.name, title: profile.title, bio: profile.bio };
};

export const HomeProfile = () => {
  const query = useQuery({ queryKey: ["public-profile"], queryFn: readProfile });
  return (
    <QueryState query={query}>
      {query.data ? (
        <section aria-label={"プロフィール"}>
          <p>{query.data.name}</p>
          {query.data.title && <p>{query.data.title}</p>}
          {query.data.bio && <p>{query.data.bio}</p>}
        </section>
      ) : (
        <p>{"プロフィールはまだありません。"}</p>
      )}
    </QueryState>
  );
};
