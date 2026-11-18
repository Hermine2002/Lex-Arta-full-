import {
  adminDeleteEnquiry,
  adminEnquiries,
  adminPatchEnquiry,
  submitEnquiry,
} from "./rpc/functions";

export type EnquiryInput = {
  first_name: string;
  last_name: string;
  country: string;
  email: string;
  phone: string;
  contacting_as: string;
  company_name: string;
  services: string[];
  description: string;
  source: string;
};

export type Enquiry = EnquiryInput & {
  id: string;
  created_at: string;
  status: "new" | "in_progress" | "done";
  notes: string | null;
};

export type EnquiryStatus = Enquiry["status"];

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

/** Public: stores the enquiry. Resolves false when the write fails. */
export async function createEnquiry(input: EnquiryInput): Promise<boolean> {
  try {
    return await submitEnquiry({ data: input });
  } catch {
    return false;
  }
}

export async function listEnquiries(): Promise<{
  rows: Enquiry[];
  error: string | null;
}> {
  try {
    return await adminEnquiries();
  } catch (error) {
    return { rows: [], error: message(error) };
  }
}

export async function updateEnquiry(
  id: string,
  patch: { status?: EnquiryStatus; notes?: string | null },
): Promise<string | null> {
  try {
    return await adminPatchEnquiry({ data: { id, patch } });
  } catch (error) {
    return message(error);
  }
}

export async function deleteEnquiry(id: string): Promise<string | null> {
  try {
    return await adminDeleteEnquiry({ data: { id } });
  } catch (error) {
    return message(error);
  }
}
