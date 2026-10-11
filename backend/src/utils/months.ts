/** First day (UTC) of the month `monthsBack` months ago. */
export function monthStart(monthsBack: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1));
}

/** The last `count` months as "YYYY-MM", oldest first. */
function monthKeys(count: number): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = monthStart(i);
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

/** Turns grouped SQL rows into one entry per month (missing months = 0). */
export function fillMonths(rows: { month: string; count: bigint | number | string | null }[], count: number): { month: string; count: number }[] {
  const byMonth = new Map(rows.map((r) => [r.month, Number(r.count ?? 0)]));
  return monthKeys(count).map((month) => ({ month, count: byMonth.get(month) ?? 0 }));
}
