import { listForms } from "@/lib/db";
import FormCard from "@/components/FormCard";
import NewFormCard from "@/components/NewFormCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const forms = await listForms();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <header className="mb-12 flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">PseudoTypeForm</h1>
        <p className="text-black/50">
          Build conversational, one-question-at-a-time forms — and see the
          answers roll in.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NewFormCard />
        {forms.map((form) => (
          <FormCard key={form.id} form={form} />
        ))}
      </div>
    </main>
  );
}
