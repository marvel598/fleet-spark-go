export function calcMonthlyPayment(
  price: number,
  downPayment: number,
  tradeIn: number,
  aprPct: number,
  termMonths: number,
): { monthly: number; totalInterest: number; totalCost: number; principal: number } {
  const principal = Math.max(0, price - downPayment - tradeIn);
  const r = aprPct / 100 / 12;
  let monthly = 0;
  if (principal === 0 || termMonths === 0) {
    monthly = 0;
  } else if (r === 0) {
    monthly = principal / termMonths;
  } else {
    monthly = (principal * r) / (1 - Math.pow(1 + r, -termMonths));
  }
  const totalCost = monthly * termMonths;
  const totalInterest = totalCost - principal;
  return {
    monthly: Math.round(monthly),
    totalInterest: Math.round(totalInterest),
    totalCost: Math.round(totalCost),
    principal,
  };
}

export const formatKES = (n: number) =>
  `KSh ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(n)}`;
