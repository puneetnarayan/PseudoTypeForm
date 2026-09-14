import { notFound } from "next/navigation";
import { getForm } from "@/lib/db";
import FormBuilder from "@/components/builder/FormBuilder";

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const form = await getForm(id);
  if (!form) notFound();

  return <FormBuilder form={form} />;
}
