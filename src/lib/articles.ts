import type { ArticleView } from "@/data/insights";
import {
  adminDeleteArticle,
  adminListArticles,
  adminSaveArticle,
  adminUploadImage,
} from "./rpc/functions";

/** An article authored in the admin panel. Shares the bundled article shape. */
export type AdminArticle = ArticleView & {
  published: boolean;
  updated_at: string;
};

export type ArticleSection = ArticleView["sections"][number];
export type ArticleSource = ArticleView["sources"][number];

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function listArticles(): Promise<{
  rows: AdminArticle[];
  error: string | null;
}> {
  try {
    return await adminListArticles();
  } catch (error) {
    return { rows: [], error: message(error) };
  }
}

export async function saveArticle(
  article: AdminArticle,
): Promise<string | null> {
  try {
    return await adminSaveArticle({ data: { article } });
  } catch (error) {
    return message(error);
  }
}

export async function deleteArticle(slug: string): Promise<string | null> {
  try {
    return await adminDeleteArticle({ data: { slug } });
  } catch (error) {
    return message(error);
  }
}

export async function uploadImage(
  filename: string,
  dataUrl: string,
): Promise<{ url: string } | { error: string }> {
  try {
    return await adminUploadImage({ data: { filename, dataUrl } });
  } catch (error) {
    return { error: message(error) };
  }
}

/** A URL-safe slug from a title. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
