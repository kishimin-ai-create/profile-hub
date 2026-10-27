import type { PageMetadataProps } from "../../components/PageMetadata";

const pages: Record<string, PageMetadataProps> = {
  "/": { title: "Home", description: "EngineeringとHobby、それぞれの入口。" },
  "/engineering": { title: "Engineering", description: "仕事・技術・制作について。" },
  "/engineering/contact": {
    title: "Engineering Contact",
    description: "仕事・技術に関する連絡先。",
  },
  "/hobby": { title: "Hobby", description: "好きなものや日々のこと。" },
  "/hobby/contact": { title: "Hobby Contact", description: "趣味に関する連絡先。" },
};

export const metadataForPath = (pathname: string): PageMetadataProps =>
  pages[pathname.replace(/\/+$/, "") || "/"] ?? {
    title: "ページが見つかりません",
    description: "指定されたページは見つかりませんでした。",
  };
