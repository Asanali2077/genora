export type EconInput = {
  cac: number; // стоимость привлечения одного пользователя (установка/визит)
  crToTrial: number; // доля пользователей, стартовавших триал
  crTrialToPaid: number; // доля триала, перешедшая в оплату
  monthlyPrice: number;
  monthlyChurn: number;
  grossMargin: number;
};

export type EconResult = {
  payRate: number; // пользователь → платящий
  cacPaid: number; // стоимость платящего клиента
  arpu: number; // валовая выручка на платящего в месяц
  lifetimeMonths: number;
  ltv: number; // валовая прибыль за жизнь клиента
  ltvCac: number;
  paybackMonths: number;
  verdict: "great" | "ok" | "bad";
};

export function calcEconomics(i: EconInput): EconResult {
  const payRate = i.crToTrial * i.crTrialToPaid;
  const cacPaid = payRate > 0 ? i.cac / payRate : Infinity;
  const arpu = i.monthlyPrice;
  const lifetimeMonths = 1 / Math.max(i.monthlyChurn, 0.001);
  const monthlyProfit = arpu * i.grossMargin;
  const ltv = monthlyProfit * lifetimeMonths;
  const ltvCac = Number.isFinite(cacPaid) && cacPaid > 0 ? ltv / cacPaid : 0;
  const paybackMonths = monthlyProfit > 0 && Number.isFinite(cacPaid) ? cacPaid / monthlyProfit : Infinity;
  return { payRate, cacPaid, arpu, lifetimeMonths, ltv, ltvCac, paybackMonths, verdict: ltvCac >= 3 ? "great" : ltvCac >= 1.5 ? "ok" : "bad" };
}
