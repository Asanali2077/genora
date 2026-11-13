"use client";

import dynamic from "next/dynamic";

// ssr:false — квиз читает localStorage при инициализации, это исключает рассинхрон гидрации.
const QuizEngine = dynamic(() => import("./quiz-engine"), { ssr: false });

export function QuizLoader() {
  return <QuizEngine />;
}
