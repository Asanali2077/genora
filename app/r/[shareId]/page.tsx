import { notFound } from "next/navigation";
import { AnalyzeResultSchema } from "@/config/prompts/analyze";
import { getResultByShare } from "@/lib/store";
import { ResultView } from "@/components/result/result-view";

export const dynamic = "force-dynamic";

export default async function SharedResult({ params }: PageProps<"/r/[shareId]">) {
  const { shareId } = await params;
  const row = await getResultByShare(shareId);
  const parsed = AnalyzeResultSchema.safeParse(row?.result);
  if (!parsed.success) notFound();
  // Публичная версия: премиум-дни скрыты, кнопка ведёт в квиз.
  return <ResultView result={parsed.data} premium={false} readonly />;
}
