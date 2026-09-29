export function Sparkline({ values, width = 120, height = 32, color = "var(--text)" }: { values: number[]; width?: number; height?: number; color?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => [i * step, height - 3 - (v / max) * (height - 6)]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <path className="spark-fill" d={`${d} L${width},${height} L0,${height}Z`} fill={color} opacity="0.07" />
      <path className="spark-line" pathLength={1} d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// Buckets ISO timestamps into N daily counts ending today
export function dailyCounts(dates: string[], days: number) {
  const out = new Array(days).fill(0);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const t0 = start.getTime() - (days - 1) * 86400_000;
  for (const d of dates) {
    const i = Math.floor((new Date(d).getTime() - t0) / 86400_000);
    if (i >= 0 && i < days) out[i]++;
  }
  return out;
}
