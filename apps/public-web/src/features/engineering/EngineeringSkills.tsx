import { useQuery } from "@tanstack/react-query";
import { customInstance } from "../../api/mutator/custom-instance";
import { QueryState } from "../../components/QueryState";

type Skill = { id: string; name: string };
const readSkills = async (): Promise<Skill[]> => {
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
    !("skills" in data) ||
    !Array.isArray(data.skills)
  )
    throw new Error("Invalid skills");
  const skills: unknown[] = data.skills;
  return skills.map((skill) => {
    if (
      typeof skill !== "object" ||
      skill === null ||
      !("id" in skill) ||
      typeof skill.id !== "string" ||
      !("name" in skill) ||
      typeof skill.name !== "string"
    )
      throw new Error("Invalid skill");
    return { id: skill.id, name: skill.name };
  });
};
export const EngineeringSkills = () => {
  const query = useQuery({ queryKey: ["engineering-skills"], queryFn: readSkills });
  return (
    <section>
      <h2>{"技術スタック"}</h2>
      <QueryState query={query}>
        {query.data?.length ? (
          <ul aria-label={"技術スタック"}>
            {query.data.map((skill) => (
              <li key={skill.id}>{skill.name}</li>
            ))}
          </ul>
        ) : (
          <p>{"技術スタックはまだありません。"}</p>
        )}
      </QueryState>
    </section>
  );
};
