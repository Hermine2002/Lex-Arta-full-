import { adminDeleteOverride, adminPutOverride } from "./rpc/functions";

export type PageOverride = {
  path: string;
  title: string | null;
  description: string | null;
  html: string | null;
  updated_at: string;
};

export type OverridePatch = {
  title?: string | null;
  description?: string | null;
  html?: string | null;
};

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

/** Admin write. Returns an error message or null. */
export async function saveOverride(
  path: string,
  patch: OverridePatch,
): Promise<string | null> {
  try {
    return await adminPutOverride({ data: { path, patch } });
  } catch (error) {
    return message(error);
  }
}

/** Removes the admin edit so the page falls back to the bundled content. */
export async function deleteOverride(path: string): Promise<string | null> {
  try {
    return await adminDeleteOverride({ data: { path } });
  } catch (error) {
    return message(error);
  }
}
