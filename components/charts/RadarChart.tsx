"use client";

interface RadarChartProps {
  labels: string[];
  /** 0–100 per axis, same order as labels */
  values: number[];
  /** optional second series (dashed), e.g. "first session" or "ideal" */
  compareValues?: number[];
  /** muted = gray baseline (past self); ideal = green aspiration */
  compareVariant?: "muted" | "ideal";
  size?: number;
}

/** Lightweight SVG radar ("web") chart — no chart library. */
export function RadarChart({
  labels,
  values,
  compareValues,
  compareVariant = "muted",
  size = 340,
}: RadarChartProps) {
  const n = labels.length;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 46; // leave room for labels

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, r: number): [number, number] => [
    cx + Math.cos(angle(i)) * r,
    cy + Math.sin(angle(i)) * r,
  ];

  const ringPath = (frac: number) =>
    labels
      .map((_, i) => {
        const [x, y] = point(i, radius * frac);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") + " Z";

  const toPoints = (vals: number[]) =>
    vals
      .map((v, i) => {
        const [x, y] = point(
          i,
          radius * Math.max(0.04, Math.min(v, 100) / 100),
        );
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const valuePoints = toPoints(values);
  const comparePoints = compareValues ? toPoints(compareValues) : null;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto w-full max-w-sm"
      role="img"
      aria-label={`Speaker profile: ${labels
        .map((l, i) => `${l} ${values[i]}`)
        .join(", ")}`}
    >
      {/* grid rings */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <path
          key={f}
          d={ringPath(f)}
          fill="none"
          stroke="var(--border)"
          strokeWidth={f === 1 ? 1.2 : 0.7}
        />
      ))}
      {/* spokes */}
      {labels.map((_, i) => {
        const [x, y] = point(i, radius);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="var(--border)"
            strokeWidth="0.7"
          />
        );
      })}
      {/* baseline web (comparison) */}
      {comparePoints && (
        <polygon
          points={comparePoints}
          fill={compareVariant === "ideal" ? "var(--ok)" : "var(--muted)"}
          fillOpacity={compareVariant === "ideal" ? 0.05 : 0.07}
          stroke={compareVariant === "ideal" ? "var(--ok)" : "var(--muted)"}
          strokeOpacity={compareVariant === "ideal" ? 0.8 : 1}
          strokeWidth="1.3"
          strokeDasharray="4 3"
          strokeLinejoin="round"
        />
      )}
      {/* value web */}
      <polygon
        points={valuePoints}
        fill="var(--accent)"
        fillOpacity="0.18"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {values.map((v, i) => {
        const [x, y] = point(
          i,
          radius * Math.max(0.04, Math.min(v, 100) / 100),
        );
        return <circle key={i} cx={x} cy={y} r="3" fill="var(--accent)" />;
      })}
      {/* labels + values */}
      {labels.map((label, i) => {
        const [x, y] = point(i, radius + 24);
        const anchor =
          Math.abs(x - cx) < 8 ? "middle" : x > cx ? "start" : "end";
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-[var(--muted)] text-[11px]"
          >
            <tspan>{label}</tspan>
            <tspan
              x={x}
              dy="13"
              className="fill-[var(--foreground)] font-mono text-[11px]"
            >
              {values[i]}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}
