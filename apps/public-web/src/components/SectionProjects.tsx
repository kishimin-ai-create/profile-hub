import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { customInstance } from "../api/mutator/custom-instance";
import { QueryState } from "./QueryState";

type Project = {
  id: string;
  name: string;
  summary: string;
  technologies: string[];
  repository: string | null;
  demo: string | null;
  image: string | null;
};
const optionalUrl = (value: unknown): string | null => {
  if (value === null) return null;
  if (typeof value !== "string" || !/^https?:\/\//i.test(value)) throw new Error("Invalid URL");
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Invalid URL");
  return url.href;
};
const readProjects = async (section: "engineering" | "hobby"): Promise<Project[]> => {
  const result: unknown = await customInstance({
    url: "/api/public/portfolio",
    method: "GET",
    baseURL: import.meta.env.VITE_API_URL || "",
    params: { section },
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
      !("section" in entry) ||
      entry.section !== section ||
      !("name" in entry) ||
      typeof entry.name !== "string" ||
      !("summary" in entry) ||
      typeof entry.summary !== "string" ||
      !("technologies" in entry) ||
      !Array.isArray(entry.technologies) ||
      !entry.technologies.every((value: unknown) => typeof value === "string") ||
      !("repositoryUrl" in entry) ||
      !("demoUrl" in entry) ||
      !("imageUrl" in entry)
    )
      throw new Error("Invalid project");
    return {
      id: entry.id,
      name: entry.name,
      summary: entry.summary,
      technologies: entry.technologies,
      repository: optionalUrl(entry.repositoryUrl),
      demo: optionalUrl(entry.demoUrl),
      image: optionalUrl(entry.imageUrl),
    };
  });
};
const ProjectImage = ({ name, url }: { name: string; url: string }) => {
  const [failed, setFailed] = useState(false);
  return failed ? null : (
    <img
      className={"project-image"}
      src={url}
      alt={`${name} の画像`}
      loading={"lazy"}
      onError={() => {
        setFailed(true);
      }}
    />
  );
};
export const SectionProjects = ({ section }: { section: "engineering" | "hobby" }) => {
  const query = useQuery({
    queryKey: ["section-projects", section],
    queryFn: () => readProjects(section),
  });
  return (
    <section className={section === "engineering" ? "engineering-projects" : undefined}>
      <h2>{"作品"}</h2>
      <QueryState query={query}>
        {query.data?.length ? (
          <ul>
            {query.data.map((project) => (
              <li key={project.id}>
                <h3>{project.name}</h3>
                {project.image && (
                  <ProjectImage key={project.image} name={project.name} url={project.image} />
                )}
                <p className={"project-summary"}>{project.summary}</p>
                <p className={"project-technologies"}>{project.technologies.join("、")}</p>
                {(project.repository || project.demo) && (
                  <div className={"project-links"}>
                    {project.repository && (
                      <a
                        href={project.repository}
                        target={"_blank"}
                        rel={"noopener noreferrer"}
                        aria-label={`${project.name} のリポジトリ`}
                      >
                        {"リポジトリ"}
                      </a>
                    )}
                    {project.demo && (
                      <a
                        href={project.demo}
                        target={"_blank"}
                        rel={"noopener noreferrer"}
                        aria-label={`${project.name} のデモ`}
                      >
                        {"デモ"}
                      </a>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>{"作品はまだありません。"}</p>
        )}
      </QueryState>
    </section>
  );
};
