import type { Metadata } from "next";
import { requireHousehold } from "@/lib/services/access";
import { PageHeader } from "@/components/app/shell";
import { AskChat } from "@/components/ask/chat";

export const metadata: Metadata = { title: "Ask Genora — Genora" };
export const dynamic = "force-dynamic";

export default async function AskPage({ searchParams }: PageProps<"/app/ask">) {
  const q = (await searchParams).q;
  const { household } = await requireHousehold();
  const kid = household.profile.children[0]?.name || "my kid";
  return (
    <>
      <PageHeader title="Ask Genora" sub="Questions about the FSA, the credit, camps or deadlines, answered from your family's numbers." />
      <div className="max-w-4xl px-5 py-8 md:px-10">
        <AskChat initialQuestion={typeof q === "string" ? q.slice(0, 500) : undefined} suggestions={["Why is the FSA better for us than the tax credit?", `Can I pay for ${kid}'s summer camp with my FSA?`, "What happens if I don't use all my FSA money?"]} />
      </div>
    </>
  );
}
