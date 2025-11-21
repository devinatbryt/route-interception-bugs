"use server";
import { redirect } from "next/navigation";
import { fromFormData, toSearchParams } from "./schema";

export async function redirectToSearch(prevState: any, formData: FormData) {
  const data = fromFormData(formData);
  const searchParams = toSearchParams(data);
  if (searchParams.size > 0) {
    redirect(`/search?${searchParams.toString()}`);
  }
  redirect(`/search`);
}
