import { adminDeleteMedia, adminListMedia } from "./rpc/functions";

export type MediaFile = {
  name: string;
  url: string;
  size: number;
  modified: string;
};

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function listMedia(): Promise<{
  rows: MediaFile[];
  error: string | null;
}> {
  try {
    return await adminListMedia();
  } catch (error) {
    return { rows: [], error: message(error) };
  }
}

export async function deleteMedia(name: string): Promise<string | null> {
  try {
    return await adminDeleteMedia({ data: { name } });
  } catch (error) {
    return message(error);
  }
}
