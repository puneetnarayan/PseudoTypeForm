import { notFound } from "next/navigation";
import { getForm } from "@/lib/db";
import FormFiller from "@/components/filler/FormFiller";

export default async function FillFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const form = await getForm(id);
  if (!form) notFound();

  return <FormFiller form={form} />;
}
